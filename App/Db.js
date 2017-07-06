/**
 * Created by coskudemirhan on 17/06/2017.
 */
var mysql      = require('mysql');
var config      = require('../config.js');
var connection = mysql.createConnection({
    host     : config.dbhost,
    user     : config.dbuser,
    password : config.dbpass,
    database : config.dbname
});

db = connection;
db.connect();

db.query('CREATE TABLE IF NOT EXISTS targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS buy_targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS prices (id INTEGER PRIMARY KEY, ask float, bid float, timestamp TEXT)');

db.query('CREATE TABLE IF NOT EXISTS market_logs (id INTEGER PRIMARY KEY, type TEXT, value float, amount float, timestamp TEXT)');
db.query('CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY, owner TEXT, ask float, bid float, amount float, buy_margin float, sell_margin float, idle_count INTEGER, forecast_count INTEGER, mean_count INTEGER, smooth_period INTEGER, trend_alpha float,timestamp TEXT)');

//db.query('CREATE TABLE IF NOT EXISTS forecasts_tests (id INTEGER PRIMARY KEY, ask float, bid float, timestamp TEXT)');

module.exports = db;