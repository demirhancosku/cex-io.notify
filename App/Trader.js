/**
 * Created by coskudemirhan on 04/07/2017.
 */
var db = require('./Db.js');
var timeseries = require("timeseries-analysis");
var fs = require('fs');


var forecastCount = 120;
var buyProfitMargin = 2;
var sellProfitMargin = 1;

var debug = true;//TODO: Take this to the config file
var bot = {};
var resourcesConatiner = [];

var forecast = function (resources) {
    db.query('SELECT * FROM prices ORDER BY id DESC LIMIT 300', function (err, rows) {

            var lastAskPrices = [], lastBidPrices = [];

            for (i in rows) {
                lastAskPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].ask)]);
                lastBidPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].bid)]);
            }



            var tAsk = new timeseries.main(lastAskPrices.reverse());

            var smoothedAsk = tAsk.smoother({period: 6}).dsp_itrend({
                alpha: 0.9
            }).save('smoothed');


            var tBid = new timeseries.main(lastBidPrices.reverse());

            var smoothedBid = tBid.smoother({period: 6}).dsp_itrend({
                alpha: 0.9
            }).save('smoothed');


            var Askcoeffs = smoothedAsk.ARMaxEntropy({
                data: tAsk.data.slice(tAsk.data.length - forecastCount),
                degree: 10,
                sample: forecastCount
            });

            var Bidcoeffs = smoothedBid.ARMaxEntropy({
                data: tBid.data.slice(tBid.data.length - forecastCount),
                degree: 10,
                sample: forecastCount
            });


            var askForecast = 0;
            for (var i = 0; i < Askcoeffs.length; i++) {
                askForecast -= tAsk.data[tAsk.data.length - 1 - i][1] * Askcoeffs[i];
            }

            var bidForecast = 0;
            for (var k = 0; k < Bidcoeffs.length; k++) {
                bidForecast -= tBid.data[tBid.data.length - 1 - k][1] * Bidcoeffs[k];
            }

            if (debug) {
                console.log('Alış Fiyatı: ' + lastAskPrices[lastAskPrices.length - 1][1]);
                console.log('Tahmini Alış Fiyatı: ' + askForecast);
                console.log('Ortalama Alış Fiyatı: ' + tAsk.mean());
            }

            for (r in resources) {

                var resource = resources[r];

                var suitableForAsk = false;
                if (resource.ask === null) {

                    if (parseFloat(lastAskPrices[lastAskPrices.length - 1][1]) < tAsk.mean()) {
                        if (parseFloat(askForecast) > parseFloat(lastAskPrices[lastAskPrices.length - 1][1])) {

                            if ((parseFloat(resource.bid) - parseFloat(buyProfitMargin)) < (parseFloat(lastAskPrices[lastAskPrices.length - 1][1]))) {

                                suitableForAsk = true;
                                buyNow(resource, lastAskPrices[lastAskPrices.length - 1][1], tAsk);
                            }

                        }

                    }

                    if (debug)
                        console.log(resource.bid + ' için alış istediğimiz değer: ' + (parseFloat(resource.bid) - parseFloat(buyProfitMargin)));


                    if (debug)
                        console.log(resource.bid + ' ile sattığımız alış için uygun mu: ' + suitableForAsk);
                }

            }


            if (debug) {
                console.log('\n');
                console.log('Satış Fiyatı: ' + lastBidPrices[lastBidPrices.length - 1][1]);
                console.log('Tahmini Satış Fiyatı: ' + bidForecast);
                console.log('Ortalama Satış Fiyatı: ' + tBid.mean());
            }


            for (t in resources) {

                var resource = resources[t];
                var suitableForBid = false;
                if (resource.bid === null) {

                    if (lastBidPrices[lastBidPrices.length - 1][1] > tBid.mean()) {

                        if (bidForecast < lastBidPrices[lastBidPrices.length - 1][1]) {


                            if ((parseFloat(resource.ask) + parseFloat(sellProfitMargin) ) < parseFloat(lastBidPrices[lastBidPrices.length - 1][1])) {

                                suitableForBid = true;
                                sellNow(resource, lastBidPrices[lastBidPrices.length - 1][1], tBid);
                            }
                        }

                    }

                    if (debug) {
                        console.log(resource.ask + ' için satış istediğimiz değer: ' + ( parseFloat(resource.ask) + parseFloat(sellProfitMargin) ));
                        console.log(resource.ask + ' ile aldığımız satış için uygun mu: ' + suitableForBid + '\n');


                    }
                }

                if (debug) {

                    console.log('\n');
                    console.log('\n');
                }

            }



    });
}


var init = function (client, chatBot) {
    bot = chatBot;
    setInterval(function () {
        fs.readFile('resources.json', 'utf8', function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                resourcesConatiner = JSON.parse(data);
                forecast(resourcesConatiner);
            }
        });
    }, 5000);


    db.query('SELECT * FROM market_logs', function (err, rows) {
        var total = 0;

        for (i in rows) {

            if (rows[i].type === 'buy') {
                total -= rows[i].value * rows[i].amount;
            } else {
                total += rows[i].value * rows[i].amount;
            }

        }

        console.log('Total İşlem Karı: ' + total + '$');
    });


}

var buyNow = function (resource, ask, t) {
    bot.sendMessage(22353916, ask + '$ değerinde ' + resource.amount + ' ETH Satın Aldım');

    var chart_url = t.chart();
    bot.sendPhoto(22353916,chart_url);


    fs.readFile('resources.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
        } else {
            var resources = JSON.parse(data);

            for (i in resources) {
                if (resources[i].bid === resource.bid) {
                    resources[i].ask = ask;
                    resources[i].bid = null;
                }
            }
            resourcesConatiner = resources;
            fs.writeFile('resources.json', JSON.stringify(resources), 'utf8', function () {
                db.query("INSERT INTO market_logs SET ?", {
                    type: 'buy',
                    value: ask,
                    amount: resource.amount,
                    timestamp: +new Date()
                });
            });
        }
    });

}

var sellNow = function (resource, bid, t) {
    bot.sendMessage(22353916, bid + '$ değerinde ' + resource.amount + ' ETH Sattım');

    var chart_url = t.chart();
    bot.sendPhoto(22353916,chart_url);


    fs.readFile('resources.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
        } else {
            var resources = JSON.parse(data);

            for (i in resources) {
                if (resources[i].bid === resource.bid) {
                    resources[i].ask = null;
                    resources[i].bid = bid;
                }
            }

            resourcesConatiner = resources;
            fs.writeFile('resources.json', JSON.stringify(resources), 'utf8', function () {
                db.query("INSERT INTO market_logs SET ?", {
                    type: 'sell',
                    value: bid,
                    amount: resource.amount,
                    timestamp: +new Date()
                });
            });
        }
    });


}

module.exports = {
    init: init
}