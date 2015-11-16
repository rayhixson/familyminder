define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        views = require('js/views'),
        UsergridClient = require('usergrid-utilities'),
        html = require('text!html/login-component.html');

    function LoginViewModel() {
        var self = this;

        self.context = ko.observable(context);

        // Behaviors

        self.login = function() {
            console.log("--> Login " + context.familyAdminName());

            context.ugClient = new UsergridClient().create(context.ugHost(),
                                                     context.ugOrganization(),
                                                     context.familyName(),
                                                     false);

            context.ugClient.login(context.familyAdminName(), context.familyAdminPassword(), function(err, reseponse) {
                if (err) {
                    context.handleError(err);
                } else {
                    context.userLoggedIn(true);
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
