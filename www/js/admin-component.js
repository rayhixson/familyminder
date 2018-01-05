define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        html = require('text!html/admin-component.html'),
        views = require('js/views'),
        ApiClient = require('api-client');

    function AdminViewModel() {
        var self = this;

        // bind this to observable to get data from context in html
        self.context = ko.observable(context);

        self.apiApplications = ko.observableArray([]);

        self.client = null;

        // Behaviors
        self.createFamily = function() {
            context.resetAlerts();
            
            if (!context.orgName() || context.orgName().length < 2) {
                context.handleError("Missing or bad family name (at least 2 characters long)");
            } else {

				self.client.createOrg(context.orgName(), function(err, resdata) {
                    if (err) {
                        context.handleError("Create Org: " + err);
                    } else {
                        // now that the app exists, tell the client object
                        context.saveOrgName(context.orgName());
                        
                        console.log("--> create dad for family");
                        var data = {
                            email: 'ray@zenfoo.com',
                            name: 'Dad',
                            image: 'images/default.jpg'
                        };

                        self.client.createPerson(data, function(err3, res3) {
                            if (err3) {
                                context.handleError("Create dad for family: " + err3);
                            }
                        });

						// add to the list of orgs
                        self.apiApplications.push(new ApiApp(context.orgName()));
                    }
                });
			}
		};

        self.initApplications = function() {
            self.client = new ApiClient(context)
                
            self.apiApplications.removeAll();

			self.client.getOrgs(function(err, response) {
                if (err) {
                    context.handleError("Failed to retrieve existing Organizations: " + err);
                } else {
                    //fill the array
					for (var i=0; i < response.length; i++) {
                        self.apiApplications.push(new ApiApp(response[i].name));
                    }
                }
			});
        };

        // actually do the initialization
        self.initApplications();
    };

    // Represents one app / family - for listing them all
    function ApiApp(name) {
        var self = this;
        self.name = ko.observable(name);
        
        // Behaviours

        self.goToTree = function() {
            context.saveOrgName(self.name());
            views.TREE.setCurrent();
        };
    };

    return {
        viewModel: AdminViewModel,
        template: html
    };
});

