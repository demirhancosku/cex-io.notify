/**
 * Created by coskudemirhan on 17/06/2017.
 */


var router = require("./App/Route.js");
var client = require('./App/Client.js');
var forecast = require('./App/ForecastTest.js');

forecast.init(client, router.bot);

//forecastTest.init(router.bot);






