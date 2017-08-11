/**
 * Created by coskudemirhan on 17/06/2017.
 */

var db = require('./App/Db.js');
var client = require('./App/Client.js');
var config = require('./config.js');


setInterval(function () {
    client.api.ticker(couple = 'ETH/USD', function (param) {
        if(config.debug){
            console.log(param);
            console.log('\n');
        }

        db.query("INSERT INTO prices SET ?", {ask: param.ask, bid: param.bid, timestamp: param.timestamp});
        db.query("INSERT INTO _prices SET ?", {ask: param.ask, bid: param.bid, symbol: 'ETH/USD',timestamp: param.timestamp});

    });
}, 10000);







