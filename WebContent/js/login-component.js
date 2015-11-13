define(function(require) {
    var ko = require('knockout'),
        context = require('js/context'),
        views = require('js/views'),
        html = require('text!html/login-component.html');

    function LoginViewModel() {
        var self = this;

        self.context = ko.observable(context);

        // Behaviors

        self.login = function() {
            self.context().ugClient = new Usergrid.Client({
                URI: self.context().ugHost(),
                orgName: self.context().ugOrganization(),
                appName: self.context().familyName(),
                logging: true, //optional - turn on logging, off by default
                buildCurl: true //optional - turn on curl commands, off by default
            });

            console.log("--> Login " + self.context().familyAdminName());
            
            self.context().ugClient.login(self.context().familyAdminName(), self.context().familyAdminPassword(), function(err, response, user) {
                if (err) {
                    self.context().handleError(err);
                } else {
                    self.context().userLoggedIn(true);
                    //self.context().goTreeView();
                    views.TREE.setCurrent();
                }
            });
        };
    };

    return {
        viewModel: LoginViewModel,
        template: html
    };
});
