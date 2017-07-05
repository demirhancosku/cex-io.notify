/**
 * Created by coskudemirhan on 17/06/2017.
 */
var db = require('./Db.js');


//limit is either 'SELL' or 'BUY' depending on what you want to follow
function register(chatid,agent,mention,value,limit,callback){
    if(limit == 'BUY'){
        db.query("DELETE FROM buy_targets WHERE agent = '"+agent+"'");
        db.query("INSERT INTO buy_targets SET ?", {chatid:chatid, agent: agent, mention: mention, value:value});
    } else {
        db.query("DELETE FROM targets WHERE agent = '"+agent+"'");
        db.query("INSERT INTO targets SET ?", {chatid:chatid, agent: agent, mention: mention, value:value});
    }
    callback({agent:agent,value:value});
}

function remove(agent,callback){
    db.query("DELETE FROM targets WHERE agent = '"+agent+"'");
    db.query("DELETE FROM buy_targets WHERE agent = '"+agent+"'");
    callback({agent:agent});
}

function init(client,bot,messageLimit){
    setInterval(function () {
        db.query('SELECT * FROM prices ORDER BY id DESC LIMIT 1', function (err, params) {
            db.query('SELECT * FROM targets', function(err, rows) {

                if(rows.length > 0){
                    for(i in rows){
                        var target = parseInt(rows[i].value);

                        if(params[1].bid >=target && messageLimit('sell',rows[i].chatid,+1)){
                            bot.sendMessage(rows[i].chatid,'Dude 💣 @'+rows[i].mention+' \nYou\'re too close to being rich. 💵💰💵💰💵💰💵 \nETH/USD:'+ params[1].bid);
                        }
                    }
                }
            });
            db.query('SELECT * FROM buy_targets', function(err, rows) {

                if(rows.length > 0){
                    for(i in rows){
                        var target = parseInt(rows[i].value);

                        if(params[1].ask <=target && messageLimit('buy',rows[i].chatid,+1)){
                            bot.sendMessage(rows[i].chatid,'Dude 💣 @'+rows[i].mention+' \nIt\'s time to buy! Quick!! 💵💰💵💰💵💰💵 \nETH/USD:'+ params[1].ask);
                        }
                    }
                }
            });
            
        });


    },5000)
}

module.exports = {
    init : init,
    register:register,
    remove:remove
}