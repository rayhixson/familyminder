define(function (require) {
    var ko = require("knockout"),
        views = require("js/views"),
        UsergridClient = require("usergrid-utilities");

    var EDIT_MODE_KEY = "fm_edit_mode";
        
    var ContextObj = function() {
        var self = this;

        self.ugClient = null;
        self.ugHost = ko.observable(window.location.protocol + "//"
                              + window.location.hostname + ":8080");
        self.ugOrganization = ko.observable("grannyminder");
        
        self.homeUrl = ko.observable(location.origin + location.pathname);
        
	    self.minderAdminName = ko.observable("test");
	    self.minderAdminPassword = ko.observable("test");
        
	    self.familyName = ko.observable("Blork");
	    self.familyAdminName = ko.observable("bob");
	    self.familyAdminPassword = ko.observable("foobar");

        self.showErrorAlert = ko.observable(false);
        self.errorMessage = ko.observable();

        self.editMode = ko.observable(false);

        self.modeText = ko.computed(function() {
            return self.editMode() ? "Edit Mode" : "View Mode";
        });

        self.userLoggedIn = ko.observable(false);

        self.toggleMode = function() {
            self.editMode(!self.editMode());
            localStorage.setItem(EDIT_MODE_KEY, true);
        };

        self.stopShowErrorAlert = function() {
            self.showErrorAlert(false);
        };

        self.resetAlerts = function() {
            self.errorMessage(null);
            self.showErrorAlert(false);
        };

        self.handleError = function(err) {
            self.errorMessage(err);
            self.showErrorAlert(true);
        };

        self.logout = function() {
            if (self.userLoggedIn()) {
                self.ugClient.logout(self.familyAdminName(), function(err, resp) {
                    if (err) {
                        console.log("Failed to Logout: " + err);
                    }
                });
		        self.userLoggedIn(false);
                views.LOGIN.setCurrent();
            }
        };

        self.setClientFromToken = function() {
            // try to bootstrap from localstorage
            var client = new UsergridClient(false);

            if (client.isLoggedIn()) {
                self.ugClient = client;
                self.familyName(self.ugClient.getAppName());
            }
        };

        self.saveConfigs = function() {
        };

	    // --   INITIALIZE 
        self.editMode(localStorage.getItem(EDIT_MODE_KEY));
        
        // when a user comes to the site and is already logged in
        self.setClientFromToken();
        if (self.ugClient) {
            self.userLoggedIn(true);
            views.TREE.setCurrent();
        }

    };

    // create and return one instance to be shared.
    return new ContextObj();
});
