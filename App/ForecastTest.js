/**
 * Created by coskudemirhan on 05/07/2017.
 */
var db = require('./Db.js');
var timeseries = require("timeseries-analysis");


module.exports = {
    init: function (bot) {
        db.query('SELECT * FROM prices ORDER BY id DESC LIMIT 1500', function (err, rowsSalt) {
            db.query('SELECT * FROM resources', function (err, resources) {


                for (r in resources) {

                    var resource = resources[r];
                    var rows = rowsSalt.slice(0, resources.mean_count);

                    var lastAskPrices = [], lastBidPrices = [];

                    for (i in rows) {
                        lastAskPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].ask)]);
                        lastBidPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].bid)]);
                    }


                    var tAsk = new timeseries.main(lastAskPrices.reverse());

                    var tBid = new timeseries.main(lastBidPrices.reverse());

                    /*
                     Smoothed
                     */

                    var smoothedAsk = tAsk.smoother({period: resource.smooth_period}).dsp_itrend({
                        alpha: .9
                    }).save('smoothed');


                    var smoothedBid = tBid.smoother({period: resource.smooth_period}).dsp_itrend({
                        alpha: .9
                    }).save('smoothed');


                    /*
                     Forecasted
                     */
                    var Askcoeffs = smoothedAsk.ARMaxEntropy({
                        data: tAsk.data.slice(tAsk.data.length - resource.forecast_count),
                        degree: 10,
                        sample: resource.forecast_count
                    });

                    var Bidcoeffs = smoothedBid.ARMaxEntropy({
                        data: tBid.data.slice(tBid.data.length - resource.forecast_count),
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


                        bot.sendMessage(22353916, resource.owner+' İçin Sonuçlar:');
                        bot.sendMessage(22353916, resource.owner+' Alış Tahmin:' + askForecast);


                        var ask_chart_url = tAsk.chart({main: true, points: [{color: 'ff0000', point: tAsk.data.length}]});
                        bot.sendPhoto(22353916, ask_chart_url);


                        bot.sendMessage(22353916, resource.owner+' Satış Tahmin:' + bidForecast);

                        var bid_chart_url = tBid.chart({main: true, points: [{color: 'ff0000', point: tBid.data.length}]});
                        bot.sendPhoto(22353916, bid_chart_url);

                }

            });

        });
    }
}