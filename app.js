var accounts = require("./config").accounts
var later = require('later');
var v2ex = require('./v2ex');

function task(sched, fntask) {
	later.date.localTime();
	later.setInterval(fntask, sched);
}


var sched = {
	schedules: [{
		h: [9],
		m: [0],
		s: [0]
	}]
};

task(sched, function() {
	accounts.forEach(function(account) {
		v2ex(account);
	});
});
console.log("...")