var app = angular.module('app', ['ui.bootstrap', 'ngSanitize', 'ui.loader', 'utils.logJSError']);

app.config(['$compileProvider', '$locationProvider', '$logProvider', '$httpProvider', 'uibTimepickerConfig', 'uibDatepickerConfig', 'uibDatepickerPopupConfig', function (
    $compileProvider
    , $locationProvider
    , $logProvider
    , $httpProvider
    , timepickerConfig
    , datepickerConfig
    , datepickerPopupConfig
) {

    // TBD: Set "false" for Production
    $logProvider.debugEnabled(true);

    //extend compile provider to accept some other protocols in the HREF of 'a' elements
    //by default it accepts only http/https
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|data):/);

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: true
    }).hashPrefix('!');


    // I think we need to process any error in one place
    //  
    //$httpProvider.interceptors.push(function ($q, $rootScope) {

    //    return {

    //        request: function (config) {

    //            //the same config / modified config / a new config needs to be returned.
    //            return config;
    //        },

    //        requestError: function (rejection) {

    //            //Initializing error list
    //            if ($rootScope.errorList == undefined) {
    //                $rootScope.errorList = [];
    //            }

    //            $rootScope.errorList.push(rejection.data);

    //            //It has to return the rejection, simple reject call doesn't work
    //            return $q.reject(rejection);
    //        },

    //        response: function (response) {

    //            //the same response/modified/or a new one need to be returned.
    //            return response;
    //        },

    //        responseError: function (rejection, p1, p2, p3) {

    //            //Initializing the error list
    //            if ($rootScope.errorList == undefined) {
    //                $rootScope.errorList = [];
    //            }

    //            //Adding to error list
    //            $rootScope.errorList.push(rejection.data);

    //            //It has to return the rejection, simple reject call doesn't work
    //            return $q.reject(rejection);
    //        }
    //    };
    //});

    //var convert = function (str) {
    //    if (typeof str != "string")
    //        return null;

    //    var d = /\/Date\((-?\d*)(-\d*)\)\//.exec(str);

    //    if (d) {
    //        var min = new Date().getTimezoneOffset(); //fix UTC offset
    //        return new Date(+d[1] + min * 60000);
    //    }

    //    return null;
    //}

    //$httpProvider.interceptors.push(function ($q) {
    //    return {
    //        'response': function (response) {
    //            if (angular.isArray(response.data) && response.data.length > 0) {
    //                angular.forEach(response.data, function (item) {
    //                    for (key in item) {
    //                        var cvt = convert(item[key]);

    //                        if (cvt != null)
    //                            item[key] = cvt;
    //                    }
    //                });
    //            }

    //            return response;
    //        },
    //        'responseError': function (rejection) {
    //            if (!rejection.data || rejection.data.length == 0) {
    //                return $q.reject(null);
    //            }
    //            return $q.reject(rejection);
    //        }
    //    };
    //});


    $httpProvider.interceptors.push("loaderHttpInterceptor");

    timepickerConfig.hourStep = 1;
    timepickerConfig.minuteStep = 15;
    timepickerConfig.meridians = ['AM', 'PM'];
    timepickerConfig.mousewheel = false;
    timepickerConfig.readonlyInput = false;
    timepickerConfig.showMeridian = true;

    datepickerConfig.startingDay = 0;
    datepickerConfig.showWeeks = false;

    datepickerPopupConfig.showButtonBar = true;
    datepickerPopupConfig.appendToBody = true;
    datepickerPopupConfig.datepickerPopup = "MM-dd-yyyy";
}]);


app.run(['$rootScope', function ($rootScope) {

    $rootScope.dateParseFormat = 'yyyy-MM-ddThh:mm:ss.000';

}]);


//slice filter
//use it carefully, it can greatly slow down the repeater!
//any filter is applied each time $digest runs
app.filter('slice', function () {
    return function (arr, start, end) {
        if (arr)
            return arr.slice(start, end);
        return null;
    };
});

