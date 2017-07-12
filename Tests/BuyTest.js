/**
 * Created by coskudemirhan on 11/07/2017.
 */

var client = require('../App/Client.js');
var db = require('../App/Db.js');

var ask = 209.95;

var buyPrice = (0.1 * ask) + 0.05;

/*
client.api.buy_sell('buy', buyPrice.toFixed(2), 'ETH/USD', function (result) {
    if (result.error !== undefined) {
        console.log('ERROR');
        console.log(result);

    } else {
        console.log(result);


        db.query("UPDATE resources SET ? WHERE ?", [
            {
                ask: ask,
                bid: null,
                timestamp: +new Date(),
                idle_count: 0

            },
            {
                id: 4
            }
        ], function () {
            db.query("INSERT INTO market_logs SET ?", {
                type: 'buy',
                value: ask,
                amount: 0.1,
                order_id: result.id,
                timestamp: result.timestamp
            });
        });
    }
});

*/