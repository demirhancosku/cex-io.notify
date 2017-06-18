/**
 * Created by coskudemirhan on 17/06/2017.
 */
var db = require('./Db.js');


//limit is either 'SELL' or 'BUY' depending on what you want to follow
function register(chatid,agent,mention,value,limit,callback){
    if(limit == 'BUY'){
        db.query("DELETE FROM buy_targets WHERE agent = '@agent'", {agent:agent});
        db.query("INSERT INTO buy_targets VALUES(null,'@chatid','@agent',@mention, '@value')", {chatid:chatid, agent: agent, mention: mention, value:value});
    } else {
        db.query("DELETE FROM targets WHERE agent = '@agent'", {agent:agent});
        db.query("INSERT INTO targets VALUES(null,'@chatid','@agent',@mention, '@value')", {chatid:chatid, agent: agent, mention: mention, value:value});
    }
    callback({agent:agent,value:value});
}

function remove(agent,callback){
    db.query("DELETE FROM targets WHERE agent = '@agent'", {agent:agent});
    db.query("DELETE FROM buy_targets WHERE agent = '@agent'", {agent:agent});
    callback({agent:agent});
}

function init(client,bot,messageLimit){
    setInterval(function () {

        client.api.convert(amount = 1,couple = 'ETH/USD',function(param){
            db.query('SELECT * FROM targets', function(err, rows) {

                if(rows.length > 0){
                    for(i in rows){
                        var target = parseInt(rows[i][4]);

                        if(param.amnt >=target && messageLimit('sell',rows[i][1],+1)){
                            bot.sendMessage(rows[i][1],'Dude 💣 @'+rows[i][3]+' \nYou\'re too close to being rich. 💵💰💵💰💵💰💵 \nETH/USD:'+ param.amnt);
                        }
                    }
                }
            });
            db.query('SELECT * FROM buy_targets', function(err, rows) {

                if(rows.length > 0){
                    for(i in rows){
                        var target = parseInt(rows[i][4]);

                        if(param.amnt <=target && messageLimit('buy',rows[i][1],+1)){
                            bot.sendMessage(rows[i][1],'Dude 💣 @'+rows[i][3]+' \nIt\'s time to buy! Quick!! 💵💰💵💰💵💰💵 \nETH/USD:'+ param.amnt);
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