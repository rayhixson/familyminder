define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        views = require('js/views'),
        ApiClient = require('api-client'),
        html = require('text!html/login-component.html');

    function LoginViewModel() {
        var self = this;

        self.context = ko.observable(context);

        // Behaviors

        self.login = function() {
            console.log("--> Login " + context.userName());

            context.client = new ApiClient(context);

            context.client.login(context.userName(), context.password(), function(err, response) {
                if (err) {
                    context.handleError(err);
                } else {
                    context.userLoggedIn(true);
                    views.ADMIN.setCurrent();
                }
            });
        };
    };
    
    return {
        viewModel: LoginViewModel,
        template: html
    };
});
