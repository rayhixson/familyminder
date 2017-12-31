define(function (require) {
    var ko = require("knockout"),
        views = require("js/views"),
        ApiClient = require("api-client");

    var EDIT_MODE_KEY = "fm_edit_mode";
    var ADMIN_NAME_KEY = "fm_admin_name";
    var ADMIN_PASS_KEY = "fm_admin_pass";
    var APP_NAME_KEY = "fm_app_name";
    var HOST_KEY = "fm_host";

        
    var ContextObj = function() {
        var self = this;

        self.get = function(key, defaultReturnVal) {
            var v = localStorage.getItem(key);
            return (v ? v : defaultReturnVal);
        };

        self.client = null;
        var pub = "http://localhost:9090";
        var local = window.location.protocol + "/"
                + window.location.hostname + ":9090";
        
        self.apiHost = ko.observable(self.get(HOST_KEY, pub));
        
        self.homeUrl = ko.observable(location.origin + location.pathname);

	    //self.minderAdminName = ko.observable(self.get(ADMIN_NAME_KEY, "test"));
	    //self.minderAdminPassword = ko.observable(self.get(ADMIN_PASS_KEY, "test"));
	    self.minderAdminName = ko.observable(self.get(ADMIN_NAME_KEY, "bob"));
	    self.minderAdminPassword = ko.observable(self.get(ADMIN_PASS_KEY, "foobar"));
        
	    self.familyName = ko.observable(self.get(APP_NAME_KEY, "Blork"));
	    self.familyAdminName = ko.observable("Bob");
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
                self.client.logout(self.familyAdminName(), function(err, resp) {
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
            var api = new ApiClient(self.apiHost(), self.familyName(), false);

            if (api.isLoggedIn()) {
                self.client = api;
                self.familyName(self.client.appName);
            }
        };

        self.set = function(key, arg) {
            localStorage.setItem(key, arg);
        };

        self.saveConfigs = function() {
            self.set(ADMIN_NAME_KEY, self.minderAdminName());
            self.set(ADMIN_PASS_KEY, self.minderAdminPassword());
            self.set(APP_NAME_KEY, self.familyName());
            self.set(HOST_KEY, self.apiHost());
        };

	    // --   INITIALIZE 
        
        // when a user comes to the site and is already logged in
        self.setClientFromToken();
        if (self.client) {
            self.userLoggedIn(true);
            views.TREE.setCurrent();
        }

    };

    // create and return one instance to be shared.
    return new ContextObj();
});
