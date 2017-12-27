/**
 * 
 */
define(function(require) {
    var $ = require('jquery');

    /*
     * 
     */
    var UgClient = function(ugHost, ugOrganization, appName, isAdminClient) {
        this.isAdminClient = isAdminClient;
        
        this.ugHost = ugHost;
        this.ugOrganization = ugOrganization;
        this.appName = appName;

        this.tokenKey = isAdminClient ? "fm_ug_admin_token" : "fm_ug_family_token";

        this.token = localStorage.getItem(this.tokenKey);
    };

    UgClient.prototype._buildUrl = function() {
        return this.ugHost + '/' + this.ugOrganization +
            '/' + this.appName;
    };

    UgClient.prototype.isLoggedIn = function() {
        return (this.token != null);
    };

    /**
     * Auth a user and set the token in local storage for future calls
     */
    UgClient.prototype.login = function(username, password, callback) {
        var url = this._buildUrl() + "/token";
        
        if (this.isAdminClient) {
            url = this.ugHost + "/management/token";
        }

        // don't reuse the old token if there is one
        this.token = null;
        
        var data = {
            username: username,
            password: password,
            grant_type: "password"
        };

        var client = this;

        this._http(url, "POST", data, function(err, response) {
            if (!err) {
                localStorage.setItem(client.tokenKey, response.access_token);
                client.token = response.access_token;
            }
            // either way invoke the callback
            callback(err, response);
        });
    };

    UgClient.prototype.logout = function(username, callback) {
        localStorage.removeItem(this.tokenKey);
        
        var url = this._buildUrl() + "/users/" + username + "/revoketokens";

        this._http(url, "PUT", null, callback);
    };

    /*
     * Expections options like this:
     * {
     *   endpoint : "users",
     *   method : "POST",
     *   body {
     *     username: "bob"
     *   }
     * }
     *
     */
    UgClient.prototype.request = function(options, callback) {
        var uri = this._buildUrl();

		console.log("--===--> " + options.endpoint)

        // admin type request?
        if (options.endpoint.toString().startsWith("management")) {
            uri = this.ugHost;
        }
        
        if (!options.endpoint.toString().startsWith('/')) {
            uri += '/';
        }
        uri += options.endpoint;

        this._http(uri, options.method, options.body, callback);
    };

    UgClient.prototype._http = function(uri, method, data, callback) {
	    var headers = null;
	    if (method == 'POST' || method == 'PUT') {
		    headers = {
			    'Content-Type': 'application/json'		
		    };
	    }
	    
        if (this.token) {
            //headers = {'Authorization' : 'Bearer ' + token};
            uri += '?access_token=' + this.token;
        }

	    $.ajax({
		    url: uri,
		    data: JSON.stringify(data),
		    type: method,
		    headers: headers,
		    dataType: "json"
	    })
		    .done(function(resp, status, xhr) {
			    //if (method != 'GET') {
				console.log("URL: " + uri);
				console.log("Post Data: " + JSON.stringify(data));
				console.log("Response: " + JSON.stringify(resp, null, 2));
			    //}
			    if (callback) {
				    callback(null, resp);
			    }
		    })
		    .fail(function(xhr, status, err) {
			    console.log("Fail to "+method+": URL="+uri+"; " + status +", " + err + ", "+ xhr.responseText);
                var e = null;
                if (xhr.responseText) {
					/*
                    var r = JSON.parse(xhr.responseText);
                    e = r.error_description
                        ? r.error_description
                        : xhr.responseText;
*/
                }
                if (!err) {
                    err = "Unknown failure";
                }
                if (e) {
                    err = e;
                }
                
                callback(err + ": " + xhr.responseText, xhr.responseText);
	        });
    };

    return UgClient;
});
