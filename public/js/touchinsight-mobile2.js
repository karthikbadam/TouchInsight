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

var THUMBNAIL_SCALE = 0.6;

var GRID = [3, 3];

var width = 0;

var height = 0;

var PADDING = 10;

var PADDING_Y = 10;

var device = "MOBILE2";

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y").parse;

var geomap, timechart, passengerchart, flightsbar, passengersbar, flightdistance,
    passengerseats, distancebar, populationbar;

var usStates = {};

var buttons = ["OR", "AND", "NOT", "CLEAN"];

var currentLogic = "AND";

var queryStack = [];

var historyQueryStack = [];

var svgs = [];

var l;

// represents which visualization is the main one and others are micro visualizations
var mainView = [1, 1];

function setGlobalQuery(query, propagate) {

    var currQuery = query;

    queryStack.push(query.getQueryString());

    for (var i = queryStack.length - 1; i >= 0; i--) {

        var query = queryStack[i]

        if (query.logic == "CLEAN") {

            queryStack = queryStack.slice(i);
            break;
        }
    }
    
    d3.select(".extent").remove();

    historyQueryStack.push(query);

    // update all other visualizations
    if (propagate) {
        
        for (var i = 0; i < GRID[1]; i++) {

            for (var j = 0; j < GRID[0]; j++) {

                if (l[i][j] != 0) {
                    
                    svgs[i][j].postUpdate();
                }
            }

        }
    }

}

function clearAllQueries() {
    if (queryStack.length == 0)
        return;

    queryStack.length = 0;


    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query, 1);
}

$(document).ready(function () {

    d3.select("body").style("background-color", "white");
    
    //creating clear button
    d3.select("#button-panel").append("div")
        .attr("id", "clearButton")
        .attr("class", "operator")
        .text("CLEAR QUERIES")
        .on("mousedown", function () {
            clearAllQueries();
        });

    $("#clearButton").draggable();

    width = $("#content").width();
    height = $("#content").height();

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


function reDrawInterface() {
    
    var prevL = l;

    l = getDimensions(mainView[0], mainView[1]);

    for (var i = 0; i < GRID[1]; i++) {

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {
                
                var classname = "secondarypanel";

                if (mainView[0] == i && mainView[1] == j) {
                    classname = "mainpanel";
                }

                d3.select("#div" + i + j)
                    .attr("class", classname)
                    .style("width", l[i][j]["width"])
                    .style("height", l[i][j]["height"]);
                
                d3.select("#div" + i + j)
                    .transition().delay(500)
                    .style("left", l[i][j]["left"])
                    .style("top", PADDING_Y + l[i][j]["top"])
                    .style("background-color",
                        "white")
                    .style("border", "1px solid #DDD")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden")
                    .style("display", "block");
                
                if (i == mainView[0] && j == mainView[1]) {

                    svgs[i][j].reDrawChart(1, $("#div" + i + j).width(), 
                                           $("#div" + i + j).height());

                } else {
                   if (prevL[i][j] == 0)
                        svgs[i][j].postUpdate();
                    svgs[i][j].reDrawChart(0, $("#div" + i + j).width(), 
                                           $("#div" + i + j).height());

                }

            } else {

                d3.select("#div" + i + j)
                    .style("display", "none");

            }
        }
    }


}


function onDataLoaded() {

    //creating the views
    geomap = new Map({
        parentId: "div11",
        cols: [source, destination],
        width: $("#div11").width(),
        height: $("#div11").height(),
    });

    svgs[1][1] = geomap;

    timechart = new TimeChart({
        parentId: "div21",
        cols: [source, destination],
        width: $("#div21").width(),
        height: $("#div21").height(),
        target: numFlights,
        link: "getFlightsByTime",
        text: "Flights"
    });

    svgs[2][1] = timechart;

    passengerchart = new TimeChart({
        parentId: "div01",
        cols: [source, destination],
        width: $("#div01").width(),
        height: $("#div01").height(),
        target: passengers,
        link: "getPassengersByTime",
        text: "Passengers"
    });

    svgs[0][1] = passengerchart;

    flightdistance = new Parallel({
        parentId: "div10",
        cols: [source, destination],
        width: $("#div10").width(),
        height: $("#div10").height(),
        link: "getFlightDistances",
        target: passengers
    });

    svgs[1][0] = flightdistance;

    passengerseats = new Parallel({
        parentId: "div12",
        cols: [source, destination],
        width: $("#div12").width(),
        height: $("#div12").height(),
        link: "getPassengerSeats",
        target: numFlights
    });

    svgs[1][2] = passengerseats;

    distancebar = new Bar({
        parentId: "div00",
        cols: [source, destination],
        width: $("#div00").width(),
        height: $("#div00").height(),
        target: distance,
        link: "getDistanceBySource",
        text: "Average Distance"
    });

    svgs[0][0] = distancebar;

    populationbar = new Bar({
        parentId: "div22",
        cols: [source, destination],
        width: $("#div22").width(),
        height: $("#div22").height(),
        target: sourcePopulation,
        link: "getPopulationBySource",
        text: "Population"
    });

    svgs[2][2] = populationbar;

    flightsbar = new Bar({
        parentId: "div20",
        cols: [source, destination],
        width: $("#div20").width(),
        height: $("#div20").height(),
        target: numFlights,
        link: "getFlightsBySource",
        text: "Flights"
    });

    svgs[2][0] = flightsbar;

    passengersbar = new Bar({
        parentId: "div02",
        cols: [source, destination],
        width: $("#div02").width(),
        height: $("#div02").height(),
        target: passengers,
        link: "getPassengersBySource",
        text: "Passengers"
    });

    svgs[0][2] = passengersbar;

}


function createLayout() {

    //GRID[1] = GRID[0];

    l = getDimensions(mainView[0], mainView[1]);
    
    svgs = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        svgs[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {

                var classname = "secondarypanel";

                if (mainView[0] == i && mainView[1] == j) {
                    classname = "mainpanel";
                }

                d3.select("#content").append("div")
                    .attr("id", "div" + i + j)
                    .attr("class", classname)
                    .style("width", l[i][j]["width"])
                    .style("height", l[i][j]["height"])
                    .style("left", l[i][j]["left"])
                    .style("top", PADDING_Y + l[i][j]["top"])
                    .style("background-color",
                        "white")
                    .style("border", "1px solid #DDD")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden");

            }
        }
    }
    
    d3.select("#button-panel").style("top", $("#div11").position().top + 10);

}

