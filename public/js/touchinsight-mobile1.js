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

var geomap, timechart, passengerchart, flightsbar, passengersbar, flightdistance,
    passengerseats, distancebar, populationbar;

var usStates = {};

var buttons = ["OR", "AND", "NOT", "CLEAN"];

var currentLogic = "CLEAN";

var queryStack = [];

var historyQueryStack = [];

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

    historyQueryStack.push(query);

    // update all other visualizations
    if (propagate) {
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

}

$(document).ready(function () {

    // creating the four buttons
    for (var i = 0; i < buttons.length; i++) {
        d3.select("#button-panel").append("div")
            .attr("id", buttons[i])
            .attr("class", "operator")
            .style("width", (100 / buttons.length) + "%")
            .style("height", "100%")
            .style("color", "white")
            .style("font-size", "2em")
            .style("text-align", "center")
            .style("vertical-align", "middle")
            .style("cursor", "pointer")
            .style("display", "inline-block")
            .text(buttons[i])
            .on("mousedown", function () {

                console.log(this.textContent + " is clicked");

                $(this).toggleClass('active').siblings().removeClass('active');

                currentLogic = this.textContent;

                if (currentLogic == "CLEAN") {

                    queryStack.length = 0;

                }
            });
    }

    $("#" + buttons[3]).toggleClass('active');

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

    var l = getDimensions(1, 1);

    for (var i = 0; i < GRID[0]; i++) {

        for (var j = 0; j < GRID[1]; j++) {

            if (l[i][j] != 0) {

                d3.select("#content").append("div")
                    .attr("id", "div" + i + j)
                    .attr("class", "panel")
                    .style("width", l[i][j]["width"] - PADDING / 2)
                    .style("height", l[i][j]["height"] - PADDING / 2)
                    .style("background-color",
                        "transparent")
                    .style("border", "1px solid #EEE")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden");

            }
        }
    }

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

    //assigning the dimensions to the main view
    layOut[mainVIndex][mainHIndex] = {
        width: (10 - left - right) * width / 10,
        height: (10 - topI - bottom) * height / 10
    };

    //assigning the top or bottom
    if (topI != 0) {

        layOut[mainVIndex - 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: topI * height / 10
        };

        if (leftExists) {
            layOut[mainVIndex - 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / 10
            };
        }

        if (rightExists) {
            layOut[mainVIndex - 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / 10
            };
        }

    }

    if (bottom != 0) {

        layOut[mainVIndex + 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: bottom * height / 10
        };

        if (leftExists) {
            layOut[mainVIndex + 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / 10
            };
        }

        if (rightExists) {
            layOut[mainVIndex + 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / 10
            };
        }
    }


    if (left != 0) {

        layOut[mainVIndex][mainHIndex - 1] = {
            width: left * width / 10,
            height: (10 - topI - bottom) * height / 10
        };

    }

    if (right != 0) {

        layOut[mainVIndex][mainHIndex + 1] = {
            width: right * width / 10,
            height: (10 - topI - bottom) * height / 10
        };
    }

    return layOut;

}