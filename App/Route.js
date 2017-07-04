/**
 * Created by coskudemirhan on 17/06/2017.
 */
var TelegramBot = require('node-telegram-bot-api');
var config = require('../config');

// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegram_key;

const bot = new TelegramBot(token, {polling: true});

var client = require('./Client.js');
var target = require('./TargetControl.js');
var sendedCounts = {
    'buy' : [],
    'sell' : []
}

function messageLimit(channel,chatid) {
    var found = false;
    for (i in sendedCounts[channel]) {
        if (sendedCounts[channel][i].id == chatid) {
            found = i;
            break;
        }
    }

    if(!found){
        found = sendedCounts[channel].length;
        sendedCounts[channel][sendedCounts[channel].length] = {
            id:chatid,
            count:0
        };
    }


    var will = {
        id:chatid,
        count:sendedCounts[channel][found].count + 1
    };

    sendedCounts[channel][found] = will;

    if(sendedCounts[channel][found].count>9){
        return false;
    }else{
        return true;
    }
}


function messageLimitReset(channel,chatid) {
    for (i in sendedCounts[channel]) {
        if (sendedCounts[channel][i].id == chatid) {
            sendedCounts[channel][i] = {
                id:chatid,
                    count:0
            }
            break;
        }
    }
}
function init() {

    bot.onText(/\/(.+)/, function(msg, match)  {
        if(config.persons.indexOf(msg.from.id) > -1 || config.chats.indexOf(msg.chat.id) > -1){
            //the message is trusted


            const chatId = msg.chat.id;
            const resp = match[1].split(' ');

            switch(resp[0]) {
                case 'account':
                    client.api.balance(function(param){
                        bot.sendMessage(chatId,'Hey! \nYou have ' + param.ETH.available + ' Ethereum and \n'+ param.USD.available  +'$ in your account.  💣\n💵💰💵');
                    });

                    break;
                case 'update':
                    if(resp[1] === undefined || parseInt(resp[1]) < 200){
                        bot.sendMessage(chatId, 'Dude if you want to follow the ethereum rate, you have to give me a real number.');
                    }else{
                        target.register(chatId,msg.from.id,msg.from.username,parseInt(resp[1]),'SELL',function(rows){
                            if(messageLimit('sell',chatId,+1))
                                bot.sendMessage(chatId,'Ok! \nI will send you a message when ethereum rate reach ' + parseInt(resp[1]) + '$');
                        });
                    }

                    break;
                case 'buylimit':
                    if(resp[1] === undefined || parseInt(resp[1]) > 500){
                        bot.sendMessage(chatId, 'Dude if you don\'t give me a real number, how am I supposed to know what value to follow?');
                    }else{
                        target.register(chatId,msg.from.id,msg.from.username,parseInt(resp[1]),'BUY',function(rows){
                                bot.sendMessage(chatId,'Ok! \nI will send you a message when ethereum rate falls below ' + parseInt(resp[1]) + '$');
                        });
                    }

                    break;
                case 'status':

                    client.api.convert(amount = 1,couple = 'ETH/USD',function(param){
                        bot.sendMessage(chatId,'Here is the last value for ETH/USD '+ param.amnt);
                    });

                    break;

                case 'ok':

                    target.remove(msg.from.id,function(param){
                        messageLimitReset('buy',chatId);
                        messageLimitReset('sell',chatId);
                        bot.sendMessage(chatId,'Ok \nI leave you alone.😞');
                        bot.sendMessage(chatId,'🖕');
                    });

                    break;

                case 'pic':

                    bot.sendPhoto(chatId,'https://unsplash.it/600/600/?random');

                    break;

                case 'save':

                   console.log(chatId,msg.from.id);

                   break;

                default:

            }

        }

    });
}

module.exports = {
    init:init,
    messageLimit:messageLimit,
    bot:bot
};