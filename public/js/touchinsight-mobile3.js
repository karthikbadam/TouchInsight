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

var THUMBNAIL_SCALE = 0.3;

var GRID = [3, 3];

var width = 0;

var height = 0;

var PADDING = 0;

var PADDING_Y = 2;

var device = "MOBILE2";

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y").parse;

var geomap, timechart, passengerchart, flightsbar, passengersbar, flightdistance,
    passengerseats, distancebar, populationbar;

var mainviz;

var usStates = {};

var buttons = ["OR", "AND", "NOT", "CLEAN"];

var currentLogic = "AND";

var queryStack = [];

var historyQueryStack = [];

var svgs = [];

var l;

var touchSync;

// represents which visualization is the main one and others are micro visualizations
var mainView = [1, 1];

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

    d3.selectAll(".extent").attr("width", 0).attr("x", 0);

    historyQueryStack.push(query);

    touchSync.push(currQuery);

    // update all other visualizations
    if (propagate) {

        for (var i = 0; i < GRID[1]; i++) {

            for (var j = 0; j < GRID[0]; j++) {

                if (l[i][j] != 0) {

                    svgs[i][j].postUpdate();
                }
            }

        }

        mainviz.postUpdate();
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
    
    // context switched
    var content = {};
    content.action = "CLEAR";
    content.mainview = mainView;
    touchSync.push(content);

    setGlobalQuery(query, 1);
}

function clearRecentQuery() {
    if (queryStack.length == 0)
        return;

    if (queryStack.length == 1)
        clearAllQueries();

    queryStack.pop();
    historyQueryStack.pop();
    
    // context switched
    var content = {};
    content.action = "UNDO";
    content.mainview = mainView;
    touchSync.push(content);

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
    mainviz.postUpdate();

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

    d3.select("#"+mainviz.parentId).remove();

    d3.select("#content").append("div")
        .attr("id", "div" + mainView[0]+ "" + mainView[1])
        .attr("class", "mainpanel")
        .style("width", width * 0.7)
        .style("height", height * 0.7)
        .style("left", 2)
        .style("top", 10)
        .style("background-color",
            "white")
        .style("border", "1px solid #DDD")
        .style("opacity", 1)
        .style("margin", 10)
        .style("overflow", "hidden");

    
    if (mainView[0] == 0 && mainView[1] == 0) {
        
        mainviz = new Bar({
            parentId: "div00",
            cols: [source, destination],
            width: $("#div00").width(),
            height: $("#div00").height(),
            target: distance,
            link: "getDistanceBySource",
            text: "Average Distance",
            post: 0
        });
        

    }
    
    if (mainView[0] == 0 && mainView[1] == 1) {

        mainviz = new TimeChart({
            parentId: "div01",
            cols: [source, destination],
            width: $("#div01").width(),
            height: $("#div01").height(),
            target: passengers,
            link: "getPassengersByTime",
            text: "Passengers",
            post: 0
        });

    }
    
    if (mainView[0] == 0 && mainView[1] == 2) {

        mainviz = new Bar({
            parentId: "div02",
            cols: [source, destination],
            width: $("#div02").width(),
            height: $("#div02").height(),
            target: passengers,
            link: "getPassengersBySource",
            text: "Passengers",
            post: 0
        });


    }
      
    if (mainView[0] == 1 && mainView[1] == 0) {

        mainviz = new Parallel({
            parentId: "div10",
            cols: [source, destination],
            width: $("#div10").width(),
            height: $("#div10").height(),
            link: "getFlightDistances",
            target: passengers,
            post: 0
        });


    }
    
    if (mainView[0] == 1 && mainView[1] == 1) {

        mainviz = new Map({
            parentId: "div11",
            cols: [source, destination],
            width: $("#div11").width(),
            height: $("#div11").height(),
            post: 0
        });

    }
    
    if (mainView[0] == 1 && mainView[1] == 2) {

        mainviz = new Parallel({
            parentId: "div12",
            cols: [source, destination],
            width: $("#div12").width(),
            height: $("#div12").height(),
            link: "getPassengerSeats",
            target: numFlights,
            post: 0
        });

    }
    
    if (mainView[0] == 2 && mainView[1] == 0) {

        mainviz = new Bar({
            parentId: "div20",
            cols: [source, destination],
            width: $("#div20").width(),
            height: $("#div20").height(),
            target: numFlights,
            link: "getFlightsBySource",
            text: "Flights",
            post: 0
        });

    }
    
    if (mainView[0] == 2 && mainView[1] == 1) {

         mainviz = new TimeChart({
            parentId: "div21",
            cols: [source, destination],
            width: $("#div21").width(),
            height: $("#div21").height(),
            target: numFlights,
            link: "getFlightsByTime",
            text: "Flights",
            post: 0
        });

    }
    
    if (mainView[0] == 2 && mainView[1] == 2) {

        mainviz = new Bar({
            parentId: "div22",
            cols: [source, destination],
            width: $("#div22").width(),
            height: $("#22").height(),
            target: sourcePopulation,
            link: "getPopulationBySource",
            text: "Population",
            post: 0
        });

    }

}