function getDimensions(mainVIndex, mainHIndex) {


    var layOut = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        layOut[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {
            layOut[i][j] = 0;
        }
    }

    //calculating number on top, number on bottom, left, and right
    bottom = GRID[1] - 1 - mainVIndex;
    bottomExists = bottom > 0 ? 1 : 0;

    topI = mainVIndex;
    topExists = topI > 0 ? 1 : 0;

    left = mainHIndex;
    leftExists = left > 0 ? 1 : 0;

    right = GRID[0] - 1 - mainHIndex;
    rightExists = right > 0 ? 1 : 0;

    var PROPORTIONSX = 7;
    var PROPORTIONSY = 5;

    var secondaryWidth = width / PROPORTIONSX;
    var secondaryHeight = height / PROPORTIONSY;


    //assigning the dimensions to the main view
    layOut[mainVIndex][mainHIndex] = {
        width: width - 10 * PADDING,
        height: height - 10 * PADDING - PADDING_Y / 2,
        left: 5 * PADDING,
        top: 5 * PADDING
    };

    //assigning the top or bottom
    if (topI != 0) {

        layOut[mainVIndex - 1][mainHIndex] = {
            width: secondaryWidth,
            height: secondaryHeight,
            left: width / 2 - secondaryWidth / 2,
            top: 0
        };

        if (leftExists) {
            layOut[mainVIndex - 1][mainHIndex - 1] = {
                width: secondaryWidth,
                height: secondaryHeight,
                left: PADDING / 2,
                top: 0
            };
        }

        if (rightExists) {
            layOut[mainVIndex - 1][mainHIndex + 1] = {
                width: secondaryWidth,
                height: secondaryHeight,
                left: width - secondaryWidth - PADDING / 2,
                top: 0
            };
        }

    }

    if (bottom != 0) {

        layOut[mainVIndex + 1][mainHIndex] = {
            width: secondaryWidth,
            height: secondaryHeight,
            left: width / 2 - secondaryWidth / 2,
            top: height - secondaryHeight - PADDING / 2
        };

        if (leftExists) {
            layOut[mainVIndex + 1][mainHIndex - 1] = {
                width: secondaryWidth,
                height: secondaryHeight,
                left: PADDING / 2,
                top: height - secondaryHeight - PADDING / 2
            };
        }

        if (rightExists) {
            layOut[mainVIndex + 1][mainHIndex + 1] = {
                width: secondaryWidth,
                height: secondaryHeight,
                left: width - secondaryWidth - PADDING / 2,
                top: height - secondaryHeight - PADDING / 2
            };
        }
    }


    if (left != 0) {

        layOut[mainVIndex][mainHIndex - 1] = {
            width: secondaryWidth,
            height: secondaryHeight,
            left: PADDING / 2,
            top: height / 2 - secondaryHeight / 2
        };

    }

    if (right != 0) {

        layOut[mainVIndex][mainHIndex + 1] = {
            width: secondaryWidth,
            height: secondaryHeight,
            left: width - secondaryWidth - PADDING / 2,
            top: height / 2 - secondaryHeight / 2
        };
    }

    return layOut;

}