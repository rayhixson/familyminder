/**
 * 
 */
define(function(require) {
    var $ = require('jquery');

    /*
     * 
     */
    var ApiClient = function(context) {
		this.context = context;

        this.tokenKey = "fm_token";

        this.token = localStorage.getItem(this.tokenKey);
    };

    ApiClient.prototype._buildUrl = function() {
        return this.context.apiHost() + '/orgminder/' + this.context.orgName();
    };

    ApiClient.prototype.isLoggedIn = function() {
        return (this.token != null);
    };

    /**
     * Auth a user and set the token in local storage for future calls
     */
    ApiClient.prototype.login = function(username, password, callback) {
        var url = this.context.apiHost() + "/admin/token";
        
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

	ApiClient.prototype.getOrgs = function(callback) {
		var url = this.context.apiHost() + "/admin/orgs"

        this._http(url, "GET", null, function(err, response) {
			callback(err, response);
        });
	};

	ApiClient.prototype.createOrg = function(orgName, callback) {
		var url = this.context.apiHost() + "/admin/orgs"

		var data = {
			name: orgName,
        };

        this._http(url, "POST", data, function(err, response) {
			callback(err, response);
        });
	};

    ApiClient.prototype.logout = function(username, callback) {
        localStorage.removeItem(this.tokenKey);
        
        var url = this._buildUrl() + "/persons/" + username + "/revoketokens";

        this._http(url, "PUT", null, callback);
    };

	ApiClient.prototype.createPerson = function(person, callback) {
		var uri = this._buildUrl() + "/persons"
        this._http(uri, "POST", person, callback);
	}

	ApiClient.prototype.savePerson = function(person, callback) {
		var uri = this._buildUrl() + "/persons/" + person.uuid
        this._http(uri, "PUT", person, callback);
	}

	ApiClient.prototype.deletePerson = function(uuid, callback) {
		var uri = this._buildUrl() + "/persons/" + person.uuid
        this._http(uri, "DELETE", null, callback);
	}

	ApiClient.prototype.addSpouse = function(personId, spouseId, callback) {
		var uri = this._buildUrl() + "/persons/" + personId + "/spouse/" + spouseId
        this._http(uri, "POST", null, callback);
	}

	ApiClient.prototype.addKid = function(parentId, kidId, callback) {
		var uri = this._buildUrl() + "/persons/" + parentId + "/children/" + kidId
        this._http(uri, "POST", null, callback);
	}

	ApiClient.prototype.getPerson = function(uuid, callback) {
		var uri = this._buildUrl() + "/persons/" + uuid
        this._http(uri, "GET", null, callback);
	}

	ApiClient.prototype.getDad = function(callback) {
		return this.getPerson("dad", callback)
	}

    ApiClient.prototype._http = function(uri, method, data, callback) {
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

    return ApiClient;
});
