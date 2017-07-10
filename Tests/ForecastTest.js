/**
 * Created by coskudemirhan on 05/07/2017.
 */
var ChartjsNode = require('chartjs-node');


var db = require('../App/Db.js');
var timeseries = require("timeseries-analysis");

var colors = require('colors/safe');

colors.setTheme({
    silly: 'rainbow',
    buy: 'cyan',
    sell: 'green',
    forecast: 'yellow',
    debug: 'blue',
    red: 'red'
});

var util = require('../Utils/TradeUtil.js');

var resource = {
    'id' : '05day',
    'owner': 'Test Short Wave Resource',
    'ask': 200,
    'bid': null,
    'amount': 0.1,
    'buy_margin': 0.5,
    'sell_margin': 0.5,
    'forecast_count': 120,
    'mean_count': 800,
    'smooth_period': 100,
    'trend_alpha': 0.7,
    'degree': 30
};

var dayCount = 5;

var profit = -27;

var startPriceIndex = 0;
var delayWindow = 10;

var trades = {
    'sell': [],
    'buy': []
};

var windowDivider = function (rowsSalt, means) {

    var rows = rowsSalt.slice(startPriceIndex, resource.mean_count + startPriceIndex);


    var lastAskPrices = [], lastBidPrices = [];

    for (i in rows) {
        lastAskPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].ask)]);
        lastBidPrices.push([new Date(rows[i].timestamp * 1000), parseFloat(rows[i].bid)]);
    }



    var tAsk = new timeseries.main(lastAskPrices);

    var tBid = new timeseries.main(lastBidPrices);

    /*
     Smoothed
     */
    var smoothedAsk = tAsk.smoother({period: resource.smooth_period}).dsp_itrend({
        alpha: resource.trend_alpha
    }).save('smoothed');


    var smoothedBid = tBid.smoother({period: resource.smooth_period}).dsp_itrend({
        alpha: resource.trend_alpha
    }).save('smoothed');


    /*
     Forecasted
     */
    var Askcoeffs = smoothedAsk.ARMaxEntropy({
        data: tAsk.data.slice(tAsk.data.length - resource.forecast_count),
        degree: resource.degree,
        sample: resource.forecast_count
    });

    var Bidcoeffs = smoothedBid.ARMaxEntropy({
        data: tBid.data.slice(tBid.data.length - resource.forecast_count),
        degree: resource.degree,
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


    /*
     BUY AND SELL START
     */
    //var peaks = util.peakPromise();



    var lastAskPrice = parseFloat(lastAskPrices[lastAskPrices.length - 1][1]);

    if (resource.ask === null) {

        var lastForecastAsk = smoothedAsk.data[smoothedAsk.data.length - 1][1];

        console.log('last:'+ lastAskPrice + ' forecast: '+ askForecast +'-' + lastForecastAsk + ' mean:' +tAsk.mean());

        if (lastAskPrice < tAsk.mean()) {
            if (askForecast > lastForecastAsk) {


                if ((parseFloat(resource.bid) - parseFloat(resource.buy_margin)) > (lastAskPrice)) {
                    console.log(resource.owner + ' buy at ' + lastAskPrice);

                    buyNow(lastAskPrices[lastAskPrices.length - 1]);

                }


            }

        }

    }


    if (resource.bid === null) {

        var lastForecastBid = smoothedBid.data[smoothedBid.data.length - 1][1];

        console.log('last:'+ lastBidPrices[lastBidPrices.length - 1][1] + ' forecast: '+ bidForecast +'-' + lastForecastBid + ' mean:' +tBid.mean());

        if (lastBidPrices[lastBidPrices.length - 1][1] > tBid.mean()) {

            if (parseFloat(bidForecast) < lastForecastBid) {


                if ((parseFloat(resource.ask) + parseFloat(resource.sell_margin) ) < parseFloat(lastBidPrices[lastBidPrices.length - 1][1])) {
                    console.log(resource.owner + ' sell at ' + parseFloat(lastBidPrices[lastBidPrices.length - 1][1]));

                    sellNow(lastBidPrices[lastBidPrices.length - 1]);

                }

            }

        }


    }


    /*
     BUY AND SELL END
     */


    if (rowsSalt.length - 1 > resource.mean_count + startPriceIndex) {
        startPriceIndex = ++startPriceIndex;

        means.push({'ask': tAsk.mean(), 'bid': tBid.mean()});
        setTimeout(function () {
            windowDivider(rowsSalt, means);
        },delayWindow);
    } else {


        var chartAskPrices = [], chartBidPrices = [];
        var graphContainer = rowsSalt.slice(resource.mean_count);

        for (i in graphContainer) {
            chartAskPrices.push([new Date(graphContainer[i].timestamp * 1000), parseFloat(graphContainer[i].ask)]);
            chartBidPrices.push([new Date(graphContainer[i].timestamp * 1000), parseFloat(graphContainer[i].bid)]);
        }


        var chartTask = new timeseries.main(chartAskPrices);

        var chartTBid = new timeseries.main(chartBidPrices);


        chartTask.smoother({period: resource.smooth_period}).dsp_itrend({
            alpha: resource.trend_alpha
        }).save('smoothed');


        chartTBid.smoother({period: resource.smooth_period}).dsp_itrend({
            alpha: resource.trend_alpha
        }).save('smoothed');



        create_chart(chartTBid.reset().data, chartTBid.data, chartTask.reset().data, chartTask.data, trades.buy, trades.sell, means);

    }


}


var lookUp = function (lookUpRange) {

    console.log(colors.silly('Start Timestamp: ' + lookUpRange + ' Day Count: ' + dayCount));

    var means = [];
    db.query('SELECT * FROM prices WHERE timestamp > ' + lookUpRange + ' ORDER BY id LIMIT 1', function (err, rowControl) {

        db.query('SELECT * FROM prices WHERE id > ' + (rowControl[0].id - resource.mean_count + 1 ) + ' ORDER BY id ASC', function (err, rowsSalt) {

            console.log(colors.red('Controlled data point amount: ' + rowsSalt.length));
            console.log(colors.red('Start Point at : ' + resource.mean_count));
            windowDivider(rowsSalt, means);
        });

    });


}


var create_chart = function (bid, bidSmooth, ask, askSmooth, fAsk, fBid, means) {

    console.log('Ask Count:' + ask.length);
    console.log('Bid Count:' + bid.length);

    console.log('Buy Count:' + fAsk.length);
    console.log('Sell Count:' + fBid.length);


    console.log('Bid Smooth Count:' + bidSmooth.length);
    console.log('Ask Smooth Count:' + askSmooth.length);

    console.log('Mean Count:' + means.length);

    console.log('NET Profit' + profit);



    var chartNode = new ChartjsNode(6000, 800);

    var defaultOptions = {
        plugins: {},
        title: {
            display: true,
            text: resource.owner + ' Algoritma Tahmin Grafiği'
        },
        backgroundColor: "#ffffff"
    }

    var chartJsOptions = {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Satış Değerleri',
                    data: getYAxisForChart(bid),
                    type: 'line',
                    backgroundColor: "#36a2eb",
                    fill: false
                },
                /*{
                    label: 'Satış Değerleri Smooth',
                    data: getYAxisForChart(bidSmooth),
                    type: 'line',
                    backgroundColor: "#911192",
                    fill: false
                },*/
                {
                    label: 'Alış Değerleri',
                    data: getYAxisForChart(ask),
                    type: 'line',
                    backgroundColor: "#61f661",
                    fill: false
                },
                /*{
                    label: 'Alış Değerleri Smooth',
                    data: getYAxisForChart(askSmooth),
                    type: 'line',
                    backgroundColor: "#a9234c",
                    fill: false
                },
               {
                    label: 'Alış Değerleri Mean',
                    data: getMeanYAxisForChart(means, 'ask'),
                    type: 'line',
                    backgroundColor: "#9ff99f",
                    fill: false
                },
                {
                    label: 'Satış Değerleri Mean',
                    data: getMeanYAxisForChart(means, 'bid'),
                    type: 'line',
                    backgroundColor: "#a2d4f6",
                    fill: false
                },*/
                {
                    label: 'Alış Tahminleri',
                    data: fAsk,
                    type: 'bubble',
                    backgroundColor: "#cc65fe"
                },
                {
                    label: 'Satış Tahminleri',
                    data: fBid,
                    type: 'bubble',
                    backgroundColor: "#ffce56"
                }
            ],
            labels: getXAxisForChart(bid)
        },
        options: defaultOptions
    }

    return chartNode.drawChart(chartJsOptions)
        .then(function () {
            // chart is created

            // get image as png buffer
            return chartNode.getImageBuffer('image/png');
        }).then(function (buffer) {
            Array.isArray(buffer); // => true
            // as a stream
            return chartNode.getImageStream('image/png');
        }).then(function (streamResult) {
            console.log('Test Result Chart Created');
            return chartNode.writeImageToFile('image/png', '../test-results/test-resource-' + resource.id + '-forecast-test-1-.png');
        });
}


