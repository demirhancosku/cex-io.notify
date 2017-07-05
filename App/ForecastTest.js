/**
 * Created by coskudemirhan on 05/07/2017.
 */
var db = require('./Db.js');
var timeseries = require("timeseries-analysis");

module.exports = {
    init: function (bot) {
        db.query('SELECT * FROM prices ORDER BY id LIMIT 300', function (err, rows) {


            var lastAskPrices = [], lastBidPrices = [];

            for (i in rows) {
                lastAskPrices.push([new Date(rows[i][3] * 1000), parseFloat(rows[i][1])]);
                lastBidPrices.push([new Date(rows[i][3] * 1000), parseFloat(rows[i][2])]);
            }


            var tAsk = new timeseries.main(lastAskPrices.reverse());

            var tBid = new timeseries.main(lastBidPrices.reverse());


            /*

             */

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


            /*

             */


            tBid.dsp_itrend({
                alpha: 0.1
            }).save('smoothed');

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


        });

    }
}