const db = require('../Db'),
    _ = require('underscore'),
    client = require('../Client.js'),
    util = require('../../Utils/TradeUtil.js'),
    timeseries = require("timeseries-analysis");


module.exports = async () => {

    /**
     * Get Resources
     */
    let resources = await db.asyncQ('SELECT * FROM resources WHERE status = 1');


    /**
     * Take last prices
     */
    let BTC_Prices = await db.asyncQ('SELECT * FROM prices WHERE symbol = "BTC/USD" ORDER BY id DESC LIMIT 10000');
    let ETH_Prices = await db.asyncQ('SELECT * FROM prices WHERE symbol = "ETH/USD" ORDER BY id DESC LIMIT 10000');


    /**
     * Take ticker values
     */
    let currentValues = await client.api.multiSymbol('BTC/ETH/USD');

    let current_BTC_USD = _.findWhere(currentValues.data, {pair: 'BTC:USD'});
    let current_ETH_USD = _.findWhere(currentValues.data, {pair: 'ETH:USD'});


    /**
     * Create timeseries
     */

    let tsAskBTC = new timeseries.main(_.map(BTC_Prices.reverse(), (val) => {
        return [new Date(val.timestamp * 1000), parseFloat(val.ask)]
    }));

    let tsBidBTC = new timeseries.main(_.map(BTC_Prices.reverse(), (val) => {
        return [new Date(val.timestamp * 1000), parseFloat(val.bid)]
    }));


    let tsAskETH = new timeseries.main(_.map(ETH_Prices.reverse(), (val) => {
        return [new Date(val.timestamp * 1000), parseFloat(val.ask)]
    }));

    let tsBidETH = new timeseries.main(_.map(ETH_Prices.reverse(), (val) => {
        return [new Date(val.timestamp * 1000), parseFloat(val.bid)]
    }));


    /**
     * Loop or all resources
     */

    for (resource of resources) {

        let [tsAsk, tsBid, current] = resource.symbol === 'ETH/USD' ? [tsAskETH, tsBidETH, current_ETH_USD] : [tsAskBTC, tsBidBTC, current_BTC_USD];


        /**
         * THIS IS BUY
         */
        if (resource.ask === null) {

            //Smoothed timeseries
            let tsAskSmoothed = tsAsk.smoother({period: resource.smooth_period}).dsp_itrend({
                alpha: resource.trend_alpha
            }).save('smoothed');

            //Result of deep promise
            let promiseResultAsk = util.deepPromise(tsAskSmoothed, resource.forecast_count);


            //Margin calculation result
            let marginResultAsk = util.calculateBuyMargin(resource, current.ask);


            /**
             * everything okay LETS BUY SOME COIN!!
             */
            if (promiseResultAsk && marginResultAsk) {
                let calculatedBuyPrice = util.calculateBuyPrice(resource, current.ask);

                let buyResult = await client.api.buy_sell('buy', calculatedBuyPrice, resource.symbol);


                if (buyResult.error !== undefined) {

                    // Ooops something went wrong

                } else {

                    await db.query("UPDATE resources SET ? WHERE ?", [
                        {
                            ask: current.ask,
                            bid: null,
                            timestamp: +new Date(),
                            amount: buyResult.symbol1Amount / 1000000,
                            idle_count: 0

                        },
                        {
                            id: resource.id
                        }
                    ]);

                    await db.query("INSERT INTO market_logs SET ?", {
                        type: 'buy',
                        value: current.ask,
                        amount: buyResult.symbol1Amount / 1000000,
                        order_id: buyResult.id,
                        timestamp: buyResult.time / 1000
                    });
                }
            }

        }



        /**
         * THIS IS SELL
         */
        if (resource.bid === null) {

            //Smoothed timeseries
            let tsBidSmoothed = tsBid.smoother({period: resource.smooth_period}).dsp_itrend({
                alpha: resource.trend_alpha
            }).save('smoothed');

            //Result of deep promise
            let promiseResultBid = util.peakPromise(tsBidSmoothed, resource.forecast_count);


            //Margin calculation result
            let marginResultBid = util.calculateSellMargin(resource, current.bid);


            /**
             * everything okay LETS SELL SOME COIN!!
             */
            if (promiseResultBid && marginResultBid) {

                let sellResult = await client.api.buy_sell('sell', resources.amount, resource.symbol);


                if (sellResult.error !== undefined) {

                    // Ooops something went wrong

                } else {

                    await db.query("UPDATE resources SET ? WHERE ?", [
                        {
                            ask: null,
                            bid: current.bid,
                            timestamp: +new Date(),
                            amount: resource.amount,
                            idle_count: 0

                        },
                        {
                            id: resource.id
                        }
                    ]);

                    await db.query("INSERT INTO market_logs SET ?", {
                        type: 'sell',
                        value: current.bid,
                        amount: resource.amount,
                        order_id: sellResult.id,
                        timestamp: sellResult.time / 1000
                    });
                }
            }

        }

    }
}