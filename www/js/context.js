define(function (require) {
    var ko = require("knockout"),
        views = require("js/views"),
        ApiClient = require("api-client");

    var EDIT_MODE_KEY = "fm_edit_mode";
    var ORG_NAME_KEY = "fm_org_name";
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
        
        self.homeUrl = ko.observable(location.origin);

	    self.minderAdminName = ko.observable("admin-name")
	    self.minderAdminPassword = ko.observable("admin-pass")
        
	    self.orgName = ko.observable();
	    self.userName = ko.observable();
	    self.password = ko.observable();

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
                self.client.logout(self.userName(), function(err, resp) {
                    if (err) {
                        console.log("Failed to Logout: " + err);
                    }
                });
		        self.userLoggedIn(false);
				self.orgName("")
                views.LOGIN.setCurrent();
            }
        };

        self.setClientFromToken = function() {
            // try to bootstrap from localstorage
            var api = new ApiClient(self);

            if (api.isLoggedIn()) {
                self.client = api;
                self.orgName(self.get(ORG_NAME_KEY, null))
            }
        };

        self.set = function(key, arg) {
            localStorage.setItem(key, arg);
        };

		self.saveOrgName = function(name) {
            self.set(ORG_NAME_KEY, name);
			self.orgName(name);
		};			

		/*
        self.saveConfigs = function() {
            self.set(ORG_NAME_KEY, self.familyName());
            self.set(HOST_KEY, self.apiHost());
        };
		*/

	    // --   INITIALIZE 
        
        // when a user comes to the site and is already logged in
        self.setClientFromToken();
        if (self.client) {
			self.userLoggedIn(true);
			if (self.orgName) {
				views.TREE.setCurrent();
			} else {
				views.ADMIN.setCurrent();
			}
        }
    };

    // create and return one instance to be shared.
    return new ContextObj();
});