app.filter('isnull', function () {

    return function (value, replace) {

        return value ? value : replace;

    };

});

app.service('$regEx', function () {
    var _emailempty = /(^$|^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$)/;
    var _email = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    var _phonefax = /[^\s-]/;
    var _everything = /[^\s]/;
    var _yearMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    var _yearPattern = /^\d{4}$/;
    var _datePattern = /^((\d{4})|(\d{4}-(0[1-9]|1[0-2]))|(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])))$/;
    var _decimalAmountPattern = /^(\d|,){1,8}$|^(\d|,){1,8}\.\d{1,2}$/; //with thousands separators (,)
    var _decimalOrNullAmountPattern_92 = /^$|^\d{1,9}$|^\d{1,9}\.\d{1,2}$/;
    var _decimalOrNullAmountPattern_102 = /^$|^(\d|,){1,8}$|^(\d|,){1,8}\.\d{1,2}$/;//with thousands separators (,)
    var _didjitPattern = /^\d+$/;
    var _notZeroPattern = /^[^\?]+$/;
    var _url = /^((https?):\/\/)?[^\s/$.?#].[^\s]*$/i;
    var _password = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&amp;*()_+])[a-zA-Z\d!@#$%^&amp;*()_+]{6,}$/;
    ///^[^0](\d+)$/;
    return {
        email: _email,
        phonefax: _phonefax,
        emailempty: _emailempty,
        everything: _everything,
        yearMonthPattern: _yearMonthPattern,
        yearPattern: _yearPattern,
        datePattern: _datePattern,
        decimalAmountPattern: _decimalAmountPattern,
        didjitPattern: _didjitPattern,
        notZeroPattern: _notZeroPattern,
        decimalOrNullAmountPattern_92: _decimalOrNullAmountPattern_92,
        decimalOrNullAmountPattern_102: _decimalOrNullAmountPattern_102,
        url: _url,
        password: _password
    };
});

//Language service to provide some shared methods for manage language ID
app.service('$Language', function ($http, $log) {

    var language = function (code, smallCode, active) {
        var self = this;
        self.active = active;
        self.code = code;
        self.smallCode = smallCode;
        self.class = "flag-" + self.smallCode + "-sm";
    };

    var root = this;

    root.Service = function () {

        var self = this;

        self.languages = [
            new language("ENG", "US", true),
            new language("RUS", "RU", false)
        ];

        self.langId = "ENG";

        self.prevLangId = "ENG";

        $http.post('/Session/UpdateLanguage').then(
            function (response) {
                var data = response.data;
                if (data) {
                    if (!self.isDefaultLanguage) {
                        self.langId = data.Id;

                        angular.forEach(self.languages, function (lang) {
                            lang.active = lang.code == self.langId;
                        });
                    }
                }
            }
        );


        self.set = function (id) {

            $log.debug("self.set = function (id=" + id + ")");

            if (angular.isUndefined(id) || id == null || id == '')
                id = "ENG";

            if (self.langId == id)
                return;

            $http.post('/Session/UpdateLanguage', { Id: id }).then(
                function (response) {
                    var data = response.data;
                    if (data) {
                        self.prevLangId = self.langId;
                        self.langId = data.Id;

                        angular.forEach(self.languages, function (lang) {
                            lang.active = lang.code == self.langId;
                        });
                    }
                }
            );
        };

        self.setDefaultLanguage = function () {
            self.isDefaultLanguage = true;
            self.langId = "ENG";
        };

        self.revert = function () {
            self.langId = this.prevLangId;
            angular.forEach(self.languages, function (lang) {
                lang.active = lang.code == self.langId;
            });
        };

    };

    return new root.Service();

});

//date time functions
//app.service('$DateTime', function () {
//    return {
//        convert: function (str) {
//            var d;
//            if (typeof str == "string")
//                d = /\/Date\((-?\d*)(-\d*)\)\//.exec(str);

//            if (d) {
//                var min = new Date().getTimezoneOffset(); //fix UTC offset
//                return new Date(+d[1] + min * 60000);
//            }

