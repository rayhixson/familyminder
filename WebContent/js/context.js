define(function (require) {
    var ko = require("knockout"),
        views = require("js/views"),
        UsergridClient = require("usergrid-utilities");

    var EDIT_MODE_KEY = "fm_edit_mode";
    var ADMIN_NAME_KEY = "fm_admin_name";
    var ADMIN_PASS_KEY = "fm_admin_pass";
    var APP_NAME_KEY = "fm_ug_app_name";
    var ORG_NAME_KEY = "fm_ug_org_name";
    var HOST_KEY = "fm_ug_host";

        
    var ContextObj = function() {
        var self = this;

        self.get = function(key, defaultReturnVal) {
            var v = localStorage.getItem(key);
            return (v ? v : defaultReturnVal);
        };

        self.ugClient = null;
        self.ugHost = ko.observable(self.get(HOST_KEY, window.location.protocol + "//"
                                             + window.location.hostname + ":8080"));
        self.ugOrganization = ko.observable(self.get(ORG_NAME_KEY, "grannyminder"));
        
        self.homeUrl = ko.observable(location.origin + location.pathname);
        
	    self.minderAdminName = ko.observable(self.get(ADMIN_NAME_KEY, "test"));
	    self.minderAdminPassword = ko.observable(self.get(ADMIN_PASS_KEY, "test"));
        
	    self.familyName = ko.observable(self.get(APP_NAME_KEY, "Blork"));
	    self.familyAdminName = ko.observable("bob");
	    self.familyAdminPassword = ko.observable("foobar");

        self.showErrorAlert = ko.observable(false);
        self.errorMessage = ko.observable();

        self.editMode = ko.observable(self.get(EDIT_MODE_KEY, false));

        self.modeText = ko.computed(function() {
            return self.editMode() ? "Edit Mode" : "View Mode";
        });

        self.userLoggedIn = ko.observable(false);

        self.toggleMode = function() {
            self.editMode(!self.editMode());
            // save the new value
            self.set(EDIT_MODE_KEY, self.editMode());
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
            var client = new UsergridClient(self.ugHost(), self.ugOrganization(),
                                            self.familyName(), false);

            if (client.isLoggedIn()) {
                self.ugClient = client;
                self.familyName(self.ugClient.appName);
            }
        };

        self.set = function(key, arg) {
            localStorage.setItem(key, arg);
        };

        self.saveConfigs = function() {
            self.set(ADMIN_NAME_KEY, self.minderAdminName());
            self.set(ADMIN_PASS_KEY, self.minderAdminPassword());
            self.set(APP_NAME_KEY, self.familyName());
            self.set(ORG_NAME_KEY, self.ugOrganization());
            self.set(HOST_KEY, self.ugHost());
            
            alert("Saved.");
        };

	    // --   INITIALIZE 
        
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
