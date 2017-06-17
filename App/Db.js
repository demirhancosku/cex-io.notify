/**
 * Created by coskudemirhan on 17/06/2017.
 */
var dblite = require('dblite'),
    db = dblite('lite.db');

db.query('CREATE TABLE IF NOT EXISTS targets (id INTEGER PRIMARY KEY, chatid INTEGER, agent INTEGER, mention TEXT, value TEXT)');

module.exports = db