//            return null;
//        }
//    };
//});

//base64 encoding. unicode symbols support added!
app.service('$base64', function () {
    return {
        encode: function (str) {
            var b, c, out = '', l = false, i = 0, key6 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                key8 = 'ЂЃ‚ѓ„…†‡?‰Љ‹ЊЌЋЏђ‘’“”•–—!™љ›њќћџ' + String.fromCharCode(160) + 'ЎўЈ¤Ґ¦§Ё©Є«¬' + String.fromCharCode(173) + '®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
                len = str.length;

            while (i < len) {
                out += key6.charAt((b = (((c = str.charCodeAt(i++)) > 127) ? ((c == 65533) ? (152 << 16) : ((((c = key8.indexOf(String.fromCharCode(c)) | 128) < 0) ? 0 : c << 16))) : c << 16) | (((c = str.charCodeAt(i++)) > 127) ? ((c == 65533) ? 152 << 8 : ((((c = key8.indexOf(String.fromCharCode(c)) | 128) < 0) ? 0 : c << 8))) : c << 8) | (((c = str.charCodeAt(i++)) > 127) ? ((c == 65533) ? 152 : ((((c = key8.indexOf(String.fromCharCode(c)) | 128) < 0) ? 0 : c))) : c)) >> 18) + key6.charAt(b >> 12 & 63) + key6.charAt(b >> 6 & 63) + key6.charAt(b & 63);
            }

            return out;
        }
    };
});

//adds draggable to the parent element
app.directive('dragablep', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            element.parent().draggable();
        }
    };
});

//adds draggable to the popups (with default template)
app.directive('popupDraggable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.find(attrs.popupDraggableHandler).css("cursor", "move");
            element.parent().draggable({
                handle: attrs.popupDraggableHandler
            });
        }
    };
});

//adds resizeble to element
app.directive('resizable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var self = this;
            self.resMode = attrs.resizableMode;
            self.snap = attrs.resizableSnap;
            self.lines = attrs.resizableLines;

            self.resizebleHandler = {
                resize: function (event, ui) {
                    scope.pageElements = Math.round(ui.size.height / parseInt(self.snap));
                }
            };

            this.vertical = function (elem) {
                self.resizebleHandler.maxWidth = self.resizebleHandler.minWidth = elem.width();
                self.resizebleHandler.minHeight = parseInt(self.snap) * parseInt(self.lines);
                self.resizebleHandler.grid = parseInt(self.snap);
            };

            switch (self.resMode) {
                case 'vertical':
                    this.vertical(element);
                    break;
            }

            element.resizable(self.resizebleHandler);
        }
    };
});

//disables 'onclick' event
app.directive('disableclick', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            element.click(function (e) {
                e.stopPropagation();
            });
        }
    };
});

//adds slim scroll to an element
app.directive('scrollable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.slimScroll({
                height: attrs.scrollableHeight,
                wheelStep: 1
            });
        }
    };
});

//adds numeric spinner to text box
app.directive('numberInput', function () {
    return {
        restrict: 'A',
        require: '?^ngModel',
        replace: true,
        transclude: true,
        link: function (scope, element, attrs, ngModelCtrl) {

            var set = function (event, ui, value) {
                var val;
                var min = attrs.numberMin || 0;
                var max = attrs.numberMax || 100;

                if (value)
                    val = parseInt(value);
                else
                    val = min;

                if (val < min)
                    val = min;

                if (val > max)
                    val = max;

                element.val(val);
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(val);
                });
            };

            var opts = {
                min: attrs.numberMin || 0,
                max: attrs.numberMax || 100,
                step: 1,
                icons: {
                    down: "icon-chevron-down",
                    // down: "ui-icon-carat-1-s",
                    up: "icon-chevron-up"
                    // up: "ui-icon-carat-1-n"
                },
                create: function (e, ui) {
                    set(e, ui, ui.value);
                },
                change: function (e, ui) {
                    set(e, ui, element.spinner('value'));
                }
            };

            $(function () {
                element.spinner(opts);
            });
        }
    };
});

