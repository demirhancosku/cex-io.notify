/**
 * Created by coskudemirhan on 17/06/2017.
 */

var db = require('./App/Db.js');
var client = require('./App/Client.js');

setInterval(function () {
    client.api.ticker(couple = 'ETH/USD', function (param) {
        db.query("INSERT INTO prices SET ?", {ask: param.ask, bid: param.bid, timestamp: param.timestamp});
    });
}, 10000);







