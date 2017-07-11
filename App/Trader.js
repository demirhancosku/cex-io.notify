/**
 * Created by coskudemirhan on 04/07/2017.
 */

var colors = require('colors/safe');
var https = require("https");
var util = require('../Utils/TradeUtil.js');

colors.setTheme({
    silly: 'rainbow',
    buy: 'cyan',
    sell: 'green',
    forecast: 'yellow',
    debug: 'blue',
    red: 'red'
});


var db = require('./Db.js');
var timeseries = require("timeseries-analysis");
var fs = require('fs');

var config = require('../config.js');
var client;

var intervalSecond = 10;
var debug = config.debug;//TODO: Take this to the config file
var bot = {};

var forecast = function () {
    db.query('SELECT * FROM resources WHERE status = 1', function (err, resources) {

        db.query('SELECT * FROM prices ORDER BY id DESC LIMIT 10000', function (err, rowsSalt) {

            if (debug){
                console.log(colors.silly('*******************************************************************'));
                console.log(colors.buy('Buy Price: $' + rowsSalt[0].ask));
                console.log(colors.sell('Sell Price: $' + rowsSalt[0].bid));
                console.log(colors.debug('------------------------------------------------'));
            }



            for (r in resources) {

                var resource = resources[r];

                var lastAskPrices = [], lastBidPrices = [];
                var rows = rowsSalt.slice(0, resource.mean_count).reverse();

                for (i in rows) {
                    lastAskPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].ask)]);
                    lastBidPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].bid)]);
                }

                var lastAskPrice = parseFloat(lastAskPrices[lastAskPrices.length - 1][1]);

                var tAsk = new timeseries.main(lastAskPrices);

                console.log(colors.silly(resource.owner + ' Price Count: ') + colors.red('$' + tAsk.data.length));

                var smoothedAsk = tAsk.smoother({period: resource.smooth_period}).dsp_itrend({
                    alpha: resource.trend_alpha
                }).save('smoothed');


                var tBid = new timeseries.main(lastBidPrices);

                var smoothedBid = tBid.smoother({period: resource.smooth_period}).dsp_itrend({
                    alpha: resource.trend_alpha
                }).save('smoothed');


                var Askcoeffs = smoothedAsk.ARMaxEntropy({
                    data: smoothedAsk.data.slice(tAsk.data.length - resource.forecast_count),
                    degree: 10,
                    sample: resource.forecast_count
                });

                var Bidcoeffs = smoothedBid.ARMaxEntropy({
                    data: smoothedBid.data.slice(tBid.data.length - resource.forecast_count),
                    degree: 10,
                    sample: resource.forecast_count
                });


                var askForecast = 0;
                for (var i = 0; i < Askcoeffs.length; i++) {
                    askForecast -= tAsk.data[tAsk.data.length - 1 - i][1] * Askcoeffs[i];
                }

                var bidForecast = 0;
                for (var k = 0; k < Bidcoeffs.length; k++) {
                    bidForecast -= tBid.data[tBid.data.length - 1 - k][1] * Bidcoeffs[k];
                }

                if (debug)
                console.log(colors.debug(resource.owner + ' processed in the last ') + colors.red(Math.floor(( (smoothedAsk.data[smoothedAsk.data.length - 1][0] - smoothedAsk.data[0][0]) / 1000) / 60) + ' munites.') + colors.debug(' Mean count: ') + colors.red(smoothedAsk.data.length))

                var suitableForAsk = false;
                if (resource.ask === null) {


                    var lastForecastAsk = smoothedAsk.data[smoothedAsk.data.length - 1][1];

                    if (debug) {

                        var buyState = 'none';
                        if (parseFloat(askForecast) < lastForecastAsk) {
                            buyState = 'down';
                        } else if (parseFloat(askForecast) > lastForecastAsk) {
                            buyState = 'up';
                        }

                        console.log(colors.buy(resource.owner + ' Forecasted Buy Price: ') + colors.forecast('$' + askForecast) + colors.buy(' State:') + colors.blue(buyState));
                        console.log(colors.buy(resource.owner + ' Previous Forecasted Buy: ') + colors.forecast('$' + lastForecastAsk));
                        console.log(colors.buy(resource.owner + ' Buy Price Mean: ') + colors.red('$' + tAsk.mean()));
                    }


                    //if (lastAskPrice < tAsk.mean()) {
                        //if (askForecast > lastForecastAsk  /*lastAskPrice*/) {
                    var promiseResultAsk = util.deepPromise(smoothedAsk,21)
                     if (promiseResultAsk) {



                            if ((parseFloat(resource.bid) - parseFloat(resource.buy_margin)) > (lastAskPrice)) {

                                suitableForAsk = true;
                                buyNow(resource, lastAskPrices[lastAskPrices.length - 1][1]);
                            }else{
                                if(debug){
                                    console.log(colors.buy(resource.owner + ' Deep True / Margin False '));
                                }
                            }


                        }

                    //}

                    if (debug) {
                        console.log(colors.buy('For ' + resource.owner + ' Selled at ') + colors.red('$' + +resource.bid) + colors.buy('. Expected Purchase Value: ') + colors.red('$' + (parseFloat(resource.bid) - parseFloat(resource.buy_margin))));
                        console.log(colors.buy('Is suitable: ' + suitableForAsk+' Promise Result: ' + promiseResultAsk));
                    }

                    if (!suitableForAsk) {
                        idle(resource);
                    }

                }

                var suitableForBid = false;
                if (resource.bid === null) {

                    var lastForecastBid = smoothedBid.data[smoothedBid.data.length - 1][1];

                    if (debug) {

                        var sellState = 'none';
                        if (parseFloat(bidForecast) < lastForecastBid) {
                            sellState = 'down';
                        } else if (parseFloat(bidForecast) > lastForecastBid) {
                            sellState = 'up';
                        }

                        console.log(colors.sell(resource.owner + ' Forecasted Sell Price: ') + colors.forecast('$' + (parseFloat(bidForecast))) + colors.sell(' State:') + colors.blue(sellState));
                        console.log(colors.sell(resource.owner + ' Previous Forecasted Sell: ') + colors.forecast('$' + lastForecastBid));
                        console.log(colors.sell(resource.owner + ' Sell Price Mean: ') + colors.red('$' + tBid.mean()));
                    }

                    //if (lastBidPrices[lastBidPrices.length - 1][1] > tBid.mean()) {

                        //if (parseFloat(bidForecast) < lastForecastBid /*lastBidPrices[lastBidPrices.length - 1][1]*/) {
                        var promiseResultBid = util.peakPromise(smoothedBid, 21);
                        if (promiseResultBid) {


                            if ((parseFloat(resource.ask) + parseFloat(resource.sell_margin) ) < parseFloat(lastBidPrices[lastBidPrices.length - 1][1])) {

                                suitableForBid = true;
                                sellNow(resource, lastBidPrices[lastBidPrices.length - 1][1]);
                            }else{
                                if(debug){
                                    console.log(colors.buy(resource.owner + ' Peek True / Margin False '));
                                }
                            }

                        }

                    //}

                    if (debug) {

                        console.log(colors.sell('For ' + resource.owner + ' Purchased at ') + colors.red('$' + +resource.ask) + colors.sell(' Expected Sell Value: ') + colors.red('$' + ( parseFloat(resource.ask) + parseFloat(resource.sell_margin))));
                        console.log(colors.sell('Is suitable: ' + suitableForBid +' Promise Result: ' + promiseResultBid));

                    }

                    if (!suitableForBid) {
                        idle(resource);
                    }
                }


                if (debug) {
                    console.log(colors.debug('------------------------------------------------'));



                }


            }


        });
    });
}