//multiselect dropdown control
app.directive('multiselectDropdown', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            items: '=',
            selectId: '@',
            selectedValue: '=?',
            desc: '@'
        },
        templateUrl: '/Parts/MultiselectDropdownTemplate',
        link: function (scope, elem, attrs) {
            if (typeof (attrs.singleSelect) != "undefined")
                scope.multiselect = false;
            else
                scope.multiselect = true;
        },
        controller: function ($scope) {
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

            if (!$scope.multiselect) {
                //ngRepeat creates new scope as a child of the directive scope, so the binding of selectedValue inside ng-repeat should looks like:
                //ng-model='$parent.$parent.selectedValue'
                //but double $parent blows up the Angular parser (despite the fact that it exists), so this workaround was created to avoid $parent.$parent construction
                $scope.selected = { value: $scope.selectedValue };

                $scope.$watch(function () {
                    return $scope.selected.value;
                }, function (val) {
                    $scope.selectedValue = val;

                    angular.forEach($scope.items, function (item) {
                        item.Selected = item.Id == val;
                    });
                });

                $scope.$watch(function () {
                    return $scope.selectedValue;
                }, function (val, oldVal) {
                    if (val != oldVal)
                        $scope.selected.value = val;
                });
            }
        }
    };
});

//hierarchical multiselect dropdown control
app.directive('multiselectDropdownHierarchical', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            items: '=',
            selectId: '@',
            ctrlId: '@',
            ctrlClass: '=?',
            selectedValue: '=?'
        },
        templateUrl: '/Parts/HierarchicalMultiselectDropdownTemplate',
        link: function (scope, elem, attrs) {
            if (typeof (attrs.singleSelect) != "undefined")
                scope.multiselect = false;
            else
                scope.multiselect = true;
        },
        controller: function ($scope) {
            //TODO: move it to app.filter. Create the scope of filters for tree
            $scope.ParentOnly = function () {
                return function (item) {
                    return (item.ParentId != null && item.Id == item.ParentId) || item.ParentId == null;
                };
            };
            //TODO: move it to app.filter. Create the scope of filters for tree
            $scope.ParentHasChildren = function () {
                return function (item) {
                    return item.ParentId != null;
                };
            };
            //TODO: move it to app.filter. Create the scope of filters for tree
            $scope.ChildrenByParentId = function (parentId) {
                return function (item) {
                    return item.ParentId == parentId && item.Id != parentId;
                };
            };

            $scope.childCheckChange = function (parent, child) {
                //commented to let search only by parent
                //if all childs deselected then parent deselected too
                //if ($scope.multiselect) {

                //    if (!child.Selected) {
                //        var isAnyChildSelected = false;
                //        angular.forEach($scope.items, function (item) {
                //            if (!isAnyChildSelected) {
                //                if (item.ParentId == child.ParentId)
                //                    isAnyChildSelected = item.Selected;
                //            }
                //        });

                //        parent.Selected = isAnyChildSelected;
                //    }
                //}
            };

            $scope.parentCheckChange = function (parent, obj) {
                if (parent.ParentId == parent.Id || !(parent.ParentId)) {
                    for (key in obj) {
                        if (obj[key].ParentId == parent.Id) {
                            obj[key].Selected = parent.Selected;
                        }
                    }
                }

            };

            $scope.hasChildren = function (parent) {
                var result = false;

                angular.forEach($scope.items, function (item) {
                    if (item.ParentId == parent.Id && item.Id != parent.Id)
                        result = true;
                });

                return result;
            };

            $scope.selectedList = function (obj) {
                if (typeof (obj) != "object")
                    return 'nothing selected ';

                var i = 0;
                var s = '';

                for (key in obj) {
                    if (obj[key].Selected == true) {
                        angular.forEach($scope.items, function (item) {
                            if (item.Id != obj[key].Id && item.Id == obj[key].ParentId)
                                s += item.Value + ' \\ ';
                        });

                        s += obj[key].Value;
                        i++;
                    }
                }

                return i == 0 ? 'nothing selected ' : i == 1 ? s : i + ' selected';
            };

            if (!$scope.multiselect) {
                //ngRepeat creates new scope as a child of the directive scope, so the binding of selectedValue inside ng-repeat should looks like:
                //ng-model='$parent.$parent.selectedValue'
                //but double $parent blows up the Angular parser (despite the fact that it exists), so this workaround was created to avoid $parent.$parent construction
                $scope.selected = { value: $scope.selectedValue };

                $scope.$watch(function () {
                    return $scope.selected.value;
                }, function (val) {
                    $scope.selectedValue = val;

                    angular.forEach($scope.items, function (item) {
                        item.Selected = item.Id == val;
                    });
                });

                $scope.$watch(function () {
                    return $scope.selectedValue;
                }, function (val, oldVal) {
                    if (val != oldVal)
                        $scope.selected.value = val;
                });
            }
        }
    };
});

