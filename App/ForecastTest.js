/**
 * Created by coskudemirhan on 05/07/2017.
 */
var db = require('./Db.js');
var timeseries = require("timeseries-analysis");

var forecastCount = 120;
module.exports = {
    init: function (client, bot) {
        db.query('SELECT * FROM prices ORDER BY id DESC LIMIT 300', function (err, rows) {


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

            var smoothedAsk = tAsk.smoother({period: 6}).dsp_itrend({
                alpha: .9
            }).save('smoothed');


            var smoothedBid = tBid.smoother({period: 6}).dsp_itrend({
                alpha: .9
            }).save('smoothed');


            /*
             Forecasted
             */
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


            bot.sendMessage(22353916, 'Sonuçlar:');

            setTimeout(function () {
                bot.sendMessage(22353916, 'Alış Tahmin:' + askForecast);

            }, 400);

            var ask_chart_url = tAsk.chart({main: true, points: [{color: 'ff0000', point: tAsk.data.length}]});
            setTimeout(function () {
                bot.sendPhoto(22353916, ask_chart_url);
            }, 800);


            setTimeout(function () {
                bot.sendMessage(22353916, 'Satış Tahmin:' + bidForecast);
            }, 1200);

            var bid_chart_url = tBid.chart({main: true, points: [{color: 'ff0000', point: tBid.data.length}]});
            setTimeout(function () {
                bot.sendPhoto(22353916, bid_chart_url);
            }, 1600);


            /* Auto Optimezed */

            /*


             tAsk.dsp_itrend({
             alpha: 0.1
             }).save('smoothed');

             var bestAskSettings = tAsk.regression_forecast_optimize();
             console.log('Best ASK Settings:');
             console.log(bestAskSettings);

             tAsk.sliding_regression_forecast({
             sample: bestAskSettings.sample,
             degree: bestAskSettings.degree,
             method: bestAskSettings.method
             });

             var askChartUrl = tAsk.chart({
             main: false,
             points: [{color: 'ff0000', point: bestAskSettings.sample, serie: 0}]
             });
             bot.sendMessage(22353916, 'ASK CHart: ' + askChartUrl);


             var bestBidSettings = tAsk.regression_forecast_optimize();
             console.log('Best BID Settings:');
             console.log(bestBidSettings);

             tBid.sliding_regression_forecast({
             sample: bestBidSettings.sample,
             degree: bestBidSettings.degree,
             method: bestBidSettings.method
             });

             var bidChartUrl = tBid.chart({
             main: false,
             points: [{color: 'ff0000', point: bestBidSettings.sample, serie: 0}]
             });
             bot.sendMessage(22353916, 'BID CHart: ' + bidChartUrl);
             */


        });

    }
}