function onDataLoaded() {

    //creating the views

    geomap = new Map({
        parentId: "thumbdiv11",
        cols: [source, destination],
        width: $("#thumbdiv11").width(),
        height: $("#thumbdiv11").height(),
    });

    svgs[1][1] = geomap;

    timechart = new TimeChart({
        parentId: "thumbdiv21",
        cols: [source, destination],
        width: $("#thumbdiv21").width(),
        height: $("#thumbdiv21").height(),
        target: numFlights,
        link: "getFlightsByTime",
        text: "Flights"
    });

    svgs[2][1] = timechart;

    passengerchart = new TimeChart({
        parentId: "thumbdiv01",
        cols: [source, destination],
        width: $("#thumbdiv01").width(),
        height: $("#thumbdiv01").height(),
        target: passengers,
        link: "getPassengersByTime",
        text: "Passengers"
    });

    svgs[0][1] = passengerchart;

    flightdistance = new Parallel({
        parentId: "thumbdiv10",
        cols: [source, destination],
        width: $("#thumbdiv10").width(),
        height: $("#thumbdiv10").height(),
        link: "getFlightDistances",
        target: passengers
    });

    svgs[1][0] = flightdistance;

    passengerseats = new Parallel({
        parentId: "thumbdiv12",
        cols: [source, destination],
        width: $("#thumbdiv12").width(),
        height: $("#thumbdiv12").height(),
        link: "getPassengerSeats",
        target: numFlights
    });

    svgs[1][2] = passengerseats;

    distancebar = new Bar({
        parentId: "thumbdiv00",
        cols: [source, destination],
        width: $("#thumbdiv00").width(),
        height: $("#thumbdiv00").height(),
        target: distance,
        link: "getDistanceBySource",
        text: "Average Distance"
    });

    svgs[0][0] = distancebar;

    populationbar = new Bar({
        parentId: "thumbdiv22",
        cols: [source, destination],
        width: $("#thumbdiv22").width(),
        height: $("#thumbdiv22").height(),
        target: sourcePopulation,
        link: "getPopulationBySource",
        text: "Population"
    });

    svgs[2][2] = populationbar;

    flightsbar = new Bar({
        parentId: "thumbdiv20",
        cols: [source, destination],
        width: $("#thumbdiv20").width(),
        height: $("#thumbdiv20").height(),
        target: numFlights,
        link: "getFlightsBySource",
        text: "Flights"
    });

    svgs[2][0] = flightsbar;

    passengersbar = new Bar({
        parentId: "thumbdiv02",
        cols: [source, destination],
        width: $("#thumbdiv02").width(),
        height: $("#thumbdiv02").height(),
        target: passengers,
        link: "getPassengersBySource",
        text: "Passengers"
    });

    svgs[0][2] = passengersbar;

    mainviz = new Map({
        parentId: "div11",
        cols: [source, destination],
        width: $("#div11").width(),
        height: $("#div11").height(),
        post: 0
    });
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

                    d3.select("#content").append("div")
                        .attr("id", "div" + i + j)
                        .attr("class", classname)
                        .style("width", width * 0.7)
                        .style("height", height * 0.7)
                        .style("left", 2)
                        .style("top", 10)
                        .style("background-color",
                            "white")
                        .style("border", "1px solid #DDD")
                        .style("opacity", 1)
                        .style("margin", 10)
                        .style("overflow", "hidden");

                }

                d3.select("#overview").append("div")
                    .attr("id", "thumbdiv" + i + j)
                    .attr("class", "secondarypanel")
                    .style("width", l[i][j].width)
                    .style("height", l[i][j].height)
                    .style("display", "inline-block")
                    .style("background-color",
                        "white")
                    .style("border", "1px solid #BBB")
                    .style("opacity", 1)
                    .style("margin", "1px")
                    .style("overflow", "hidden");

            }
        }
    }

    d3.select("#button-panel").style("top", $("#div11").position().top - 10);

}

function getDimensions(mainVIndex, mainHIndex) {


    var layOut = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        layOut[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {
            layOut[i][j] = 0;
        }
    }

    var PROPORTIONSX = 9;
    var PROPORTIONSY = 9;

    var secondaryWidth = width / PROPORTIONSX;
    var secondaryHeight = height / PROPORTIONSY;

    size = GRID[1];

    var mid = (size + 1) / 2;

    var weights = new Array(size);

    var sum = 0;

    for (var i = 0; i < size; i++) {

        var weight = Math.pow(mid - Math.abs(mid - i - 1), 1.2);

        sum = sum + weight;

        weights[i] = weight;
    }

    for (var i = 0; i < GRID[1]; i++) {

        for (var j = 0; j < GRID[0]; j++) {


            layOut[i][j] = {
                width: 3 * width * weights[j] / (sum * 10),
                height: 4 * height * weights[i] / (sum * 10)
            }

        }

    }

    return layOut;

}