//disable routing provider link rewrite
app.directive('stopUrlRewrite', function () {
    return {
        restrict: 'A',
        link: function () {
            $('body').find('a').filter(function () {
                return typeof ($(this).attr('target')) == 'undefined';
            }).each(function () {
                $(this).attr('target', '_self');
            });
        }
    };
});

app.directive('numberFormat', ['$filter', function ($filter) {
    return {
        require: '?ngModel',
        link: function (scope, elem, attrs, ctrl) {
            if (!ctrl) return;

            ctrl.$parsers.unshift(function (value) {
                if (attrs.numberFormat == "decimal") {
                    elem.mask("#,##0.00", { reverse: true, maxlength: false });
                } else {
                    elem.mask("#,##0", { reverse: true, maxlength: false });
                }

                return elem[0].value.replace(/[^\d.]/g, '');
            });

            ctrl.$formatters.unshift(function (value) {
                elem[0].value = ctrl.$modelValue;
                if (attrs.numberFormat == "decimal") {
                    if (value && elem[0].value.indexOf(".") == -1) elem[0].value = ctrl.$modelValue * 100;
                    elem.mask("#,##0.00", { reverse: true, maxlength: false });
                } else {
                    elem.mask("#,##0", { reverse: true, maxlength: false });
                }
                return elem[0].value;
            });
        }
    };
}]);

app.directive('htmlContentOf', function () {
    return {
        restrict: 'AE',
        scope: {
            bindTo: '=?',
            html: '='
        },
        link: function (scope, element) {
            scope.$watch('bindTo', function (val) {
                scope.html = $(element).html();
            });
        }
    };
});

app.directive('countrySelect', function ($Language, $http) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/Parts/CountrySelectTemplate',
        scope: {
            cssClass: '@',
            countryId: '=',
            selected: "=?",
            isRequired: '=',
            cssClassMethod: '=',
            inputId: '@'
        },
        controllerAs: 'country',
        controller: function ($scope) {
            var self = this;
            self.Countries = [];
            self.LanguageId = null;

            var load = function () {
                if (self.LanguageId == $Language.langId)
                    return;

                self.LanguageId = $Language.langId;

                var loadData = {
                    LanguageId: $Language.langId
                };

                $http({ url: '/Service/Countries', data: loadData, method: "POST" }).then(
                    function (response) {

                        var data = response.data;

                        self.Countries = data || [];

                    }
                );
            };

            self.init = function () {
                load();
            };

            $scope.$watch(function () { return $Language.langId; }, function (newVal, oldVal) {
                if (newVal == oldVal || oldVal == 0)
                    return;

                load();
            });

            $scope.$watch('countryId', function (newVal, oldVal) {
                if (newVal == oldVal || newVal == 0)
                    return;
                $scope.select();
            });

            $scope.select = function () {
                angular.forEach(self.Countries, function (item) {
                    if (item.Id == $scope.countryId)
                        $scope.selected = item;
                });
            };
        }
    };
});

