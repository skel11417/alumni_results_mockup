//Util class to handle multiply forms
var FormsDescriptor = function (forms) {
    var self = this;

    self.forms = forms;
    self.$setPristine = function () {
        angular.forEach(self.forms, function (form) {
            form.$setPristine();
        });
    };
    self.$dirty = function () {
        var dirty = false;

        angular.forEach(self.forms, function (form) {
            if (!form) return;

            if (form.$dirty)
                dirty = true;
        });

        return dirty;
    };
    self.$valid = function () {
        var valid = true;

        angular.forEach(self.forms, function (form) {
            if (!form) return;

            var formValid = (form.$dirty && form.$valid) || !form.$dirty;

            if (!formValid) {
                valid = false;
            }
        });

        return valid;
    };
};

var TabDescriptor = function (name, callback) {
    var self = this;

    self.name = name;
    self.loaded = false;
    self.callback = callback;

    self.onselect = null;
    self.load = function () {
        self.loaded = true;

        if (typeof (self.callback) == "function")
            self.callback();
    };
};

var TabsDescriptor = function (tabs, loadCallback) {
    var self = this;

    self.tabs = tabs;
    self.selected = null;

    self.onchange = [];

    self.load = loadCallback;
    self.select = function (name) {
        //run all onchange events (before change)
        if (self.onchange.length > 0) {
            angular.forEach(self.onchange, function (callback) {
                //first - tab from, second - tab to
                callback(self.selected.name, name);
            });
        }

        self.selected = self.tabs[name];

        if (!self.selected.loaded)
            self.load(name, self.selected.onselect);
    };
};

