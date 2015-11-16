define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        html = require('text!html/admin-component.html'),
        views = require('js/views'),
        UsergridClient = require('usergrid-utilities');

    function AdminViewModel() {
        var self = this;

        // bind this to observable to get data from context in html
        self.context = ko.observable(context);

        self.ugApplications = ko.observableArray([]);

        self.ugClient = null;

        // Behaviors
        self.createFamily = function() {
            context.resetAlerts();
            
            if (!context.familyName() || context.familyName().length < 2) {
                context.handleError("Missing or bad family name (at least 2 characters long)");
            } else {

                console.log("--> Get an admin token ...");
                self.ugClient.adminLogin(context.minderAdminName(), context.minderAdminPassword(), function(err, response) {
                    if (err) {
                        context.handleError(err);
                    } else {
                        var options = {
                            method:'POST',
                            endpoint: 'management/orgs/'+context.ugOrganization()+'/apps',
                            body: {
                                name: context.familyName()
                            }
                        };

                        // CREATE THE APP
                        console.log("--> Make request to create an app");
                        
                        self.ugClient.adminRequest(options, function(err2, resdata) {
                            if (err2) {
                                context.handleError("Create App: " + err2);
                            } else {
                                // now that the app exists, tell the client object
                                self.ugClient.setAppName(context.familyName());
                                
                                // CREATE THE ADMIN USER FOR THE APP
                                var data = {
                                    endpoint: "users",
                                    method: "POST",
                                    body: {
                                        username: context.familyAdminName(),
                                        password: context.familyAdminPassword(),
                                        email: 'ray@zenfoo.com',
                                        name: context.familyAdminName(),
                                        image: 'images/default.jpg'
                                    }
                                };

                                console.log("--> create admin for family");
                                
                                self.ugClient.request(data, function(err3, res3) {
                                    if (err3) {
                                        context.handleError("Create admin for app: "
                                                            + err3);
                                    }
                                    // success, send to login page
                                    views.LOGIN.setCurrent();
                                });
                            }
                        });
                    }
                });
            }
        };

        self.initApplications = function() {
            self.ugClient = new UsergridClient(true);
            if (!self.ugClient.isLoggedIn()) {
                self.ugClient = UsergridClient.create(context.ugHost(),
                                                      context.ugOrganization(),
                                                      context.familyName(),
                                                      true);
            }
                
            console.log("--> Get an admin token ...");
            self.ugClient.adminLogin(context.minderAdminName(), context.minderAdminPassword(), function(err, response) {
                if (err) {
                    context.handleError(err);
                } else {
                    var options = {
                        method: "GET",
                        mQuery: true,
                        endpoint: "management/orgs/" + context.ugOrganization() + "/apps"
                    };

                    self.ugClient.adminRequest(options, function(err, data) {
                        if (err) {
                            context.handleError("Failed to retrieve existing Organizations: " + err);
                        } else {
                            //fill the array
                            for (var a in data.data) {
                                var n = a.split("/")[1];
                                var appName = n.slice(0,1).toUpperCase() + n.slice(1);
                                //console.log("----> " + appName);
                                self.ugApplications.push(new UgApp(appName));
                            }
                        }
                    });
                }
            });
        };

        // actually do the initialization
        self.initApplications();
    };

    // object used to represent an app for listing them all
    function UgApp(name) {
        var self = this;
        self.name = ko.observable(name);
        
        // Behaviours

        self.goToLogin = function() {
            context.familyName(self.name());
            views.LOGIN.setCurrent();
        };
    };

    return {
        viewModel: AdminViewModel,
        template: html
    };
});