app.directive('stateSelect', function ($Language, $http) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/Parts/StateSelectTemplate',
        scope: {
            cssClass: '@',
            countryId: '=',
            stateId: '='
        },
        controllerAs: 'state',
        controller: function ($scope) {
            var self = this;
            self.States = [];
            self.countryId = $scope.countryId;
            self.LanguageId = null;

            var load = function (countryId) {
                if (self.LanguageId == $Language.langId && self.countryId == countryId)
                    return;

                self.LanguageId = $Language.langId;
                self.countryId = countryId;

                var loadData = {
                    Id: countryId,
                    LanguageId: $Language.langId
                };

                $http({ url: '/Service/States', data: loadData, method: "POST" }).then(
                    function (response) {
                        var data = response.data;
                        self.States = data || [];
                        $scope.stateLoaded = true;
                    }
                );
            };

            $scope.$watch('countryId', function (newVal, oldVal) {
                //if (newVal === oldVal || newVal == 0)
                //    return;
                if (newVal != oldVal && oldVal) {
                    $scope.stateId = 0;
                }

                if (newVal) {
                    load(newVal);
                }
            });

            $scope.$watch(function () { return $Language.langId; }, function (newVal, oldVal) {
                if (newVal === oldVal || oldVal === 0)
                    return;

                if (newVal)
                    load($scope.countryId);
            });
        }
    };
});

app.directive('citySelect', function ($Language, $http, $log) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/Parts/CitySelectTemplate',
        scope: {
            cssClass: '@',
            stateId: '=?',
            cityId: '=',
            cityName: '=',
            countryId: '=?',
            withoutState: '=?' //there is no select for state on the page
            , model: "=ngModel"
        },
        controllerAs: 'city',
        controller: function ($scope) {

            // $log.debug("city controller" + new Date());

            var self = this;

            if (typeof $scope.withoutState == "undefined")
                $scope.withoutState = typeof $scope.stateId == "undefined" || $scope.stateId == null;

            self.load = function () {

                //$log.debug("citySelect. self.load");

                self.isLoading = true;

                var loadData = {
                    Id: $scope.cityId,
                    LanguageId: $Language.langId
                };
                $http({ url: '/Service/City', data: loadData, method: "POST" }).then(
                    function (response) {
                        var data = response.data;
                        $scope.cityName = data.Content;
                        self.isLoading = false;
                    }, function (response) {
                        self.isLoading = false;
                    }
                );
            };

            self.search = function (name) {
                self.isSearch = true;
                // $log.debug('withoutState=', $scope.withoutState);
                var loadData = {
                    // Id: $scope.withoutState ? 0 : $scope.stateId,
                    WithoutState: $scope.withoutState,
                    Id: $scope.stateId,
                    Content: name,
                    LanguageId: $Language.langId,
                    ParentId: $scope.countryId
                };
                return $http({ url: '/Service/Cities', data: loadData, method: "POST" }).then(
                    function (response) {
                        var data = response.data;
                        return data;
                    }
                );
                //).then(function (response) {
                //    return response.data;
                //});
            };

            self.set = function (item) {
                $scope.cityId = item.Id;
                if ($scope.withoutState)
                    $scope.stateId = item.ParentId;
                self.isSearch = false;
            };

            //$scope.$watch('cityId', function (newVal, oldVal) {
            //    if ($scope.cityId && !$scope.cityName && !self.IsLoading) {
            //        load();
            //    }
            //});

            $scope.$watch('stateId', function (newVal, oldVal) {
                //$log.debug("watch stateId " + new Date());
                if ($scope.withoutState) return;
                if ($scope.cityId && !$scope.cityName)
                    self.load();
                if (newVal === oldVal || oldVal === 0)
                    return;
                if (oldVal && newVal !== 0) {
                    $scope.cityId = 0;
                    $scope.cityName = '';
                } else self.load();

            });

            $scope.$watch('countryId', function (newVal, oldVal) {
                //$log.debug("watch countryId " + new Date());
                if (newVal === oldVal || oldVal === 0)
                    return;
                if (oldVal) {
                    $scope.cityId = 0;
                    $scope.cityName = '';
                }

            });

            $scope.$watch(function (scope) {

                //$log.debug("watch 1 " + new Date());

                //$log.debug("watch 1. scope.cityId" + scope.cityId);
                //$log.debug("watch 1. scope.cityName" + scope.cityName);
                //$log.debug("watch 1. scope.city.isLoading" + scope.city.isLoading);
                //$log.debug("watch 1. scope.city.isSearch" + scope.city.isSearch);

                if (scope.cityId && !scope.cityName && !scope.city.isLoading && !scope.city.isSearch)
                    scope.city.load();

                return $Language.langId;

            }, function (newVal, oldVal) {

                // $log.debug("watch 2 " + new Date());

                if (newVal == oldVal || oldVal == 0)
                    return;

                self.load();

            });
        }
        //, link: linker
    };

    //function linker(scope, el, attrs) {

    //    $log.debug("link " + new Date());

    //    scope.scope = scope;

    //    $log.debug("scope.scope.cityId = " + scope.scope.cityId);
    //    $log.debug("scope.scope.cityName = " + scope.scope.cityName);

    //    if (scope.scope.cityId && !scope.scope.cityName && !scope.IsLoading)
    //        scope.city.load();

    //    scope.$watch("model", function (newVal, oldVal) {
    //        console.log("Changed " + new Date());
    //    });
    //}

});

