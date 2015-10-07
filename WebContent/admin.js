var HOST = 'http://localhost:8080';
var ORG = "grannyminder";

function AdminViewModel() {
	var self = this;

    self.personViewModel = ko.observable();

    self.ugClient = null;
	
	self.minderAdminName = ko.observable("bob");
	self.minderAdminPassword = ko.observable("foobar");
    
	self.familyName = ko.observable("smith");
	self.familyAdminName = ko.observable("ray");
	self.familyAdminPassword = ko.observable("foo");

    self.editMode = ko.observable(false);

    self.showErrorAlert = ko.observable(false);
    self.errorMessage = ko.observable();

    self.userLoggedIn = ko.observable(false);
	
	// Behaviors
    self.toggleMode = function() {
        self.editMode(!self.editMode());
    };

    self.modeText = ko.computed(function() {
        return self.editMode() ? "Edit Mode" : "View Mode";
    });
    
    self.stopShowErrorAlert = function() {
        self.showErrorAlert(false);
    };

    self.resetAlerts = function() {
        self.errorMessage(null);
        self.showErrorAlert(false);
    };
    
    self.doWrapped = function(callback) {
        try {
            // first turn off alerts
            self.resetAlerts();
            callback();
        } catch(err) {
            self.errorMessage(err.message);
            self.showErrorAlert(true);
        }
    };

    self.handleError = function(err) {
        var e = err.message ? err.message : err;
        self.errorMessage(e);
        self.showErrorAlert(true);
    };
    
	self.createFamily = function() {
        self.doWrapped(function() {
            if (!self.familyName() || self.familyName().length < 2) {
                self.handleError("Missing or bad family name");
                return false;
            }
            
            self.ugClient = new Usergrid.Client({
                URI: HOST,
                orgName:'grannyminder',
                logging: true, //optional - turn on logging, off by default
                buildCurl: true //optional - turn on curl commands, off by default
            });

            var options = {
                method: 'POST',
                mQuery: true,
                endpoint: 'management/token',
                body: {
                    grant_type: 'password',
                    username: self.minderAdminName(),
                    password: self.minderAdminPassword()
                }
            };
            //curl -s "http://localhost:8080/management/token?grant_type=password&username=$ADMIN&password=$ADMIN_PW")                

            // GET A TOKEN
            self.ugClient.request(options, function(err, data) {
                if (err) {
                    self.handleError("Bad admin");
                } else {
                    var t = data.access_token;

                    self.ugClient.setToken(t);

                    var options = {
                        method:'POST',
                        mQuery: true,
                        endpoint: 'management/orgs/'+ORG+'/apps',
                        body: {
                            name: self.familyName()
                        }
                    };

                    // CREATE THE APP
                    self.ugClient.request(options, function (err, resdata) {
                        if (err) {
                            self.handleError("Failed to create: "+JSON.stringify(err));
                        } else {
		                    alert("App created " + self.familyName());

                            // CREATE THE ADMIN USER FOR THE APP
                            var data = {
                                type: "users",
                                username: self.familyAdminName(),
                                password: self.familyAdminPassword(),
                                email: 'ray@zenfoo.com',
                                name: self.familyAdminName(),
                                image: 'images/default.jpg'
                            };

                            self.ugClient.createEntity(data, function() {
                                self.ugClient.logoutAndDestroyToken(self.minderAdminName(),
                                                                    null, true);
                                alert("Admin created, you should be able to login now");
                            });
// curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST "http://localhost:8080/$ORG/$APP/users" -d "{ \"username\":\"$APP_USER\", \"password\":\"$APP_PW\", \"email\":\"user@example.com\" }"                            
                        }
                    });
                }
            });
        });
		// curl -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -X POST -d "{ \"name\":\"$APP\" }" http://localhost:8080/management/orgs/$ORG/apps
	};
	
	self.login = function() {
        self.doWrapped(function() {
            self.ugClient = new Usergrid.Client({
                URI: HOST,
                orgName: ORG,
                appName: self.familyName(),
                logging: true, //optional - turn on logging, off by default
                buildCurl: true //optional - turn on curl commands, off by default
            });

            self.ugClient.login(self.familyAdminName(), self.familyAdminPassword(), function(err) {
                if (err) {
                    self.handleError(err);
                } else {
                    self.userLoggedIn(true);
                    self.personViewModel(new PersonViewModel(self, self.familyAdminName()));
                }
            });
        });
	};
	
	self.logout = function() {
        if (self.userLoggedIn()) {
            self.ugClient.logoutAndDestroyToken(self.familyAdminName(), null, true);
		    self.userLoggedIn(false);
            self.personViewModel(null);
        }
	};

    self.setClientFromToken = function() {
        var client = new Usergrid.Client({
            URI: HOST,
            logging: true,
            buildCurl: true
        });

        if (client.isLoggedIn()) {
            self.ugClient = client;
        }
    };

    // INITIALIZE - when a user comes to the site and is already logged in
    self.setClientFromToken();
    if (self.ugClient) {
        self.userLoggedIn(true);
        self.personViewModel(new PersonViewModel(self, 'ray'));
    }
};

function MinderError(message) {
    this.message = message;
};
MinderError.prototype = new Error();
MinderError.prototype.constructor = MinderError;

ko.applyBindings(new AdminViewModel());


// -------
// Below here is all
// UI Visual / JQuery hooks - where does this code belong?
// -------

ko.bindingHandlers.fadeAlert = {
	init: function(element, valueAccessor) {
		var value = valueAccessor();
		$(element).toggle(ko.unwrap(value));
	},
	update: function(element, valueAccessor) {
		var value = valueAccessor();
		// only respond to true events and let the alert fade out on its own
		if (ko.unwrap(value)) {
			$(element).fadeIn(700).slideUp(1000, function() {
				// ?
			});
		}
	}
};

// close modals on okay events
ko.bindingHandlers.dismissModal = {
    // inititially hidden
    init: function(element, valueAccessor) {
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value));
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        // if okay event then dismiss
        if (ko.unwrap(value)) {
            $(element).modal('hide');
            
            var av = bindingContext.$root;
            $(element).on('hidden.bs.modal', function() {
                av.personViewModel().sweep();
            });
        }
    }
};

