var SearchCtrl = function ($scope, $http, $log, $timeout, $filter, $base64, $Language) {

    $log.debug('SearchCtrl is loaded');

    var self = this;

    $scope.config = null;
    $scope.indexedResults = {};
    $scope.filteredResult = [];

    $scope.refreshMultiline = 0;
    $scope.dictionaries = {};

    $scope.fileName = '';
    $scope.searchData = {};
    $scope.pdfSearchData = {};
    $scope.excelPattern = {};
    $scope.searchResult = [];
    $scope.filteredResult = [];
    $scope.alerts = [];

    $scope.page = 1;
    $scope.pageElements = 20;
    $scope.numPages = 0;

    $scope.collapsed = false;
    //$scope.sxcelString = '';
    //$scope.csvString = '';

    $scope.csvContent = '';
    $scope.dateFromOpened = false;
    $scope.dateToOpened = false;

    //watch for language change
    $scope.$watch(
        function () { return $Language.langId; }
        , function (langId, oldId) {

            //workaround to prevent initial watch call and get endless recursion
            if (langId === oldId)
                return;

            $log.debug("function (langId, oldId)");

            $scope.initDicts();

            if ($scope.searchResult.length > 0)
                $scope.search();
        }
        , true
    );

    //add error message
    $scope.addError = function (text) {
        $scope.alerts.push({ msg: text, type: 'error' });
    };
    //close message
    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    //clear all messages
    $scope.clearAlerts = function () {
        $scope.alerts = [];
    };
    //TODO: move datepicker to directive and remove this from controller
    $scope.selectedList = function (obj) {
        if (typeof (obj) != "object")
            return 'nothing selected ';

        var i = 0;
        var s = '';

        for (key in obj) {
            if (obj[key].Selected == true) {
                s = obj[key].Value;
                i++;
            }
        }

        return i == 0 ? 'nothing selected ' : i == 1 ? s : i + ' selected';
    };

    //load dropdowns content from server
    $scope.initDicts = function () {

        $log.debug("$scope.initDicts");

        $http.post($scope.config.iurl, { LanguageId: $Language.langId }).then(

            function (response) {

                var data = response.data;

                $scope.pageElements = data.PageElements;

                for (key in data) {
                    if (typeof (data[key]) == "object") {
                        $scope.dictionaries[key] = data[key];
                    }
                }

            }
            , function (response) {
                $scope.addError('Data initialization error.');
            }
        );
    };

    //initialization
    $scope.init = function (config) {

        $log.debug("$scope.init");

        $scope.clearAlerts();
        $scope.config = config;

        if (!angular.isUndefined($scope.config.format))
            $scope.excelPattern = angular.fromJson($scope.config.format);

        var d = new Date();
        $scope.fileName = d.getMonth() + '.' + d.getDate() + '.' + d.getFullYear() + '_' + $scope.config.key;
        $scope.initDicts();

        $scope.searchData = angular.fromJson(localStorage.getItem('OWDB.' + $scope.config.key + '.searchData')) || {};
        $scope.setSearchResult(angular.fromJson(localStorage.getItem('OWDB.' + $scope.config.key)));

        $scope.searchData.RoleAny = 'True';
        $scope.newPage = true;
        if ($scope.config.isCollapsed) {
            $scope.searchIsCollapsed = $scope.config.isCollapsed;
            $timeout(function () {
                $scope.search();
            });
        }
    };

    //obsolete
    $scope.getShortName = function (str, len) {
        if (typeof (str) != "string")
            return "";

        if (str.length <= len)
            return str;

        return str.substring(0, len - 3) + '...';
    };

    //obsolete
    $scope.getPopover = function (str, len) {
        if (str.length > len)
            return str;

        return null;
    };

    //compose an url to detail page
    $scope.getDetailUrl = function (id) {
        // return $scope.config.durl + '/' + id;
        return $scope.config.durl + id;
    };

    //search routine
    $scope.search = function () {

        $log.debug("$scope.search");

        $scope.clearAlerts();

        $scope.searchData.LanguageId = $Language.langId;
        localStorage.setItem('OWDB.' + $scope.config.key + '.searchData', angular.toJson($scope.searchData));
        localStorage.setItem('OWDB.' + $scope.config.key + '.currentPage', angular.toJson($scope.page));
        $scope.pdfSearchData = $scope.searchData;

        for (var dict in $scope.dictionaries) {
            $scope.searchData[dict] = [];
            angular.forEach($scope.dictionaries[dict], function (item) {
                if (item.Selected)
                    $scope.searchData[dict].push(item);
            });
        }

        $http.post($scope.config.surl, $scope.searchData).then(
            function (response) {
                $log.debug("$scope.config.surl. OK.");
                var data = response.data;
                $scope.setSearchResult(data);
                localStorage.setItem('OWDB.' + $scope.config.key, angular.toJson(data));
            }
            , function (response) {
                $scope.addError('Search error.');
            }
        );
    };

    //clear search data
    $scope.reset = function () {

        $log.debug("$scope.reset");

        $scope.searchData = {};

        for (var dict in $scope.dictionaries) {
            angular.forEach($scope.dictionaries[dict], function (item) {
                if (item.Selected)
                    item.Selected = false;
            });
        }

        $scope.searchData.RoleAny = 'True';
        $scope.clearAlerts();
        $scope.refreshMultiline++;
    };

    //download PDF
    $scope.loadPDF = function (urlPdf, urlInit) {

        $log.debug("$scope.loadPDF");

        if ($scope.searchResult.length == 0)
            return;

        $http.post(urlInit, $scope.pdfSearchData).then(
            function (response) {
                var data = response.data;
                $.fileDownload(urlPdf, {});
            }
            , function (response) {
                $scope.addError('Unable to load pdf.');
            }
        );
    };

    //just a setter
    $scope.setSearchResult = function (val) {

        $scope.searchResult = val || [];
        $scope.indexedResults = {};
        $scope.filteredResult = [];

        if ($scope.searchResult.length > 0) {
            if ($scope.searchResult.length > 1000) {
                $scope.alerts.push({ msg: 'Your search has produced more than allowed rows. Only 1,000 rows are displayed. Please use search fields to narrow your search.', type: 'info' });
                $scope.searchResult.splice(1000, 1); //remove las result that is only for overflow signal
            }

            try {
                $scope.setExcelString($scope.generateExcelString());
                $scope.setCSVString($scope.generateCSVString());
            }
            catch (err) { }
        }

        $scope.refreshMultiline++;
    };

    $scope.getOrderKey = function (val) {
        var arr = val.split(',');
        if (arr.length == 1) $scope.orderKey = arr[0];
        else {
            var val0 = $scope.reverse == true ? '-' + arr[0] : arr[0];
            $scope.orderKey = [];
            $scope.orderKey.push(val0);
            for (var i = 1; i < arr.length; i++) {
                $scope.orderKey.push(arr[i]);
            }
        }
        $scope.isArrayOrderKey = angular.isArray($scope.orderKey);
    };

    $scope.filterGroups = function (groupName) {
        return function (item) {
            var indexedItem = $scope.indexedResults[item[groupName]];
            var itemIsNew = typeof indexedItem == "undefined" || angular.toJson(indexedItem) == angular.toJson(item);

            if (itemIsNew) {
                $scope.indexedResults[item[groupName]] = item;
            }

            return itemIsNew;
        }
    }

    $scope.filterGroup = function (groupName, group) {
        return function (item) {
            return item[groupName] == group[groupName];
        }
    }

    $scope.filteredResultHash = {
        key: '',
        reverse: false,
        filter: '',
        compare: function (key, reverse, filter) {
            return key == this.key && reverse == this.reverse && filter == this.filter;
        }
    };

    $scope.getFilteredResult = function (orderKey, orderReverse, filter) {
        var start = ($scope.page - 1) * $scope.pageElements;
        var end = ($scope.page - 1) * $scope.pageElements + $scope.pageElements;

        //(searchResult | orderBy:orderKey:reverse | filter:searchFilter)) | slice:(page - 1) * pageElements:(page - 1) * pageElements + pageElements
        if (!$scope.filteredResultHash.compare(orderKey, orderReverse, filter)) {
            $scope.filteredResult = $filter('filter')($scope.searchResult, filter);
            $scope.filteredResult = $filter('orderBy')($scope.filteredResult, orderKey, orderReverse);

            $scope.filteredResultHash.key = orderKey;
            $scope.filteredResultHash.reverse = orderReverse;
            $scope.filteredResultHash.filter = filter;
        }

        return $scope.filteredResult.slice(start, end);
    }
};

app.controller('SearchCtrl', SearchCtrl);