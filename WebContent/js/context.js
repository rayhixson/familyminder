define(["knockout", "js/views", "usergrid"], function(ko, views) {

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
            localStorage.setItem('editMode', true);
        };

        self.stopShowErrorAlert = function() {
            self.showErrorAlert(false);
        };

        self.resetAlerts = function() {
            self.errorMessage(null);
            self.showErrorAlert(false);
        };

        self.handleError = function(err) {
            var e = err.message ? err.message : err;
            self.errorMessage(e);
            self.showErrorAlert(true);
        };

        self.logout = function() {
            if (self.userLoggedIn()) {
                self.ugClient.logoutAndDestroyToken(self.familyAdminName(), null, true);
		        self.userLoggedIn(false);
                //self.goLoginView();
                views.LOGIN.setCurrent();
            }
        };

        self.setClientFromToken = function() {
            var client = new Usergrid.Client({
                URI: self.ugHost(),
                logging: true,
                buildCurl: true
            });

            if (client.isLoggedIn()) {
                self.ugClient = client;
                self.familyName(self.ugClient.get("appName"));
            }
        };

	    // --   INITIALIZE 
        self.editMode(localStorage.getItem("editMode"));
        
        // when a user comes to the site and is already logged in
        self.setClientFromToken();
        if (self.ugClient) {
            self.userLoggedIn(true);
            //self.goTreeView();
            views.TREE.setCurrent();
        }

    };

    // create and return one instance to be shared.
    return new ContextObj();
});
