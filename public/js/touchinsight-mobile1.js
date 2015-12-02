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

var device = "MOBILE";

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y").parse;

var geomap, timechart, passengerchart, flightsbar, passengersbar, flightdistance,
    passengerseats, distancebar, populationbar;

var usStates = {};

var buttons = ["OR", "AND", "NOT", "CLEAN"];

var currentLogic = "AND";

var queryStack = [];

var historyQueryStack = [];

// represents which visualization is the main one and others are micro visualizations
var mainView = [1, 1];

var svgs = [];

var l;

var touchSync;

function setGlobalQuery(query, propagate) {

    var currQuery = query;

    queryStack.push(query.getQueryString());

    for (var i = queryStack.length - 1; i >= 0; i--) {

        var q = queryStack[i]

        if (q.logic == "CLEAN") {

            queryStack = queryStack.slice(i);

            break;
        }
    }
    
    touchSync.push(currQuery);

    d3.select(".extent").attr("width", 0).attr("x", 0);

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

function clearRecentQuery() {
    if (queryStack.length == 0)
        return;
    
    if (queryStack.length == 1)
        clearAllQueries();

    queryStack.pop();
    historyQueryStack.pop();

    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    // update all other visualizations
    geomap.postUpdate();
    timechart.postUpdate();
    passengerchart.postUpdate();
    flightsbar.postUpdate();
    passengersbar.postUpdate();
    flightdistance.postUpdate();
    passengerseats.postUpdate();
    distancebar.postUpdate();
    populationbar.postUpdate();

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
    
    var options = {};

    options.callback = function (data) {
        
        console.log(data);
        
    }
    
    touchSync = new Sync(options);
    
    //creating clear button

    d3.select("#button-panel").append("div")
        .attr("id", "undoButton")
        .attr("class", "operator")
        .text("UNDO")
        .style("font-size", "18px")
        .on("mousedown", function () {
            clearRecentQuery();
        });

    d3.select("#button-panel").append("div")
        .attr("id", "clearButton")
        .attr("class", "operator")
        .text("CLEAR ALL")
        .style("font-size", "18px")
        .on("mousedown", function () {
            clearAllQueries();
        });

    d3.select("body").style("background-color", "white");

    $("#clearButton").draggable();
    $("#undoButton").draggable();

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
    
    // context switched
    var content = {};
    content.action = "switch";
    content.mainview = mainView;
    touchSync.push(content);
    
    var prevL = l;

    l = getDimensions(mainView[0], mainView[1]);

    for (var i = 0; i < GRID[1]; i++) {

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {

                d3.select("#div" + i + j)
                    .style("width", l[i][j]["width"] - PADDING / 2)
                    .style("height", l[i][j]["height"] - PADDING / 2)
                    .style("border", "1px solid #222")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden")
                    .style("display", "inline-block");


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

    for (var i = 0; i < GRID[1]; i++) {

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {


                d3.select("#label" + i + j)
                    .style("left", $("#div" + i + j).position().left +  
                           $("#div" + i + j).width() - 30)
                    .style("top", $("#div" + i + j).position().top + 2)
                    .style("display", "table");



            } else {


                d3.select("#label" + i + j)
                    .style("display", "none");

            }


        }
    }

    d3.select("#button-panel").style("top", $("#div" + mainView[0] + mainView[1]).position().top + 20);

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

    l = getDimensions(1, 1);

    svgs = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        svgs[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {

                d3.select("#content").append("div")
                    .attr("id", "div" + i + j)
                    .attr("class", "panel")
                    .style("width", l[i][j]["width"] - PADDING / 2)
                    .style("height", l[i][j]["height"] - PADDING / 2)
                    .style("border", "1px solid #222")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden");

                if (GRID[1] * i + j + 1 == 5){
                    
                    d3.select("#content").append("div")
                        .attr("id", "label" + i + j)
                        .attr("class", "label")
                        .style("left", $("#div" + i + j).position().left +  
                               $("#div" + i + j).width() - 30)
                        .style("top", $("#div" + i + j).position().top + 2)
                        .style("display", "table")
                        .style("width", "30px")
                        .append("p")
                        .html((GRID[1] * i + j + 1)+ "&#9733;")
                        .style("display", "table-cell")
                        .style("vertical-align", "middle");
                    
                } else {
                
                    d3.select("#content").append("div")
                        .attr("id", "label" + i + j)
                        .attr("class", "label")
                        .style("left", $("#div" + i + j).position().left +  
                               $("#div" + i + j).width() - 30)
                        .style("top", $("#div" + i + j).position().top + 2)
                        .style("display", "table")
                        .append("p")
                        .text(GRID[1] * i + j + 1)
                        .style("display", "table-cell")
                        .style("vertical-align", "middle");
                    
                }
            }

        }
    }

    d3.select("#button-panel").style("top", $("#div11").position().top + 20);

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

    var PROPORTIONS = 10;

    //assigning the dimensions to the main view
    layOut[mainVIndex][mainHIndex] = {
        width: (PROPORTIONS - left - right) * width / PROPORTIONS,
        height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
    };

    //assigning the top or bottom
    if (topI != 0) {

        layOut[mainVIndex - 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: topI * height / PROPORTIONS
        };

        if (leftExists) {
            layOut[mainVIndex - 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / PROPORTIONS
            };
        }

        if (rightExists) {
            layOut[mainVIndex - 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / PROPORTIONS
            };
        }

    }

    if (bottom != 0) {

        layOut[mainVIndex + 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: bottom * height / PROPORTIONS
        };

        if (leftExists) {
            layOut[mainVIndex + 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / PROPORTIONS
            };
        }

        if (rightExists) {
            layOut[mainVIndex + 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / PROPORTIONS
            };
        }
    }


    if (left != 0) {

        layOut[mainVIndex][mainHIndex - 1] = {
            width: left * width / PROPORTIONS,
            height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
        };

    }

    if (right != 0) {

        layOut[mainVIndex][mainHIndex + 1] = {
            width: right * width / PROPORTIONS,
            height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
        };
    }

    return layOut;

}