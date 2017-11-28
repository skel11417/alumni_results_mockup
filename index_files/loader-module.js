(function () {

    "use strict"

    angular
        .module("ui.loader", [])
        .directive("loader", ["$log", function ($log) {

            return function ($scope, element, attrs) {
                $scope.$on("loader_show", function () {
                    $log.debug("loader_show");
                    return element.show();
                });
                return $scope.$on("loader_hide", function () {
                    $log.debug("loader_hide");
                    return element.hide();
                });
            };

        }])
        .factory("loaderHttpInterceptor", ["$q", "$rootScope", "$log", function ($q, $rootScope, $log) {

            var numLoadings = 0;

            return {

                request: function (config) {

                    $log.debug("loaderHttpInterceptor. request. url=" + config.url);

                    numLoadings++;

                    var f = true;
                    f &= config.url != '/Service/OrgSearch';
                    f &= config.url != '/Application/NominatorSearch';
                    f &= config.url != '/Service/City';
                    f &= config.url != '/Service/Cities';
                    f &= config.url != '/POD/PeopleSearch';

                    if (f)
                        $rootScope.$broadcast("loader_show");

                    return config || $q.when(config);

                },

                response: function (response) {

                    $log.debug("loaderHttpInterceptor. response");

                    if ((--numLoadings) === 0) {
                        // Hide loader
                        $rootScope.$broadcast("loader_hide");
                    }

                    return response || $q.when(response);

                },

                responseError: function (response) {

                    $log.debug("loaderHttpInterceptor. responseError");

                    if (!(--numLoadings)) {
                        // Hide loader
                        $rootScope.$broadcast("loader_hide");
                    }

                    return $q.reject(response);
                }

            };
        }])
})();