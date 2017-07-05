/**
 * Created by coskudemirhan on 17/06/2017.
 */
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'ethereum.csoauholwq8f.eu-central-1.rds.amazonaws.com',
    user     : 'eren',
    password : 'NeverEren',
    database : 'ether'
});

db = connection;
db.connect();

db.query('CREATE TABLE IF NOT EXISTS targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS buy_targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS prices (id INTEGER PRIMARY KEY, ask float, bid float, timestamp TEXT)');

db.query('CREATE TABLE IF NOT EXISTS market_logs (id INTEGER PRIMARY KEY, type TEXT, value float, amount float, timestamp TEXT)');

module.exports = db;