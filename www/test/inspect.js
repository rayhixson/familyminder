// -------------------  INSPECTOR ------------------

var inspect = function(o) {
    console.log('-- inspecting --');
    for (p in o) {
        var t = typeof o[p];
        console.log('-> '+p+' ['+t+'] => '+o[p]);
    }
}


var o = new Object();
o['a'] = function() { return 3; };
o['b'] = 'B';

if ('a' in o)
    console.log("Yep");



var a = "a";
var x = {};
x[a] = 42;

console.log(JSON.stringify(x));
inspect(x);
