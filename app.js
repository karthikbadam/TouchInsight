var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var csv = require('fast-csv');
var fs = require('fs');
var d3 = require('d3');
var url = require('url');
//var citiesToLoc = require('./maps.js').citiesToLoc;

var routes = require('./routes/index');
var users = require('./routes/users');

// connecting to Mongodb database running instance
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;

var FIRST_TIME_EXECUTED = false;

// connect to the flights database in mongodb
var mongourl = 'mongodb://localhost:27017/flights';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/users', users);

app.get('/', function (req, res, next) {
    res.render('largedisplay.html', {});
});

// as soon as the app for the first time, read the dataset 
// and load it

//start with stock list
var stream = fs.createReadStream("public/data/flights.csv");

var sourceID = "SID";
var destID = "DID";
var source = "Source";
var destination = "Destination";
var passengers = "Passengers";
var seats = "Seats";
var numFlights = "Flights";
var distance = "Distance";
var date = "Date";
var sourcePopulation = "SPopulation";
var destPopulation = "DPopulation";

var parseDate = d3.time.format("%Y-%m-%d").parse;

var locationCache = {};

// lets not do the training for now
function initialize(db, callback) {
    if (FIRST_TIME_EXECUTED) {
        var csvStream = csv
            .fromStream(stream, {
                headers: true
            })
            .on("data", function (d) {

                var temp = {};

                temp["id"] = d[sourceID] + "-" + d[destID];
                temp[sourceID] = d[sourceID];
                temp[destID] = d[destID];
                temp[source] = d[source];
                temp[destination] = d[destination];
                temp[passengers] = +d[passengers];
                temp[seats] = +d[seats];
                temp[numFlights] = +d[numFlights];
                temp[distance] = +d[distance];
                temp[date] = parseDate(d[date]);
                temp[sourcePopulation] = +d[sourcePopulation];
                temp[destPopulation] = +d[destPopulation];

                db.collection('flights')
                    .insertOne(temp,
                        function (err, result) {
                            assert.equal(err, null);
                            console.log("Inserted a document");
                        })
            })
            .on("end", function () {
                console.log("CREATED THE DATABASE");
                callback();
            });
    }
}

MongoClient.connect(mongourl, function (err, db) {
    assert.equal(null, err);
    initialize(db, function () {
        db.close();
    });
});


function queryFlightConnections(db, callback) {

    var data = db.collection("flights").aggregate([
        {
            $group: {
                "_id": {
                    "Source": "$Source",
                    "Destination": "$Destination",
                    "sourceLocation": "$sourceLocation",
                    "destLocation": "$destLocation"
                },
                Flights: {
                    $sum: "$Flights"
                }
            }
        },
        {
            $sort: {
                Flights: -1
            }
        }
                   ]);

    data.toArray(function (err, docs) {
        assert.equal(null, err);
        console.log(docs.length);
        callback(docs);
    });


}

app.get('/getFlightCounts', function (req, res, next) {

    var p = url.parse(req.url, true);
    var params = p.query;

    var query = params.query;

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryFlightConnections(db, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;