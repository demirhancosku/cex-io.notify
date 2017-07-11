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
    'sell_margin': 0.1,
    'buy_margin': 0.1,
    'forecast_count': 25,
    'mean_count': 500,
    'smooth_period': 300,
    'trend_alpha': 0.5,
    'degree': 10
};

var dayCount = 1.5;
var startDate = 1499522400000;

var profit = 0;
if(resource.bid === null){
    profit = -resource.ask * resource.amount;
}else{
    profit = +resource.bid * resource.amount
}

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

        //console.log('last:'+ lastAskPrice + ' forecast: '+ askForecast +'-' + lastForecastAsk + ' mean:' +tAsk.mean());

            if (util.deepPromise(smoothedAsk,17)) {

                if ((parseFloat(resource.bid) - parseFloat(resource.buy_margin) ) > parseFloat(lastBidPrices[lastBidPrices.length - 1][1])) {

                    console.log(resource.owner + ' buy at ' + lastAskPrice);

                    buyNow(lastAskPrices[lastAskPrices.length - 1]);

                }


            }


    }


    if (resource.bid === null) {

        var lastForecastBid = smoothedBid.data[smoothedBid.data.length - 1][1];

        //console.log('last:'+ lastBidPrices[lastBidPrices.length - 1][1] + ' forecast: '+ bidForecast +'-' + lastForecastBid + ' mean:' +tBid.mean());


            if (util.peakPromise(smoothedAsk,17)) {


                if ((parseFloat(resource.ask) + parseFloat(resource.sell_margin) ) < parseFloat(lastBidPrices[lastBidPrices.length - 1][1])) {
                    console.log(resource.owner + ' sell at ' + parseFloat(lastBidPrices[lastBidPrices.length - 1][1]));

                    sellNow(lastBidPrices[lastBidPrices.length - 1]);

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



        create_chart(chartTBid.data,chartTBid.reset().data, chartTask.data,chartTask.reset().data,trades.buy, trades.sell, means,lastBidPrices[lastBidPrices.length - 1][1]);

    }


}


var lookUp = function (start,lookUpRange) {

    console.log(colors.silly('Timestamp Between ' + lookUpRange + ' - '+start+ ' Day Count: ' + dayCount));

    var means = [];
    db.query('SELECT * FROM prices WHERE timestamp > ' + lookUpRange + ' ORDER BY id LIMIT 1', function (err, rowControl) {

        db.query('SELECT * FROM prices WHERE id > ' + (rowControl[0].id - resource.mean_count) + ' AND timestamp < '+start+' ORDER BY id ASC', function (err, rowsSalt) {

            console.log(colors.red('Controlled data point amount: ' + rowsSalt.length + ' Actual Size:' + (rowsSalt.length - resource.mean_count)));
            console.log(colors.red('Start Point at : ' + resource.mean_count));
            windowDivider(rowsSalt, means);
        });
    });


}


var create_chart = function (bidSmooth,bid, askSmooth,ask, fAsk, fBid, means,lastbid) {

    console.log('Ask Count:' + ask.length);
    console.log('Bid Count:' + bid.length);

    console.log('Buy Count:' + fAsk.length);
    console.log('Sell Count:' + fBid.length);


    console.log('Bid Smooth Count:' + bidSmooth.length);
    console.log('Ask Smooth Count:' + askSmooth.length);

    console.log('Mean Count:' + means.length);


    if(resource.ask !== null){
        profit += lastbid * resource.amount;
    }

    console.log('NET Profit' + profit);



    var chartNode = new ChartjsNode(5000*dayCount, 800);

    var defaultOptions = {
        plugins: {},
        title: {
            display: true,
            text: resource.owner + ' Algoritma Tahmin Grafiği'+
            ' Profit: ' + profit +
            ' Mean Count: ' + resource.mean_count +
            ' Trend Alpha: ' + resource.trend_alpha +
            ' Degree: '+ resource.degree +
            ' Smooth: '+ resource.smooth_period +
            ' Forecast Count: '+ resource.forecast_count +
            ' Sell Margin: '+ resource.sell_margin +
            ' Buy Margin: '+ resource.buy_margin
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
                    backgroundColor: "#00eb19",
                    fill: false
                },
                {
                    label: 'Satış Değerleri Smooth',
                    data: getYAxisForChart(bidSmooth),
                    type: 'line',
                    backgroundColor: "#00800f",
                    fill: false
                },
                {
                    label: 'Alış Değerleri',
                    data: getYAxisForChart(ask),
                    type: 'line',
                    backgroundColor: "#f60f00",
                    fill: false
                },
                {
                    label: 'Alış Değerleri Smooth',
                    data: getYAxisForChart(askSmooth),
                    type: 'line',
                    backgroundColor: "#830700",
                    fill: false
                },
                {
                    label: 'Alış Tahminleri',
                    data: fAsk,
                    type: 'bubble',
                    backgroundColor: "#ff0003"
                },
                {
                    label: 'Satış Tahminleri',
                    data: fBid,
                    type: 'bubble',
                    backgroundColor: "#22ff00"
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
            return chartNode.writeImageToFile('image/png', '../test-results/test-'+Math.floor(Math.random() * 10) + 1+'.png');

        });
}


var getXAxisForChart = function (data) {
    var container = [];

    for (i in data) {
        var rawDate = new Date(data[i][0]);
        var date = rawDate.getHours() + ':' + rawDate.getMinutes() + ':' + rawDate.getSeconds()+  ' ' + rawDate.getDate();
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
    var xDate = rawDate.getHours() + ':' + rawDate.getMinutes() + ':' + rawDate.getSeconds()+  ' ' + rawDate.getDate();

    profit -= ask[1] * resource.amount;

    trades.buy.push({
        r: 15,
        y: ask[1],
        x: xDate
    });

    resource.ask = ask[1];
    resource.bid = null;

}


var sellNow = function (bid) {

    var rawDate = new Date(bid[0]);
    var xDate = rawDate.getHours() + ':' + rawDate.getMinutes()  + ':' + rawDate.getSeconds()+ ' ' + rawDate.getDate();

    profit += bid[1] * resource.amount;

    trades.sell.push({
        r: 15,
        y: bid[1],
        x: xDate
    });

    resource.ask = null;
    resource.bid = bid[1];

}

module.exports = {
    init: function () {
        if(startDate === null){
            var d = new Date();
        }else{
            var d = new Date(startDate);
        }

        var time = d.getTime();
        var lookUpRange = time - (dayCount * 24 * 60 * 60 * 1000);
        lookUp(Math.round(time/1000), Math.round(lookUpRange/1000));
    }
}