var tessel = require('tessel');
var rfidlib = require('rfid-pn532');
var express = require('express')
var app = express()

// read as fast as possible
var rfid = rfidlib.use(tessel.port['A'], { read: true, delay: 0 });

// http port
var httpPort = 8080;

// current card 
var cards = new Object()

// last detected card
var lastCardTime = 0;

// triggers deletion from buffer
var timeout = setInterval(increaseAge, 100);

function increaseAge(force, except) {
    if (new Date() - lastCardTime >= 50 || force) {
        for (var key in cards) {
            if (cards.hasOwnProperty(key) && key != except) {
                cards[key] += 1;
                if (cards[key] > 3) {
                    delete cards[key];
                }
            }
        }
    }
}

rfid.on('ready', function(version) {
    console.log('Ready to read RFID card');
    rfid.on('data', function(card) {
        var cardId = card.uid.toString('hex');
        lastCardTime = (+new Date());
        cards[cardId] = 0;
        increaseAge(true, cardId)
    });
});

rfid.on('error', function(err) {
    console.error(err);
});

app.get('/', function(req, res) {
    res.json(Object.keys(cards));
})

app.listen(httpPort, function() {
    console.log('RFID json server on port ',httpPort);
})
