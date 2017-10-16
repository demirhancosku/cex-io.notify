/**
 * Created by coskudemirhan on 17/06/2017.
 */
let config = {};

//Your api credentials listed in https://cex.io/trade/profile#/api
config.username = '';
config.api_key = '';
config.api_secret = '';
config.telegram_key = '';

//DBConfig
config.dbhost = '';
config.dbuser = '';
config.dbpass = '';
config.dbname = '';

config.persons = []; // trusted telegram ids
config.chats = []; // trusted chat ids


config.debug = true; // console.log output


module.exports = config;