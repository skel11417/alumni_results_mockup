var LanguageCtrl = function ($scope, $http, $Language) {
    $scope.setUrl = '';
    $scope.languages = [];

    $scope.selectLanguage = function (e, language) {
        e.preventDefault();
        $Language.set(language.code);
    };

    $scope.$watch(function () { return $Language.languages; }, function (languages) {
        $scope.languages = languages;
    });

    $scope.init = function (config) {
        if (config.hideLanguageBar)
            $Language.setDefaultLanguage();
    };    
};

app.controller('LanguageCtrl', LanguageCtrl);