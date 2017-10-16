/**
 * Created by coskudemirhan on 17/06/2017.
 */
let cexapi = require("../Api/cexapi.js");
const config = require('../config.js');

cexapi.init(config.username, config.api_key, config.api_secret);

module.exports = {
    api : cexapi
};