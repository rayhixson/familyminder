/**
 * 
 */
var HOST = 'http://localhost:8080';
var ORG = "grannyminder";
var APP = "gminder";

function getApp() {
	var url = '/'+ORG+'/'+APP;
	
	http(url, 'GET', null, function(data) {
		$("#app code").html(JSON.stringify(data));
	});
}

function getUsers(callback) {
	var url = '/'+ORG+'/'+APP+'/users';
	
	http(url, 'GET', null, function(data) {
		$("#raw").append(JSON.stringify(data, null, 2));

		var people = '';
		var parray = [];
		
		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var e = data.entities[i];
			//function Person(uuid, name, bday, email, image) {
			var person = new Person(e.uuid, e.username, e.birthday, e.email, e.picture);
			
			if (e.metadata.connections) {
				person.kidsLink = e.metadata.connections.children;
				person.spouseLink = e.metadata.connections.spouse;
			}
			parray.push(person);
			
			people += '<option value="'+e.uuid+'">'
				+ e.username + '</option>';
		}
		
		$("#father").html(people);
		$("#child").html(people);
		
		callback(parray);
	});
}

function derefRelations(parent) {
	// now get the kids
		if (parent.kidsLink) {
			var kurl = '/'+ORG+'/'+APP+parent.kidsLink;
			var daduuid = parent.kidsLink.split('/')[2];
			http(kurl, 'GET', null, function(kdata) {
				console.log("URL : " + kurl);
				console.log("Child Data: " + JSON.stringify(kdata, null, 2));
				var len = kdata.entities.length;
				var kds = [];
				for (var i=0; i < len; i++) {
					kds.push({ "username": kdata.entities[i].username });
				}
				parent.kids(kds);
			});
		}
		if (parent.spouseLink) {
			var kurl = '/'+ORG+'/'+APP+parent.spouseLink;
			var puuid = parent.spouseLink.split('/')[2];
			http(kurl, 'GET', null, function(kdata) {
				var len = kdata.entities.length;
				for (var i=0; i < len; i++) {
					parent.spouseName(kdata.entities[i].username)
				}
			});
		}
}

function removeChildRelation(dad, child, callback) {
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid+'/children/users/'+child
	http(url, 'DELETE', null, function(data) {
		callback();
	});
}

function addChildRelation(dad, child, callback) {
	if (dad.uuid == child) {
		alert("One cannot father oneself.");
		return false;
	}
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid+'/children/'+child;
   	http(url, 'POST', null, function() {
	   	callback();
	});
}

function addSpouseRelation(person, spouse) {
	if (person == spouse) {
		alert("One cannot spouse oneself.");
		return false;
	}
	var url = '/'+ORG+'/'+APP+'/users/'+person+'/spouse/'+spouse;
   	http(url, 'POST', null, function(data) {
   		derefRelations(data);
	});
}

function showToken(token) {
	$("#loggedin").show();
	$("#token").append(token);
	$("#login").hide();
}

function showLogin() {
	$("#loggedin").hide();
	$("#login").show();
}

function logout() {
	Cookies.remove('token');
	showLogin();
}

function login(name, password) {
    var args = "grant_type=password&username="+name+"&password="+password;

    var url = '/'+ORG+'/'+APP+'/token';

    http(url, 'GET', args, function (data) {
    	var token = data.access_token;

		Cookies.set('token', token, { expires: 30 })
		showToken(token);
	});
}

function createUser(username, callback) {
   	var postData = {
        'username': username,
    };
   	
    var url = '/'+ORG+'/'+APP+'/users';
    http(url, 'POST', JSON.stringify(postData), function (data) {
 		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var e = data.entities[i];
			//function Person(uuid, name, bday, email, image) {
			var person = new Person(e.uuid, e.username, e.birthday, e.email, e.picture);
			
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
	if (method == 'POST') {
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
		.done(function(data, status, xhr) {
			if (method != 'GET') {
				console.log("XHR: " + xhr.responseText);
				console.log("Data: " + JSON.stringify(data, null, 2));
			}
			callback(data);
		})
		.fail(function(xhr, status, err) {
			alert("Fail to "+method+": " + status +", " + err + ", "+ xhr.responseText);
	});
}