var getXAxisForChart = function (data) {
    var container = [];

    for (i in data) {
        var rawDate = new Date(data[i][0]);
        var date = rawDate.getHours() + ':' + rawDate.getMinutes() + ' ' + rawDate.getDate();
        container.push(date);
    }

    return container;
}

var getYAxisForChart = function (data) {
    var container = [];

    for (i in data) {
        container.push(data[i][1]);
    }

    return container;
}

var getMeanYAxisForChart = function (data, key) {
    var container = [];

    for (i in data) {
        container.push(data[i][key]);
    }

    return container;
}


var buyNow = function (ask) {

    var rawDate = new Date(ask[0]);
    var xDate = rawDate.getHours() + ':' + rawDate.getMinutes() + ' ' + rawDate.getDate();

    profit -= ask[1] * resource.amount;

    trades.buy.push({
        r: 12,
        y: ask[1],
        x: xDate
    });

    resource.ask = ask[1];
    resource.bid = null;

}


var sellNow = function (bid) {

    var rawDate = new Date(bid[0]);
    var xDate = rawDate.getHours() + ':' + rawDate.getMinutes() + ' ' + rawDate.getDate();

    profit += bid[1] * resource.amount;

    trades.sell.push({
        r: 12,
        y: bid[1],
        x: xDate
    });

    resource.ask = null;
    resource.bid = bid[1];

}

module.exports = {
    init: function () {
        var d = new Date();
        var time = d.getTime();
        var lookUpRange = time - (dayCount * 24 * 60 * 60 * 1000);
        lookUp(Math.round(lookUpRange / 1000));
    }
}