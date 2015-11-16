define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        views = require('js/views'),
        html = require('text!html/org-index-component.html');

    function UgApp(name) {
        var self = this;
        self.name = ko.observable(name);
        
        // Behaviours

        self.goToLogin = function() {
            context.familyName(self.name());
            views.LOGIN.setCurrent();
        };
    };

    function OrgIndexViewModel() {
        var self = this;

        self.ugApplications = ko.observableArray([
            new UgApp("jones"),
            new UgApp("Blork")
        ]);

        self.init = function() {
            var ugClient = self.createAdminClient();
        
            var options = {
                method: "GET",
                endpoint: context.ugOrganization() + "/apps"
            };

            console.log("---> " + JSON.stringify(options));
        
            ugClient.request(options, function(err, data) {
                if (err) {
                    context.handleError("Failed to retrieve existing Organizations");
                } else {
                    //fill the array

                    console.log(JSON.stringify(data));
                }
            });
        };

        self.createAdminClient = function() {
            var ugClient = new Usergrid.Client({
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

            return ugClient;
        };
        
        // init
        self.init();

    };

    return {
        viewModel: OrgIndexViewModel,
        template: html
    };
});
