var tessel = require('tessel');
var rfidlib = require('rfid-pn532');
var express = require('express')
var app = express()

// specifying content type as JSON-LD
app.use(function (req, res, next) {
  res.header("Content-Type",'application/ld+json');
  next();
});

// http port
var httpPort = 80;

// read as fast as possible
var rfidA = rfidlib.use(tessel.port['A'], { read: true, delay: 0 });
var rfidA = rfidlib.use(tessel.port['B'], { read: true, delay: 0 });

// current card 
var cardsA = new Object()
var cardsB = new Object()

// last detected card
var lastCardTimeA = 0;
var lastCardTimeB = 0;

// triggers deletion from buffer
var timeoutA = setInterval(increaseAgeA, 100);
var timeoutB = setInterval(increaseAgeB, 100);

function increaseAgeA(force, except) {
    if (new Date() - lastCardTimeA >= 50 || force) {
        for (var key in cardsA) {
            if (cardsB.hasOwnProperty(key) && key != except) {
                cardsA[key] += 1;
                if (cardsA[key] > 3) {
                    delete cardsA[key];
                }
            }
        }
    }
}
function increaseAgeB(force, except) {
    if (new Date() - lastCardTimeB >= 50 || force) {
        for (var key in cardsB) {
            if (cardsB.hasOwnProperty(key) && key != except) {
                cardsB[key] += 1;
                if (cardsB[key] > 3) {
                    delete cardsB[key];
                }
            }
        }
    }
}



rfidA.on('ready', function(version) {
    console.log('Ready to read RFID card on port A');
    rfidA.on('data', function(card) {
        var cardId = card.uid.toString('hex');
        lastCardTimeA = (+new Date());
        cardsA[cardId] = 0;
        increaseAgeA(true, cardId)
    });
});
rfidB.on('ready', function(version) {
    console.log('Ready to read RFID card on port B');
    rfidB.on('data', function(card) {
        var cardId = card.uid.toString('hex');
        lastCardTimeB = (+new Date());
        cardsB[cardId] = 0;
        increaseAgeB(true, cardId)
    });
});

rfidA.on('error', function(err) {
    console.error(err);
});
rfidB.on('error', function(err) {
    console.error(err);
});

app.get('/', function(req, res) {
    res.json({
      "@context" : {
        "http://www.w3.org/ns/sosa/hosts" : {
//        "@type" : "http://www.w3.org/2001/XMLSchema#hexBinary"
          "@type" : "@id"
         },
      },
      "@id": "#it" ,
      "@type" : "http://www.w3.org/ns/sosa/Platform" ,
      "http://www.w3.org/ns/sosa/hosts" : [ "A#sensor" , "B#sensor" ]
      }
    );
})

app.get('/A', function(req, res) {
    res.json({
      "@context" : {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : {
//        "@type" : "http://www.w3.org/2001/XMLSchema#hexBinary"
          "@type" : "http://www.w3.org/2001/XMLSchema#boolean"
         },
      },
      "@id": "#sensor" ,
      "@type" : "http://www.w3.org/ns/sosa/Sensor" ,
//    "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : Object.keys(cardsA)
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : Object.keys(cardsA).length > 0
      }
    );
})
app.get('/B', function(req, res) {
    res.json({
      "@context" : {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : {
//        "@type" : "http://www.w3.org/2001/XMLSchema#hexBinary"
          "@type" : "http://www.w3.org/2001/XMLSchema#boolean"
         },
      },
      "@id": "#sensor" ,
      "@type" : "http://www.w3.org/ns/sosa/Sensor" ,
//    "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : Object.keys(cardsB)
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" : Object.keys(cardsB).length > 0
      }
    );
})

app.listen(httpPort, function() {
    console.log('RFID json server on port ',httpPort);
})
