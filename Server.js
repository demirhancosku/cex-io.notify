/**
 * Created by coskudemirhan on 17/06/2017.
 */


var router = require("./App/Route.js");

var client = require('./App/Client.js');
var target = require('./App/TargetControl.js');
var trader = require('./App/Trader.js');

router.init(client);
target.init(client, router.bot, router.messageLimit);
trader.init(client, router.bot);







