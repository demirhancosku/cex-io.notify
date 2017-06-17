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


function init() {

    bot.onText(/\/(.+)/, function(msg, match)  {
        console.log(msg);
        if(config.persons.indexOf(msg.from.id) > -1 || config.chats.indexOf(msg.chat.id) > -1){
            //the message is trusted


            const chatId = msg.chat.id;
            const resp = match[1].split(' ');

            switch(resp[0]) {
                case 'account':

                    bot.sendMessage(chatId, 'de');
                    client.api.balance(function(param){
                        bot.sendMessage(chatId,'Hey! \nYou have ' + param.ETH.available + ' Ethereum and \n'+ param.USD.available  +'$ in your account.  💣\n💵💰💵');
                    });

                    break;
                case 'update':
                    if(resp[1] === undefined || parseInt(resp[1]) < 200){
                        bot.sendMessage(chatId, 'Dude if you want to follow the ethereum rate, you have to give me a real number.');
                    }else{
                        target.register(chatId,msg.from.id,msg.from.username,parseInt(resp[1]),function(rows){
                            bot.sendMessage(chatId,'Ok! \nI will send you a message when ethereum rate reach ' + parseInt(resp[1]) + '$');
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
                        bot.sendMessage(chatId,'Ok \nI leave you alone.😞');
                        bot.sendMessage(chatId,'🖕');
                    });

                    break;

                case 'pic':

                    bot.sendPhoto(chatId,'https://unsplash.it/600/600/?random');

                    break;
                default:


            }

        }

    });
}

module.exports = {
    init:init,
    bot:bot
};