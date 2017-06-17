/**
 * Created by coskudemirhan on 17/06/2017.
 */
var db = require('./Db.js');



function register(chatid,agent,mention,value,callback){
    db.query("DELETE FROM targets WHERE agent = '@agent'", {agent:agent});

    db.query("INSERT INTO targets VALUES(null,'@chatid','@agent',@mention, '@value')", {chatid:chatid, agent: agent, mention: mention, value:value});
    callback({agent:agent,value:value});
}

function remove(agent,callback){
    db.query("DELETE FROM targets WHERE agent = '@agent'", {agent:agent});
    callback({agent:agent});
}

function init(client,bot){
    setInterval(function () {

        client.api.convert(amount = 1,couple = 'ETH/USD',function(param){
            db.query('SELECT * FROM targets', function(err, rows) {

                if(rows.length > 0){
                   for(i in rows){
                       var target = parseInt(rows[i][4]);

                       if(param.amnt >=target){
                           bot.sendMessage(rows[i][1],'Dude 💣 @'+rows[i][3]+' \nYou\'re too close to being rich. 💵💰💵💰💵💰💵 \nETH/USD:'+ param.amnt);
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