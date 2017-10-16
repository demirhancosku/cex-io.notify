"use strict";

const db = require('./App/Db.js'),
    client = require('./App/Client.js'),
    _ = require('underscore'),
    config = require('./config.js');


setInterval(function () {
    client.api.multiSymbol('BTC/ETH/USD').then(function (result) {

        if (config.debug) {
            console.log(result);
            console.log('\n');
        }

        let BTC_USD = _.findWhere(result.data, {pair: 'BTC:USD'});
        let ETH_USD = _.findWhere(result.data, {pair: 'ETH:USD'});


        db.query("INSERT INTO prices SET ?", {
            ask: BTC_USD.ask,
            bid: BTC_USD.bid,
            symbol: 'BTC/USD',
            timestamp: BTC_USD.timestamp
        });

        db.query("INSERT INTO prices SET ?", {
            ask: ETH_USD.ask,
            bid: ETH_USD.bid,
            symbol: 'ETH/USD',
            timestamp: ETH_USD.timestamp
        });

    });

}, 10000);