var init = function (clnt, chatBot) {
    bot = chatBot;
    client = clnt;


    forecast();
    setInterval(forecast, intervalSecond * 1000);


}

var buyNow = function (resource, ask) {

    client.api.buy_sell('buy', resource.amount, 'ETH/USD', function (result) {
        if (result.error !== undefined) {
            console.log('ERROR');
        } else {

            bot.sendMessage(22353916, ask + '$ değerinde ' + resource.amount + ' ETH Satın Aldım ' + resource.owner);


            db.query("UPDATE resources SET ? WHERE ?", [
                {
                    ask: ask,
                    bid: null,
                    timestamp: +new Date(),
                    idle_count: 0

                },
                {
                    id: resource.id
                }
            ], function () {
                db.query("INSERT INTO market_logs SET ?", {
                    type: 'buy',
                    value: ask,
                    amount: resource.amount,
                    order_id: result.id,
                    timestamp: result.timestamp
                });
            });
        }
    });

}


var sellNow = function (resource, bid) {

    client.api.buy_sell('sell', resource.amount, 'ETH/USD', function (result) {
        if(result.error !== undefined){
            console.log('ERROR');
        }else{

            bot.sendMessage(22353916, bid + '$ değerinde ' + resource.amount + ' ETH Sattım '+ resource.owner);


            db.query("UPDATE resources SET ?  WHERE ?", [
                {
                    ask: null,
                    bid: bid,
                    timestamp: +new Date(),
                    idle_count: 0

                },
                {
                    id: resource.id
                }
            ], function () {
                db.query("INSERT INTO market_logs SET ?", {
                    type: 'sell',
                    value: bid,
                    amount: resource.amount,
                    order_id: result.id,
                    timestamp: result.timestamp
                });
            });

        }
    });


}

var idle = function (resource) {

    db.query("UPDATE resources SET ?  WHERE ?", [
        {
            idle_count: resource.idle_count + 1,
            timestamp: +new Date()
        },
        {
            id: resource.id
        }
    ], function () {

        if (resource.idle_count + 1 === 720 * 2 || resource.idle_count + 1 === 720 * 4 || resource.idle_count + 1 === 720 * 8) {
            bot.sendMessage(22353916, resource.owner + ' parası ' + parseInt(((resource.idle_count + 1) * intervalSecond) / 60 / 60) + ' saattir işlem göremiyor.');
        }
    });
}

module.exports = {
    init: init
}