var podDetailCtrl = function ($rootScope, $scope, $http, $Language, $timeout, $window, $location, $regEx, $filter, $uibModal, $log, uibDateParser) {
    var self = this;

    self.forms = null;
    self.FormsDescriptor = null;
    self.tabs = {};

    self.load = function (tab, callback) {
        var loadModel = {
            Id: $scope.config.id,
            LanguageId: self.langId,
            Tab: tab,
            IsFirstLoad: $scope.isFirstLoad,
            ProgramId: $scope.config.programId
        };
        $scope.load = true;

        $scope.openLinkInNewWindow = function (link) {
            $window.open(link);
        }

        //console.log(loadModel);
        $http.post($scope.config.urlInitPOD, loadModel).then(
            function (response) {
                var data = response.data;
                //to prevent erasing of filled data during creating new application
                if ($scope.config.id != 0 || $scope.isFirstLoad)
                    angular.extend($scope.model, data);
                //console.log($scope.model);
                //all arrays in the model are dictionaries, so we can initialize dictionaries this way
                //and if we want to add a dictionary we don't need to modify this
                if ($scope.isFirstLoad) {
                    angular.forEach($scope.model, function (val, key) {
                        if (angular.isArray(val) && key != "Participants") {//exclude Participants[]
                            $scope.dictionaries[key] = angular.copy(val);
                            $scope.model[key] = null;
                        }
                    });
                }
                $scope.load = false;
                $scope.isFirstLoad = false;
                self.tabs[tab].load();

                if (typeof (callback) == "function") {
                    callback();
                }
            }
            , function () {
                $scope.showAlert('error', "Error occurred while loading data.");
            }
        );
    };
    /*init tabs*/
    self.tabs.General = new TabDescriptor("General", function () {
        $scope.selectedGranteeOrganization = $scope.model.POD.GranteeOrganization;
        $scope.selectedLogisticOrganization = $scope.model.POD.LogisticOrganization;
        $scope.selectedLocalHostOrganization = $scope.model.POD.LocalHostOrganization;
        $scope.selectedPlacementCity = $scope.model.POD.PlacementCity;
        $scope.selectedGrant = $scope.model.POD.Grant;

        $scope.localHostOrganizationUpdate();

        $scope.granteeOrganizationName = $scope.model.POD.GranteeOrganization.Name;
        $scope.logisticOrganizationName = $scope.model.POD.LogisticOrganization.Name;
        $scope.localHostOrganizationName = $scope.model.POD.LocalHostOrganization.Name;
        $scope.placementCityName = $scope.model.POD.PlacementCity.CityStateCode;
        $scope.grantNumber = $scope.model.POD.Grant.Value;

        $scope.model.POD.USArrival_DatePicker = uibDateParser.parse($scope.model.POD.USArrival, $rootScope.dateParseFormat);
        $scope.model.POD.USDeparture_DatePicker = uibDateParser.parse($scope.model.POD.USDeparture, $rootScope.dateParseFormat);

        for (var i = 0; i < $scope.model.POD.Placements.length; i++) {
            var placement = $scope.model.POD.Placements[i];
            placement.USArrival_DatePicker = uibDateParser.parse(placement.USArrival, $rootScope.dateParseFormat);
            placement.USDeparture_DatePicker = uibDateParser.parse(placement.USDeparture, $rootScope.dateParseFormat);
        }

    });

    self.tabs.Participants = new TabDescriptor("Participants", function () {
        $scope.participantSelected = {};
        $scope.placementSelected = {};
    });

    self.tabset = new TabsDescriptor(self.tabs, self.load);
    self.tabset.selected = self.tabs.General;
    /*tabs init end*/

    $scope.emailPattern = $regEx.emailempty; // need to find how avoid this

    $scope.config = {};
    $scope.model = {};
    $scope.dictionaries = {};
    $scope.alerts = [];
    $scope.load = false;
    $scope.submitted = false;
    $scope.isFirstLoad = true;
    //General
    $scope.granteeOrganizationName = '';
    $scope.logisticOrganizationName = '';
    $scope.localHostOrganizationName = '';
    $scope.placementCityName = '';
    $scope.grantNumber = '';
    $scope.selectedGranteeOrganization = {};
    $scope.selectedLogisticOrganization = {};
    $scope.selectedLocalHostOrganization = {};
    $scope.selectedPlacementCity = {};
    $scope.selectedGrant = {};
    $scope.hostLeaders = {};
    //Participants
    $scope.defaultParticipantTypeId = 183;//TypeId for new Participant
    $scope.defaultParticipantTypeName = "Delegate";
    $scope.participantTypeDelegateId = 381;//check if Participant Type is Delegate

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.cleanAlerts = function () {
        $scope.alerts.length = 0;
    };

    /* General tab */
    //update Host Leaders dropdown list depends on selected Host Organization
    $scope.localHostOrganizationUpdate = function (reload) {
        if (reload) {
            $scope.model.POD.HostLeaderId = null;
        }

        var loadModel = {
            Id: $scope.selectedLocalHostOrganization.Id,
            LanguageId: $Language.langId
        };

        $http.post($scope.config.urlHostLeadersLoad, loadModel).then(
            function (response) {
                var data = response.data;
                $scope.hostLeaders = data;
            }
        );
    };

    //update Placement City after selecting Host Organization
    $scope.placementCityUpdate = function (item) {
        if ($scope.placementCityName == '') {
            $scope.placementCityName = item.Location;
            $scope.selectedPlacementCity = item.LocationModel;
        }
    };
    //clear when typing something
    $scope.granteeOrganizationNameOnChange = function () {
        $scope.selectedGranteeOrganization = {};
    };
    //clear when typing something
    $scope.logisticOrganizationNameOnChange = function () {
        $scope.selectedLogisticOrganization = {};
    };
    //clear fields when typing something
    $scope.localHostOrganizationOnChange = function () {
        $scope.selectedLocalHostOrganization = {};

        //clear depending fields
        $scope.model.POD.HostLeaderId = null;
        $scope.hostLeaders = {};
        $scope.placementCityName = '';
        $scope.selectedPlacementCity = {};
    };
    //clear fields when typing something
    $scope.placementCityOnChange = function () {
        $scope.placementCityName = '';
        $scope.selectedPlacementCity = {};
    };
    //clear when typing something
    $scope.grantNumberOnChange = function () {
        $scope.selectedGrant = {};
    };
    //select Grantee Organization from list
    $scope.setGranteeOrganization = function (item) {
        $scope.selectedGranteeOrganization = item;
    };
    //select Logistic Organization from list
    $scope.setLogisticOrganization = function (item) {
        $scope.selectedLogisticOrganization = item;
    };
    //select Local Host Organization from list
    $scope.setLocalHostOrganization = function (item) {
        $scope.selectedLocalHostOrganization = item;
        $scope.localHostOrganizationUpdate(true);//update Host Leaders dropdown list depends on selected Host Organization
        $scope.placementCityUpdate(item);//update Placement City after selecting Host Organization
    };
    //select Placement City from list
    $scope.setPlacementCity = function (item) {
        $scope.selectedPlacementCity = { CityId: item.Id, StateCode: item.AdditionalValue };
    };
    //select Grant Number from list
    $scope.setGrantNumber = function (item) {
        $scope.selectedGrant = item;
    };
    //compare date period
    $scope.compareDates = function (arrivalDate, departureDate, itemArrivalDate, itemDepartureDate) {
        //if (arrivalDate != null && departureDate != null) {
        //    var dArrivalDate = new Date(arrivalDate);
        //    var dDepartureDate = new Date(departureDate);
        //    if (dArrivalDate.getTime() > dDepartureDate.getTime()) {
        //        $scope.validateDate(itemArrivalDate, false);
        //        $scope.validateDate(itemDepartureDate, false);
        //    } else {
        //        $scope.validateDate(itemArrivalDate, true);
        //        $scope.validateDate(itemDepartureDate, true);
        //    }
        //    return dArrivalDate.getTime() < dDepartureDate.getTime();
        //} else {
        //    return true;
        //}
    };
    //validate date field
    $scope.validateDate = function (item, value) {
        item.$setValidity("Departure Date has to be greater than Arrival Date", value);
    };

    $scope.orgSearch = function (val) {

        var loadData = {
            LanguageId: $Language.langId,
            Content: val
        };

        return $http.post($scope.config.urlOrgSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };

    $scope.hostOrgSearch = function (val) {
        var loadData = {
            LanguageId: $Language.langId,
            Content: val
        };

        return $http.post($scope.config.urlHostOrgSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };

    $scope.citySearch = function (val) {

        var loadData = {
            LanguageId: $Language.langId,
            Content: val
        };

        return $http.post($scope.config.urlCitiesLoad, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };

    $scope.grantSearch = function (val) {
        var loadData = {
            LanguageId: $Language.langId,
            Content: val
        };

        return $http.post($scope.config.urlGrantSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };
    /* end General tab */

    /* Participants tab */

    $scope.addParticipant = function () {

        $scope.participantSelected.Edit = false;
        $scope.placementSelected.Edit = false;

        var item = {
            New: true,
            Edit: true,
            Deleted: false,
            SeqNo: $scope.model.Participants.length + 1,
            TypeId: $scope.defaultParticipantTypeId,
            TypeName: $scope.defaultParticipantTypeName,
            IsDelegate: true,
            Placements: []
        };
        $scope.participantSelected = item;
        $scope.model.Participants.push(item);
        $scope.participantSelectedTypeId = item.TypeId;

        $scope.participantHeader = "New record";
        $scope.podDetailParticipantsForm.$setDirty();
    };

    //search participants from tblPersons
    $scope.peopleSearch = function (val) {

        $log.debug("peopleSearch = function (val=" + val + ")");

        var participantIds = [];//array of participant IDs used in current POD

        $.each($scope.model.Participants, function () {
            if (!this.Deleted && this.PersonId != null)
                participantIds.push(this.PersonId);
        });

        var loadData = {
            LanguageId: $Language.langId,
            Content: val,
            ParticipantIds: participantIds
        };

        return $http.post($scope.config.urlPeopleSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };

    // Search for Delegates
    //Join search results from Nominations(tblNomination.NominatorId=> tblPersons) and Persons
    $scope.participantSearch = function (val) {

        $log.debug("participantSearch = function (val=" + val + ")");

        var participantIds = [];//array of participant IDs used in current POD
        $.each($scope.model.Participants, function () {
            if (!this.Deleted && this.PersonId != null)
                participantIds.push(this.PersonId);
        });

        var loadData = {
            LanguageId: $Language.langId,
            Content: val,
            ParticipantIds: participantIds
        };

        return $http.post($scope.config.urlParticipantSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };

    //select Participant from list if Participant is not a Delegate type
    $scope.setParticipantFacilitator = function (item) {

        $log.debug('setParticipantFacilitator' + $filter('json')(item));

        $scope.participantSelected.PersonId = item.Id;
        $scope.participantSelected.Name = item.Value;
        $scope.participantSelected.NominationId = item.NominationId;
        $scope.participantSelected.NominationOrgName = item.NominationOrgName;
        $scope.participantSelected.NominationDate = item.NominationDate;
        $scope.participantSelected.NominationStatusName = item.NominationStatusName;

    };

    //select Participant from list if Participant is a Delegate type(tblLookupItem.ParentId (for selected type) is 381 (Delegate))
    $scope.setParticipantDelegate = function (item) {

        $log.debug('setParticipantDelegate' + $filter('json')(item));

        $scope.participantSelected.PersonId = item.Id;
        $scope.participantSelected.Name = item.Value;
        $scope.participantSelected.NominationId = item.NominationId;
        $scope.participantSelected.NominationOrgName = item.NominationOrgName;
        $scope.participantSelected.NominationDate = item.NominationDate;
        $scope.participantSelected.NominationStatusName = item.NominationStatusName;
    };

    //clear when typing something
    $scope.participantNameOnChange = function () {
        $scope.participantSelected.PersonId = null;
        if (!$scope.participantSelected.Name) {
            $scope.participantSelected.NominationOrgName = null;
            $scope.participantSelected.NominationDate = null;
            $scope.participantSelected.NominationStatusName = null;
        }
    };

    $scope.participantTypeChange = function (id) {

        var participantType = null;

        for (var i = 0; i < $scope.dictionaries.ParticipantTypes.length; i++) {
            if ($scope.dictionaries.ParticipantTypes[i].Id == id) {
                participantType = $scope.dictionaries.ParticipantTypes[i];
                break;
            }
        }

        if (participantType)
            $scope.participantTypeSelect(participantType.ParentId, participantType.Value, participantType.Id);

    };

    //select Participant Type from list
    $scope.participantTypeSelect = function (parentId, typeName, typeId) {

        $log.debug('participantTypeSelect(parentId=' + parentId + ', typeName=' + typeName + ', typeId=' + typeId + ')');

        var isDelegate = parentId == $scope.participantTypeDelegateId;//check if Participant is a Delegate type(tblLookupItem.ParentId (for selected type) is 381 (Delegate))

        if ($scope.participantSelected.PersonId > 0 && $scope.participantSelected.IsDelegate != isDelegate) {
            $scope.participantSelectedTypeId = $scope.participantSelected.TypeId;
            $window.alert("The change in Participant Type is of different category which is not allowed after participant name has already been selected.\n Remove participant name first if you wish to make this change.");
            return;
        }

        $scope.participantSelected.IsDelegate = isDelegate;
        $scope.participantSelected.TypeId = typeId;
        $scope.participantSelected.TypeName = typeName;

        if (!isDelegate) {//clear fields if selected Participant Type is not a Delegate type
            $scope.participantSelected.NominationId = null;
            $scope.participantSelected.NominationOrgName = "";
            $scope.participantSelected.NominationDate = null;
            $scope.participantSelected.NominationStatusName = "";
        }
    };

    $scope.participantStatusSelect = function (value) {
        $scope.participantSelected.StatusName = value;
    };

    //select Participant from the grid
    $scope.participantSelect = function (participant) {

        $log.debug('participantSelect(participant)');

        $scope.fuck = participant;
        $scope.fuck.Edit = true;

        $scope.participantSelected.Edit = false;
        participant.Edit = true;
        $scope.participantSelected = participant;
        $scope.participantHeader = "Participant Detail " + $scope.participantSelected.Name;
        $scope.placementSelected = {};

        $scope.participantSelectedTypeId = $scope.participantSelected.TypeId;
        $scope.placementSelected.Edit = false;

        $scope.participantSelected.USVisaDate_DatePicker = uibDateParser.parse($scope.participantSelected.USVisaDate, $rootScope.dateParseFormat);
    };

    $scope.deleteParticipant = function () {

        if (!$window.confirm("Are you sure you want to delete participant " + $scope.participantSelected.Name + "? Operation cannot be canceled."))
            return;

        if (!$scope.participantSelected.New) {
            $scope.cleanAlerts();
            $scope.load = true;

            $scope.model.IsParticipantsDeleted = true;

            $http.post($scope.config.urlSavePOD, $scope.model).then(
                function (response) {
                    //$scope.alerts.push({ type: 'success', msg: "Participant successfully deleted." });
                    $scope.load = false;
                }
                , function () {
                    $scope.showAlert('error', "Error occurred while deleting.");
                    $scope.load = false;
                }
            );
        }
        $scope.participantSelected.Edit = false;
        $scope.participantSelected.Deleted = true;
        $scope.participantSelected = {};
        $scope.placementSelected = {};

    };

    $scope.cancelParticipant = function () {
        $scope.participantSelected.Edit = false;
        $scope.participantSelected = {};

        $scope.alerts = [];
        $scope.submitted = false;
        self.load(self.tabset.selected.name);
        $scope.podDetailParticipantsForm.$setPristine();

    };

    $scope.getArrivalDate = function (placement) {
        if (angular.isUndefined(placement.ArrivalInternal_DatePicker))
            return placement.ArrivalInternal;
        else
            return placement.ArrivalInternal_DatePicker;
    };

    //select Placement from the grid    
    $scope.placementSelect = function (placement) {
        $scope.placementSelected.Edit = false;
        placement.Edit = true;
        $scope.placementSelected = placement;

        //if (angular.isUndefined(placement.ArrivalInternal_DatePicker))
        //    $scope.placementSelected.ArrivalInternal_DatePicker = uibDateParser.parse($scope.placementSelected.ArrivalInternal, $rootScope.dateParseFormat);
        //if (angular.isUndefined(placement.DepartureInternal_DatePicker))
        //    $scope.placementSelected.DepartureInternal_DatePicker = uibDateParser.parse($scope.placementSelected.DepartureInternal, $rootScope.dateParseFormat);
    };

    $scope.deletePlacement = function (index) {

        $log.debug("-> .deletePlacement(" + index + ")");

        var orgName = "";

        if ($scope.participantSelected.Placements[index].Host)
            orgName = $scope.participantSelected.Placements[index].Host.OrgName;

        if (!$window.confirm("Are you sure you want to delete placement " + orgName + " ?"))
            return;

        $scope.placementSelected.Edit = false;

        $scope.placementSelected = {};

        var placementDeleted = $scope.participantSelected.Placements[index];

        placementDeleted.Deleted = true;

        self.FormsDescriptor.$setDirty();

        $scope.podDetailParticipantsForm.$setDirty();

    };

    $scope.addPlacement = function () {

        $scope.placementSelected.Edit = false;

        var item = {
            New: true,
            Edit: true,
            Deleted: false,
            SeqNo: $scope.participantSelected.Placements.length + 1
        };

        $scope.placementSelected = item;

        $scope.participantSelected.Placements.push(item);

        $scope.podDetailParticipantsForm.$setDirty();
    };

    /* end Participants tab */

    $scope.setPodDetailGeneralForm = function (form) {
        $scope.podDetailGeneralForm = form;
    }
    $scope.setPodDetailParticipantsForm = function (form) {
        $scope.podDetailParticipantsForm = form;
    }

    $scope.init = function (config) {
        $scope.config = config;
        self.langId = $Language.langId;
        self.load(self.tabs.General.name, function () {
            //initialize forms
            self.forms = [
                $scope.podDetailGeneralForm,
                $scope.podDetailParticipantsForm
            ];
            self.FormsDescriptor = new FormsDescriptor(self.forms);
        });
    };

    $scope.save = function () {

        $log.debug("-> podDetailCtrl.save()");

        $scope.cleanAlerts();

        if (!$scope.model.Program) {
            $window.alert("You must select a program to create the POD.");
            return;
        }

        $scope.submitted = true;

        $scope.compareDates($scope.model.POD.USArrival, $scope.model.POD.USDeparture, $scope.podDetailGeneralForm["inputArrivalDate"], $scope.podDetailGeneralForm["inputDepartureDate"]);

        if (!self.FormsDescriptor.$dirty()) {
            $log.debug("!self.FormsDescriptor.$dirty(). return");
            return;
        }

        if (!self.FormsDescriptor.$valid()) {
            $scope.showAlert('warning', 'Please check your input. Ensure you have entered all required fields correctly.');
            return;
        }

        $scope.submitted = false;

        if ($scope.load)
            return;

        $scope.load = true;

        $scope.model.IsPODChanged = $scope.podDetailGeneralForm.$dirty;
        $scope.model.IsParticipantsChanged = $scope.podDetailParticipantsForm.$dirty;

        if ($scope.model.IsPODChanged) {

            $scope.model.POD.GranteeOrganization = $scope.selectedGranteeOrganization;
            $scope.model.POD.LogisticOrganization = $scope.selectedLogisticOrganization;
            $scope.model.POD.LocalHostOrganization = $scope.selectedLocalHostOrganization;
            $scope.model.POD.PlacementCity = $scope.selectedPlacementCity;
            $scope.model.POD.Grant = $scope.selectedGrant;

            if (typeof ($scope.model.POD.GranteeOrganization.Id) != "number" || $scope.model.POD.GranteeOrganization.Id == 0) {
                $scope.model.POD.GranteeOrganization.Name = $scope.granteeOrganizationName;
            }
            if (typeof ($scope.model.POD.LogisticOrganization.Id) != "number" || $scope.model.POD.LogisticOrganization.Id == 0) {
                $scope.model.POD.LogisticOrganization.Name = $scope.logisticOrganizationName;
            }
            if (typeof ($scope.model.POD.LocalHostOrganization.Id) != "number" || $scope.model.POD.LocalHostOrganization.Id == 0) {
                $scope.model.POD.LocalHostOrganization.Name = $scope.localHostOrganizationName;
            }
        }

        $scope.model.POD.PrimaryCoordinatorId = $scope.model.POD.PrimaryCoordinator ? $scope.model.POD.PrimaryCoordinator.Id : null;
        $scope.model.POD.SecondaryCoordinatorId = $scope.model.POD.SecondaryCoordinator ? $scope.model.POD.SecondaryCoordinator.Id : null;

        //console.log($scope.model);
        $http.post($scope.config.urlSavePOD, $scope.model).then(
            function (response) {
                var data = response.data;
                $scope.showAlert('success', "Data successfully changed.");
                $scope.load = false;
                self.FormsDescriptor.$setPristine();

                if ($scope.model.Id == 0) {
                    var newPath = $location.path();
                    $scope.model.Id = data.Id;
                    $scope.config.id = data.Id;
                    newPath = newPath.replace('/0', '/' + data.Id);
                    //$location.path(newPath);
                    //$location.replace();
                    //$route.reload();
                    $window.location.href = newPath;
                }
            }
            , function () {
                $scope.showAlert('error', "Error occurred while saving.");
                $scope.load = false;
            }
        );
    };
    $scope.validParticipants = function () {
        return (($scope.podDetailParticipantsForm.$dirty && $scope.podDetailParticipantsForm.$valid) || !$scope.podDetailParticipantsForm.$dirty);
    };
    $scope.saveParticipants = function () {

        $scope.alerts = [];
        $scope.submitted = true;

        if (!$scope.podDetailParticipantsForm.$dirty)
            return;

        if (!$scope.validParticipants()) {
            $scope.showAlert('warning', 'Please check your input. Ensure you have entered all required fields correctly.');
            return;
        }

        if ($scope.participantSelected && !$scope.participantSelected.PersonId) {
            $scope.showAlert('warning', 'Please check your input. Ensure you have entered all required fields correctly.');
            return;
        }

        // Update dates
        for (var i = 0; i < $scope.model.Participants.length; i++) {
            var participant = $scope.model.Participants[i];
            if (participant.USVisaDate_DatePicker)
                participant.USVisaDate = participant.USVisaDate_DatePicker;
            for (j = 0; j < participant.Placements.length; j++) {
                var placement = participant.Placements[j];
                if (placement.ArrivalInternal_DatePicker)
                    placement.ArrivalInternal = placement.ArrivalInternal_DatePicker;
                if (placement.DepartureInternal_DatePicker)
                    placement.DepartureInternal = placement.DepartureInternal_DatePicker;
            }
        }


        // -> Remove all records with empty Participant
        var f = false;
        for (var i = 0; i < $scope.model.Participants.length; i++) {
            if (!$scope.model.Participants[i].PersonId) {
                f = true;
                break;
            }
        }

        if (f) {
            if (!$window.confirm("Would you like to remove all empty lines from the list of participants?"))
                return;
            else {
                var i = 0;
                while (i < $scope.model.Participants.length) {
                    if (!$scope.model.Participants[i].PersonId)
                        $scope.model.Participants.splice(i, 1);
                    else
                        i++;
                }
            }
        }
        // <-

        $scope.submitted = false;

        if ($scope.load)
            return;

        $scope.cleanAlerts();
        $scope.load = true;

        $scope.model.IsParticipantsChanged = $scope.podDetailParticipantsForm.$dirty;

        $http.post($scope.config.urlSavePOD, $scope.model).then(
            function (response) {
                var data = response.data;
                $scope.showAlert('success', "Data successfully changed.");
                $scope.load = false;
                self.FormsDescriptor.$setPristine();

                if ($scope.model.Id == 0) {
                    var newPath = $location.path();
                    $scope.model.Id = data.Id;
                    $scope.config.id = data.Id;
                    newPath = newPath + '/' + data.Id;
                    $location.path(newPath);
                    $location.replace();
                }

                self.tabs.Participants.loaded = false;//Participants were added, deleted, new organizations and cities were added. We need reload data in $scope.model
                self.tabset.select('Participants');
            }
            , function () {
                $scope.showAlert('error', "Error occurred while saving.");
                $scope.load = false;
            }
        );
    };
    $scope.delete = function () {

        $scope.alerts = [];
        if ($scope.load)
            return;

        if (!$window.confirm("Are you sure you want to delete this entity? Operation cannot be canceled."))
            return;

        $scope.cleanAlerts();
        $scope.load = true;

        var loadModel = {
            Id: $scope.config.id,
            Deleted: true
        };

        $http.post($scope.config.urlSavePOD, loadModel).then(
            function (response) {
                var data = response.data;
                $scope.showAlert('success', "Data successfully removed.");
                $scope.load = false;
                $window.location.href = '/POD';
            }
            , function (response) {
                var data = response.data;
                if (data && data.indexOf("The DELETE statement conflicted with the REFERENCE constraint") != -1)
                    $scope.showAlert('error', "Unable to delete this record because it is currently linked to other records in the system");
                else
                    $scope.showAlert('error', "Error occurred while saving.");

                $scope.load = false;

            });
    };

    $scope.cancel = function () {
        $scope.alerts = [];
        $scope.submitted = false;
        if ($scope.load)
            return;

        if ($scope.config.id) {
            self.load(self.tabset.selected.name);
            self.FormsDescriptor.$setPristine();
        } else
            $window.location.href = $scope.config.urlIndex;
    };

    $scope.pattern = function (template) {
        if ($scope.submitted) return template;
        return $scope.everything;
    };

    $scope.getErrorCss = function (form, isInvalid) {
        var css = '';
        if (($scope.submitted || $scope.accepted) && form.$dirty && isInvalid) css = 'error';
        return css;
    };

    $scope.setDirty = function (forms) {
        angular.forEach(forms, function (form) {
            form.$setDirty();
        });
    };

    $scope.canEdit = function () {
        return $scope.model.IsUserInEditRole;
    };
    $scope.isNotFirstSeqNo = function (item) {
        return item.SeqNo > 1;
    };

    /* Add New Host */
    $scope.addNewHost = function () {

        var modalInstance = $uibModal.open({
            templateUrl: 'addHostFamily.html',
            controller: ModalInstanceCtrl,
            resolve: {
                USStates: function () {
                    return $scope.dictionaries.USStates;
                },
                config: function () {
                    return $scope.config;
                }
            }
        });

        modalInstance.result.then(function (newHost) {
            $scope.placementSelected.Host = newHost;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    /* Open Plans(Programs) popup */
    $scope.selectProgram = function () {

        $Language.langId = self.langId;

        var modalInstance = $uibModal.open({
            templateUrl: 'selectProgram.html',
            controller: ProgramModalInstanceCtrl,
            windowClass: 'program-modal-window'
        });

        modalInstance.result.then(function (plan) {

            $log.debug("selectProgram. Ok.");

            $scope.model.Program = plan;
            $scope.model.ProgramId = plan.Id;
            $scope.model.Program.CountryName = plan.Country;
            $scope.model.Program.CountryId = plan.CountryId;
            $scope.model.Program.Region = plan.Region;
            $scope.model.Program.USArrival = plan.ArrivalDate;
            $scope.model.Program.USDeparture = plan.DepartureDate;
            $scope.model.Program.ApplicationDeadline = plan.ApplicationDeadline;
            $scope.model.Program.Delegations = plan.Proposed;

            $scope.model.POD.ThemeId = plan.ThemeId;

            // We have multiple placements
            //$scope.model.POD.USArrival_DatePicker = uibDateParser.parse(plan.ArrivalDate, $rootScope.dateParseFormat);
            //$scope.model.POD.USDeparture_DatePicker = uibDateParser.parse(plan.DepartureDate, $rootScope.dateParseFormat);

            $scope.podDetailGeneralForm.$setDirty();

        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.showAlert = function (type, msg) {
        $window.scrollTo(0, 0); //scroll to top
        $scope.alerts.push({ type: type, msg: msg });
    };

    //catch onbeforeunload event to notify user if there is some unsaved data
    $window.onbeforeunload = function () {
        var msg = "You have unsaved items. You will lose all unsaved data if you leave the page.";

        if (self.FormsDescriptor.$dirty() && !$rootScope.sessionHasExpired) {
            try {
                //FireFox does not show the message
                if (/Mozilla/g.test(navigator.userAgent))
                    $window.alert(msg);
            } catch (err) { }
            return msg;
        }

        //return null; - without this comment do not work in ie - always asked a permission to leave the page
    };

    $scope.getCss = function (form, isInvalid, css) {
        if (!css) css = '';
        if (($scope.submitted || $scope.accepted) && form.$dirty && isInvalid) css += 'error';
        return css;
    };

    //--- Placement Host
    //search
    $scope.hostSearch = function (val) {

        var loadData = {
            LanguageId: $Language.langId,
            Content: val
        };

        return $http.post($scope.config.urlHostSearch, loadData).then(
            function (response) {
                return response.data;
            }
        );
    };
    //clear when typing something
    $scope.hostOnChange = function () {
        $scope.placementSelected.Host.HostId = null;
    };
    //select
    $scope.setHost = function (item) {
        $scope.placementSelected.Host.HostId = item.HostId;
    };
    //check selected
    $scope.checkHost = function () {
        if ($scope.placementSelected.Host && $scope.placementSelected.Host.HostId == null)
            $scope.placementSelected.Host.OrgName = "";
    };
    //---End Placement Host

    $scope.openHost = function (id) {
        $window.location.href = '/HostFamilies/Detail/' + id;
    };

    $scope.setPerson = function (item, obj) {
        obj.Id = item.Id;
    }


    // -> Multiple POD Placements
    $scope.addNewPlacement = function (pod) {

        $log.debug("-> addNewPlacement");

        var newPodPlacement = angular.copy($scope.model.NewPodPlacement);

        newPodPlacement.IsNew = true;
        newPodPlacement.USArrival_DatePicker = uibDateParser.parse($scope.model.Program.USArrivalInternal, $rootScope.dateParseFormat);
        newPodPlacement.USDeparture_DatePicker = uibDateParser.parse($scope.model.Program.USDepartureInternal, $rootScope.dateParseFormat);

        $scope.model.POD.Placements.push(newPodPlacement);

        $scope.podDetailGeneralForm.$setDirty();

    }

    $scope.onPodPlacementLocalHostOrganizationOnChange = function (placement) {
        placement.HostLeader = null;
    }

    $scope.setPodPlacementLocalHostOrganization = function (item, placement) {
        placement.LocalHostOrganization = { Id: item.Id, Name: item.Name, Leaders: [] };
        $scope.podPlacementLocalHostOrganizationUpdate(placement);
    }

    $scope.podPlacementLocalHostOrganizationUpdate = function (placement) {

        var loadModel = {
            Id: placement.LocalHostOrganization.Id,
            LanguageId: $Language.langId
        };

        $http.post($scope.config.urlHostLeadersLoad, loadModel).then(
            function (response) {
                var data = response.data;
                placement.LocalHostOrganization.Leaders = data;
            }
        );
    };

    $scope.setPodPlacementCity = function (item, placement) {
        placement.City = { CityId: item.Id, CityStateCode: item.Value + ", " + item.AdditionalValue };
    };

    $scope.deletePodPlacement = function (e, placement, index) {

        $log.debug("-> deletePodPlacement(e,placement,index)");

        var orgName = placement.LocalHostOrganization ? placement.LocalHostOrganization.Name : "";

        if (!$window.confirm("Are you sure you want to delete placement" + orgName + "?"))
            return;

        if (placement.IsNew)
            $scope.model.POD.Placements.splice(index, 1);
        else
            placement.IsDeleted = true;

        $scope.podDetailGeneralForm.$setDirty();

    }

    // <- Multiple POD Placements
};

/* Add New Host popup*/
var ModalInstanceCtrl = function ($scope, $http, $uibModalInstance, $Language, $regEx, USStates, config) {

    $scope.emailPattern = $regEx.emailempty; // need to find how avoid this
    $scope.USStates = USStates;
    $scope.HostFamiliesCountryId = 6252001;
    $scope.config = config;
    $scope.submitted = false;

    $scope.host = {};
    $scope.host.Address = {};
    $scope.host.Address.CountryId = $scope.HostFamiliesCountryId;

    $scope.getErrorCss = function (form, isInvalid) {
        var css = '';
        if ($scope.submitted && form.$dirty && isInvalid) css = 'error';
        return css;
    };

    $scope.save = function () {

        $log.debug("-> ModalInstanceCtrl.save()");

        $scope.submitted = true;
        $scope.load = true;

        if (!this.hostFamilyAddForm.$dirty)
            return;

        if (!this.hostFamilyAddForm.$valid)
            return;

        if ($scope.host.hostType) {
            $scope.host.Person = null;
            $scope.host.OrgName = $scope.host.Organization.Name; //for UI
        } else {
            $scope.host.Organization = null;
            $scope.host.OrgName = $scope.host.Person.LastName + ', ' + $scope.host.Person.FirstName; //for UI
        }

        var saveCortege = {
            Item: $scope.host,
            LanguageId: $Language.langId
        };

        $http.post('/HostFamilies/Save', saveCortege).then(
            function (response) {
                var data = response.data;
                $scope.host.HostId = data.id;
                $scope.submitted = false;
                $uibModalInstance.close($scope.host);
            }
            , function () {
                $scope.submitted = false;
                $scope.load = false;
            }
        );
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.getCss = function (form, isInvalid) {
        var css = '';
        if (($scope.submitted || $scope.accepted) && form.$dirty && isInvalid) css = 'error';
        return css;
    };

};

var ProgramModalInstanceCtrl = function ($scope, $http, $uibModalInstance) {

    $scope.cancelResult = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.saveResult = function (e, result) {
        e.preventDefault();
        $uibModalInstance.close(result);
    };
};

app.controller('podDetailCtrl', podDetailCtrl);

app.controller('ModalInstanceCtrl', ModalInstanceCtrl);

app.controller('ProgramModalInstanceCtrl', ProgramModalInstanceCtrl);