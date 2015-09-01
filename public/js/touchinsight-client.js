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

var dataFile = "data/flights.csv";

var GRID = [3, 3];

var width = 0;

var height = 0;

var PADDING = 10;

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y%m").parse;

//var flights;
//
//var flights2;

var geomap, timechart;

var usStates = {};

$(document).ready(function () {

    //    flights = new PouchDB('flights', {
    //        adapter: 'websql'
    //    });
    //
    //    flights2 = TAFFY();

    width = $("body").width();
    height = $("body").height();



    d3.text('data/locations.json', function (txt) {

        var lines = txt.split("\n");

        for (var i = 0; i < lines.length; i++) {

            var d = JSON.parse(lines[i]);

            var city = d.city;
            var loc = d.ll;

            usStates[city] = {
                lat: parseFloat(loc[0]),
                lon: parseFloat(loc[1])
            }
        }

        createLayout();

        onDataLoaded();

    });

});


function onDataLoaded() {

    //creating the views
    geomap = new Map({
        parentId: "div11",
        cols: [source, destination],
        width: $("#div11").width(),
        height: $("#div11").height(),
    });
    
    timechart = new TimeChart({
        parentId: "div21",
        cols: [source, destination],
        width: $("#div21").width(),
        height: $("#div21").height(),
    });
    
    passengerchart = new PassengerChart({
        parentId: "div01",
        cols: [source, destination],
        width: $("#div01").width(),
        height: $("#div01").height(),
    });
    
    flightsbar = new FlightsBar({
        parentId: "div20",
        cols: [source, destination],
        width: $("#div20").width(),
        height: $("#div20").height(),
    });
    
    passengersbar = new PassengersBar({
        parentId: "div02",
        cols: [source, destination],
        width: $("#div02").width(),
        height: $("#div02").height(),
    });
    
    flightdistance = new FlightDistance({
        parentId: "div10",
        cols: [source, destination],
        width: $("#div10").width(),
        height: $("#div10").height(),
    });
    
     passengerseats = new PassengerSeats({
        parentId: "div12",
        cols: [source, destination],
        width: $("#div12").width(),
        height: $("#div12").height(),
    });
    
    distancebar = new DistanceBar({
        parentId: "div00",
        cols: [source, destination],
        width: $("#div00").width(),
        height: $("#div00").height(),
    });
    
    populationbar = new PopulationBar({
        parentId: "div22",
        cols: [source, destination],
        width: $("#div22").width(),
        height: $("#div22").height(),
    });
}

function createLayout() {

    //GRID[1] = GRID[0];

    var xWeights = getWeights(GRID[1]);
    var yWeights = getWeights(GRID[0]);

    for (var i = 0; i < GRID[0]; i++) {

        for (var j = 0; j < GRID[1]; j++) {

            d3.select("#content").append("div")
                .attr("id", "div" + i + j)
                .attr("class", "panel")
                .style("width", xWeights[j] * width - PADDING / 2)
                .style("height", yWeights[i] * height - PADDING / 2)
                .style("background-color",
                    "transparent")
                .style("border", "1px solid #EEE")
                .style("opacity", 1)
                .style("margin", PADDING/2 - 4)
                .style("overflow", "hidden");
        }
    }

}

function getWeights(size) {

    var mid = (size + 1) / 2;

    var weights = new Array(size);

    var sum = 0;

    for (var i = 0; i < size; i++) {

        var weight = Math.pow(mid - Math.abs(mid - i - 1), 1.5);

        sum = sum + weight;

        weights[i] = weight;
    }

    for (var i = 0; i < size; i++) {

        weights[i] = weights[i] / sum;

    }

    return weights;

}