app.directive('organizationSelect', function ($Language, $http, $filter) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/Parts/OrganizationSelectTemplate',
        scope: {
            cssClass: '@',
            selected: '=',
            isRequired: '=',
            cssClassMethod: '=',
            inputId: '@',
            blurMethod: '&'
        },
        controllerAs: 'org',
        controller: function ($scope) {
            var self = this;
            self.organization = $scope.selected || '';
            self.orgName = angular.isDefined(self.organization) ? self.organization.Name : '';

            self.set = function (item) {
                self.organization = item;
            };

            //for typed names
            self.selectname = function () {
                if (angular.isUndefined(self.orgName)) return;
                if (self.organization.Id == 0 && self.orgName.length > 0) {
                    var loadData = {
                        LanguageId: $Language.langId,
                        Content: self.orgName
                    };

                    $http({ url: '/Service/OrgSearch', data: loadData, method: "POST" }).then(
                        function (response) {
                            var data = response.data;
                            var item = $filter('filter')(data, { Name: self.orgName }, true)[0];
                            if (!angular.isUndefined(item)) {
                                self.organization = item;
                                $scope.selected = self.organization;
                            }
                        }
                    );

                }
            };

            self.search = function (val) {
                var loadData = {
                    LanguageId: $Language.langId,
                    Content: val
                };

                return $http({ url: '/Service/OrgSearch', data: loadData, method: "POST" }).then(
                    function (response) {
                        var data = response.data;
                        return data;
                    }
                );

            };

            $scope.$watch(function () { return self.orgName; }, function (newVal, oldVal) {
                if (newVal == oldVal)
                    return;

                if (self.orgName != self.organization.Name)
                    if ($Language.langId == "ENG")
                        self.organization = { Name: self.orgName, Id: 0 };
                    else {
                        self.organization.Name = self.orgName;
                        if (!angular.isUndefined(self.organization.OrgId))
                            self.organization.Id = self.organization.OrgId;
                    }

                $scope.selected = self.organization;
            });

            // detect outside changes and update our input
            $scope.$watch('selected', function (item) {
                if (item && self.orgName != item.Name && item.Id != 0) {
                    self.orgName = item.Name;
                    self.organization = item;
                }
            });

        }
    };
});

