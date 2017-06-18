/**
 * Created by coskudemirhan on 17/06/2017.
 */


var router = require("./App/Route.js");
var bodyParser = require('body-parser');

var client = require('./App/Client.js');
var target = require('./App/TargetControl.js');

router.init(client);
target.init(client,router.bot,router.messageLimit);

/*
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.use('/api', router);

app.listen(3000);
console.log('listening on *:3000');



/*
Default index.html

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

*/








