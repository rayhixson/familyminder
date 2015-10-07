/**
 * 
 */
var HOST = 'http://localhost:8080';
var ORG = "grannyminder";
var APP = "gminder";

ko.bindingHandlers.fadeAlert = {
	init: function(element, valueAccessor) {
		var value = valueAccessor();
		$(element).toggle(ko.unwrap(value));
	},
	update: function(element, valueAccessor) {
		var value = valueAccessor();
		// only respond to true events and let the alert fade out on its own
		if (ko.unwrap(value)) {
			$(element).fadeIn(600).slideUp(500, function() {
				// ?
			});
		}
	}
};

function getApp() {
	var url = '/'+ORG+'/'+APP;
	
	http(url, 'GET', null, function(data) {
		$("#app code").html(JSON.stringify(data));
	});
}

function getUser(nameOrId, callback) {
	var url = '/'+ORG+'/'+APP+'/users/'+nameOrId;
	
	var person = null;
	http(url, 'GET', null, function(data) {
		$("#raw").append(JSON.stringify(data, null, 2));

		person = personFromEntity(data.entities[0]);
		
		callback(person);
	});
}

function getUsers(callback) {
	var url = '/'+ORG+'/'+APP+'/users';
	
	http(url, 'GET', null, function(data) {
		//$("#raw").append(JSON.stringify(data, null, 2));

		var parray = [];
		
		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var person = personFromEntity(data.entities[i]);
			parray.push(person);
		}
		
		callback(parray);
	});
}

function derefRelations(parent) {
	// now get the kids
	if (parent.kidsLink()) {
		var kurl = '/'+ORG+'/'+APP+parent.kidsLink();

		var kds = [];
		http(kurl, 'GET', null, function(kdata) {
			//console.log("URL : " + kurl);
			//console.log("Child Data: " + JSON.stringify(kdata, null, 2));
			var len = kdata.entities.length;
			for (var i=0; i < len; i++) {
				var p = personFromEntity(kdata.entities[i]);
				kds.push(p);
				derefRelations(p);
			}
			parent.kids(kds);
		});
	}
	if (parent.spouseLink().length > 0) {
		var kurl = '/'+ORG+'/'+APP+parent.spouseLink();
		
		http(kurl, 'GET', null, function(kdata) {
			var p = personFromEntity(kdata.entities[0]);
			parent.spouse(p);
			parent.spouseUuid(p.uuid());
		});
	}
}

function removeChildRelation(dad, child, callback) {
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid()+'/children/users/'+child;
	http(url, 'DELETE', null, function(data) {
		callback();
	});
}

function removeSpouseRelation(person, callback) {
	// do they have an existing spouse?
	if (person.spouse()) {
		//var url = '/'+ORG+'/'+APP+'/users/'+person.uuid()+'/spouse/users/'+person.spouseName
		var url = '/'+ORG+'/'+APP+ person.spouseLink() + "/" + person.spouse().uuid();
		http(url, 'DELETE', null, callback);
	}
}

function addChildRelation(dad, child, callback) {
	if (dad.uuid == child) {
		alert("One cannot father oneself.");
		return false;
	}
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid()+'/children/'+child;
   	http(url, 'POST', null, callback);
}

/**
 * Will first delete the old spouse relation if there is one 
 * @param person Person object
 * @param spouseUuid String of the uuid for a person
 * @param callback
 * @returns {Boolean}
 */
function addSpouseRelation(person, spouseUuid, callback) {
	if (person.uuid() == spouseUuid) {
		alert("One cannot spouse oneself.");
		return false;
	}

	removeSpouseRelation(person);
	
	// if it's 'undefined' then this is just a delete
	if (spouseUuid && !spouseUuid.startsWith("undefined")) {
		var url = '/'+ORG+'/'+APP+'/users/'+person.uuid()+'/spouse/'+spouseUuid;
   		http(url, 'POST', null, callback);
	}
}

function createUser(username, callback) {
   	var postData = {
        'username': username
    };
   	
    var url = '/'+ORG+'/'+APP+'/users';
    http(url, 'POST', JSON.stringify(postData), function (data) {
 		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var person = personFromEntity(data.entities[i]);
			
			callback(person);
		}
	});
}

function saveUser(id, username, bday, email, imgUrl, callback) {
   	var postData = {
        'username': username,
        'picture': imgUrl,
        'birthday': bday,
       	'email': email
    };
   	
    var url = '/'+ORG+'/'+APP+'/users/'+id;
    http(url, 'PUT', JSON.stringify(postData), callback);
}

function http(url, method, data, callback) {

	var headers = null;
	if (method == 'POST' || method == 'PUT') {
		headers = {
			'Content-Type': 'application/json'		
		};
	}
	
	var token = Cookies.get('token');
    if (token) {
        headers = {'Authorization' : 'Bearer ' + token};
    }

	var uri = HOST + url;
	
	$.ajax({
		url: uri,
		data: data,
		type: method,
		headers: headers,
		dataType: "json"
	})
		.done(function(resp, status, xhr) {
			//if (method != 'GET') {
				console.log("URL: " + uri);
				console.log("Post Data: " + data);
				console.log("Response: " + JSON.stringify(resp, null, 2));
			//}
			if (callback) {
				callback(resp);
			}
		})
		.fail(function(xhr, status, err) {
			alert("Fail to "+method+": URL="+uri+"; " + status +", " + err + ", "+ xhr.responseText);
	});
}
