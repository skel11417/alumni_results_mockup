(function () {

    "use strict"

    angular.module("utils.logJSError", [])
        .constant("logJSErrorConfig", {
            urlAPILogger: "https://loggerapi.pintl.local"
        })
        .provider('$exceptionHandler', {
            $get: function(errorLogService) {
                return (errorLogService);
            }
        })
        .factory("logJSErrorConfigService", [
            "logJSErrorConfig", function(logJSErrorConfig) {
                return ({
                    urlAPILogger: function() { return logJSErrorConfig.urlAPILogger; }
                });
            }
        ])
        .factory("stacktraceService", function() {
            return ({
                print: function() { return "TBD: printStackTrace"; }
            });
        })
        .factory("errorLogService", [
            "$log", "$window", "stacktraceService", "logJSErrorConfigService", function($log, $window, stacktraceService, logJSErrorConfigService) {

                function log(exception, cause) {

                    $log.error.apply($log, arguments);

                    try {

                        var errorMessage = JSON.stringify(exception);
                        var stackTrace = stacktraceService.print({ e: exception });
                        var urlAPILogger = logJSErrorConfigService.urlAPILogger();

                        // We can't use $http.post because of
                        // Circular dependency: $rootScope <- $http <- errorLogService <- $exceptionHandler <- $rootScope
                        /*$.ajax({
                        type: "POST",
                        url: urlAPILogger,
                        contentType: "application/json",
                        data: angular.toJson({
                            errorUrl: $window.location.href,
                            errorMessage: errorMessage,
                            stackTrace: stackTrace,
                            cause: ( cause || "" )
                        })
                    });*/

                        $log.debug(errorMessage);

                    } catch (loggingError) {
                        $log.warn("Error logging failed");
                        $log.log(loggingError);
                    }

                }

                return (log);

            }
        ]);

})();