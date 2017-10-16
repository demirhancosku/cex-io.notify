"use strict";

const config = require('./config'),
    routes = require('./App/Routes'),
    schedule = require('node-schedule'),
    trader = require('./App/Trader/Trader'),
    restify = require('restify');


/**
 * Server
 */
global.server = restify.createServer({
    name: config.port
});


/**
 * Middleware
 */
global.server.use(restify.plugins.acceptParser(global.server.acceptable));
global.server.use(restify.plugins.queryParser());
global.server.use(restify.plugins.bodyParser());


/**
 * Routes
 */
routes();

global.server.listen(config.port, () => {
    console.log("server is up");
});


/**
 *  Trade Check
 */
//Every 10 second check
schedule.scheduleJob('*/10 * * * * *', trader);