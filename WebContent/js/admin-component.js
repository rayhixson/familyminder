define(['knockout', 'js/context', 'text!html/admin-component.html', 'usergrid'], function(ko, context, html) {

    function AdminViewModel() {
        var self = this;

        self.context = ko.observable(context);

        // Behaviors
        self.createFamily = function() {
            context.resetAlerts();
            
            if (!context.familyName() || context.familyName().length < 2) {
                context.handleError("Missing or bad family name");
                return false;
            }
            
            context.ugClient = new Usergrid.Client({
                URI: context.ugHost(),
                orgName: context.ugOrganization(),
                logging: true, //optional - turn on logging, off by default
                buildCurl: true //optional - turn on curl commands, off by default
            });

            var options = {
                method: 'POST',
                mQuery: true,
                endpoint: 'management/token',
                body: {
                    grant_type: 'password',
                    username: context.minderAdminName(),
                    password: context.minderAdminPassword()
                }
            };
            //curl -s "http://localhost:8080/management/token?grant_type=password&username=$ADMIN&password=$ADMIN_PW")                

            // GET A TOKEN
            console.log("--> Get an admin token to create an app");
            
            context.ugClient.request(options, function(err, data) {
                if (err) {
                    context.handleError("Bad admin");
                } else {
                    var t = data.access_token;

                    context.ugClient.setToken(t);

                    var options = {
                        method:'POST',
                        mQuery: true,
                        endpoint: 'management/orgs/'+context.ugOrganization()+'/apps',
                        body: {
                            name: context.familyName()
                        }
                    };

                    // CREATE THE APP
                    console.log("--> Make request to create an app");
                    
                    context.ugClient.request(options, function(err2, resdata) {
                        if (err2) {
                            context.handleError("Failed to create: "+JSON.stringify(err));
                        } else {
                            // now that the app exists, tell the client object
                            context.ugClient.set("appName", context.familyName());
                            
                            // CREATE THE ADMIN USER FOR THE APP
                            var data = {
                                type: "users",
                                username: context.familyAdminName(),
                                password: context.familyAdminPassword(),
                                email: 'ray@zenfoo.com',
                                name: context.familyAdminName(),
                                image: 'images/default.jpg'
                            };

                            console.log("--> create admin for family");
                            
                            context.ugClient.createEntity(data, function() {
                                context.ugClient.logoutAndDestroyToken(context.minderAdminName(),
                                                                    null, true);
                                console.log("--> Destroy minder admin login");
                            });
                            // curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST "http://localhost:8080/$ORG/$APP/users" -d "{ \"username\":\"$APP_USER\", \"password\":\"$APP_PW\", \"email\":\"user@example.com\" }"                            
                        }
                    });
                }
            });
            return true;
	        // curl -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -X POST -d "{ \"name\":\"$APP\" }" http://localhost:8080/management/orgs/$ORG/apps
        };
    };

    return {
        viewModel: AdminViewModel,
        template: html
    };
});

