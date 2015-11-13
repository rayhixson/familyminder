require.config({
    baseUrl: "lib",

    shim: {
        "bootstrap": { "deps": ["jquery"]},
        "jquery.mousewheel-3.0.6.pack": { "deps": ["jquery"]},
        "jquery.fancybox.pack": { "deps": ["jquery"]},
        "jquery.fancybox-buttons": { "deps": ["jquery", "jquery.fancybox.pack"]},
        "jquery.fancybox-media": { "deps": ["jquery", "jquery.fancybox.pack"]},
        "jquery.fancybox-thumbs": { "deps": ["jquery", "jquery.fancybox.pack"]}
    },

    paths: {
        jquery: "jquery-1.11.3",
        bootstrap: "bootstrap-3.2.0.min",
        knockout: "knockout-3.3.0.debug",
        js: "../js",
        html: "../"
    }
});

require(["knockout", "jquery", "js/context", "js/views", "bootstrap",
         "jquery.mousewheel-3.0.6.pack",
         "jquery.fancybox.pack", "jquery.fancybox-buttons", "jquery.fancybox-media",
         "jquery.fancybox-thumbs"],
function(ko, $, context, views) {
    
    $(".fancybox").fancybox({
        'hideOnContentClick': false
    });

    $(document).ready(function() {
        // cannot get this fucker to work
        $(".modal").on('shown.bs.modal', function() {
            console.log("Looking");
            $(this).find("[autofocus]").focus();
        });
    });

    // -- define knockout components
    ko.components.register("login-component", { require: "js/login-component" });
    ko.components.register("admin-component", { require: "js/admin-component" });
    ko.components.register("family-tree-component", { require: "js/family-tree-component" });

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

    // open modals - do this to keep jQuery UI code out of the ViewModel code
    ko.bindingHandlers.toggleModal = {
        init: function(element, valueAccessor) {
            var value = valueAccessor();
            $(element).modal("hide");
        },
        update: function(element, valueAccessor, allBindings, viewmodel, bindingContext) {
            var value = ko.unwrap(valueAccessor());
            $(element).modal(value ? "show" : "hide");
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
                
                var familyView = bindingContext.$component;
                $(element).on('hidden.bs.modal', function() {
                    familyView.sweep();
                });
            }
        }
    };

    var MainViewModel = function() {
        var self = this;
        self.context = ko.observable(context);
        self.views = ko.observable(views);
    };

    ko.applyBindings(new MainViewModel());

    // global debug function
    inspect = function(obj, result) {
        if (!result) {
            result = "";
        }
        
        if (result.length > 100) {
            return "[MAX DEPTH]";
        }

        var ra = [];
        for (var prop in obj) {
            var t = typeof obj[prop];
            if (t == 'function') {
                ra.push('> '+prop+'['+t+'] => function');
            } else {
                ra.push('> '+prop+'['+t+'] => '+obj[prop]);
            }
        }
        
        return result + ra.join('\n');
    };


});

