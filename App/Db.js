/**
 * Created by coskudemirhan on 17/06/2017.
 */
var dblite = require('dblite'),
    db = dblite('lite.db');

db.query('CREATE TABLE IF NOT EXISTS targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS buy_targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS prices (id INTEGER PRIMARY KEY, ask float, bid float, timestamp TEXT)');

db.query('CREATE TABLE IF NOT EXISTS market_logs (id INTEGER PRIMARY KEY, type TEXT, value float, amount float, timestamp TEXT)');


module.exports = db