app.directive('dictionarySelect', function ($Language, $http) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/Parts/DictionarySelectTemplate',
        scope: {
            cssClass: '@',
            selectedId: '=',
            dictionaryId: '@',
            selected: "=?"
        },
        controller: function ($scope) {
            $scope.items = [];

            $scope.init = function () {
                var loadData = {
                    LanguageId: $Language.langId,
                    Id: $scope.dictionaryId
                };

                $http.post('/Service/Dictionary', loadData).then(
                    function (response) {
                        $scope.items = response.data;
                    }
                );
            };

            $scope.$watch(function () { return $Language.langId; }, function (newVal, oldVal) {
                if (newVal == oldVal || oldVal == 0)
                    return;

                $scope.init();
            });

            $scope.select = function () {
                angular.forEach($scope.items, function (item) {
                    if (item.Id == $scope.selectedId)
                        $scope.selected = item;
                });
            };
        }
    };
});

app.directive('formatteddate', function ($filter) {
    return {
        restrict: 'EA',
        require: 'ngModel', // get a hold of NgModelController

        link: function (scope, element, attrs, ngModel) {
            var model = ngModel;

            ngModel.$parsers.push(function (viewValue) {
                if (typeof model.$viewValue != "string")
                    return viewValue;

                var newDate = model.$viewValue.replace(/[.-]/gi, '/');
                var timestamp = Date.parse(newDate);

                if (!isNaN(timestamp)) {
                    model.$setValidity('date', true);
                    var date = new Date(newDate);
                    model.$setViewValue(date);
                    return date;
                }

                return viewValue;
                // build a new date according to initial localized date format
                //if (newDate && format === "dd-MM-yyyy" && /\d{2}-\d{2}-\d{4}/.test(newDate)) {
                //    // extract day, month and year
                //    var splitted = newDate.split('-');

                //    var month = parseInt(splitted[1]) - 1;
                //    date = new Date(splitted[2], month, splitted[0]);

                //    model.$setValidity('date', true);
                //    model.$setViewValue(date);
                //}
                //return date ? date : viewValue;
            });
        }
    };
});

app.directive('optionsDisabled', function ($parse) {

    var disableOptions = function (scope, attr, element, data, fnDisableIfTrue) {
        // refresh the disabled options in the select element.
        var options = element.find("option");
        for (var index = 1; index < options.length; index++) {
            var elem = angular.element(options[index]);
            if (elem.val() != "") {
                var locals = {};
                locals[attr] = data[index - 1];
                var d = fnDisableIfTrue(scope, locals) ? false : true;
                elem.attr("disabled", d);
            }
        }
    };

    return {
        priority: 0,
        require: 'ngModel',
        link: function (scope, iElement, iAttrs, ctrl) {
            // parse expression and build array of disabled options
            var expElements = iAttrs.optionsDisabled.match(
                /^\s*(.+)\s+for\s+(.+)\s+in\s+(.+)?\s*/);
            var attrToWatch = expElements[3];
            var fnDisableIfTrue = $parse(expElements[1]);
            scope.$watch(attrToWatch, function (newValue, oldValue) {
                if (newValue)
                    disableOptions(scope, expElements[2], iElement, newValue, fnDisableIfTrue);
            }, true);
            // handle model updates properly
            scope.$watch(iAttrs.ngModel, function (newValue, oldValue) {
                var disOptions = $parse(attrToWatch)(scope);
                if (newValue) {
                    disableOptions(scope, expElements[2], iElement, disOptions, fnDisableIfTrue);
                }
            });
        }
    };
});

app.directive('fileUpload', [function () {
    return {
        scope: true, //create a new scope
        link: function (scope, el, attrs) {

            el.bind('change', function (event) {

                var files = event.target.files;

                if (files && files.length) {

                    scope.$emit("filesSelected", { files: files });

                    //iterate files since 'multiple' may be specified on the element
                    //for (var i = 0; i < files.length; i++) {
                    //    //emit event upward
                    //    scope.$emit("fileSelected", { file: files[i] });
                    //}
                }
                else {
                    scope.$emit("filesSelected", { files: null, field: event.target.name });
                }
            });
        }
    };
}]);
