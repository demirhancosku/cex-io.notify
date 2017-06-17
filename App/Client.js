/**
 * Created by coskudemirhan on 17/06/2017.
 */
var cexapi = require("../Api/cexapi.js");
var config = require('../config.js');

cexapi.create(config.username, config.api_key, config.api_secret);

module.exports = {
    api : cexapi
};