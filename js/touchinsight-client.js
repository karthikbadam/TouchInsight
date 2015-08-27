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

var PADDING = 0;

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y%m").parse;

var flights;

$(document).ready(function () {

    flights = TAFFY();
    
    width = $("body").width();
    height = $("body").height();

    createLayout();
    
    d3.csv(dataFile, function (error, data) {
        
        data.forEach(function (d) {
            
            var temp = {}; 
            
            temp[source] = d[source]; 
            temp[destination] = d[destination]; 
            temp[passengers] = +d[passengers];
            temp[seats] = +d[seats]; 
            temp[numFlights] = +d[numFlights]; 
            temp[distance] = +d[distance]; 
            temp[date] = parseDate(d[date]);
            temp[sourcePopulation] = +d[sourcePopulation]; 
            temp[destPopulation] = +d[destPopulation]; 
            
            flights.insert(temp); 
            
        }); 
        
        data = null;
    }); 
    

});

function createLayout() {
    
    GRID[1] = GRID[0];

    var xWeights = getWeights(GRID[0]);
    var yWeights = getWeights(GRID[1]);

    for (var i = 0; i < GRID[0]; i++) {

        for (var j = 0; j < GRID[1]; j++) {

            d3.select("#content").append("div")
                .attr("id", "div"+i+j)
                .attr("class", "panel")
                .style("width", xWeights[j]*width - PADDING / 2)
                .style("height", yWeights[i]*height - PADDING / 2)
                .style("background-color", colorscale(i * GRID[0] + j))
                .style("opacity", 0.1)
                .style("margin", 0);
        }
    }

}

function getWeights(size) {

    var mid = (size + 1) / 2;

    var weights = new Array(size);

    var sum = 0;

    for (var i = 0; i < size; i++) {

        var weight = mid - Math.abs(mid - i - 1);

        sum = sum + weight;

        weights[i] = weight;
    }

    for (var i = 0; i < size; i++) {

        weights[i] = weights[i] / sum;

    }

    return weights;

}