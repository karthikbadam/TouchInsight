function PassengerChart(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 20,
        right: 10,
        bottom: 30,
        left: 50
    };

    var parseDate = d3.time.format("%Y%m").parse;

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.svg = d3.select("#" + _self.parentId)
        .append("svg")
        .attr("id", "passengerchart")
        .attr("width", _self.width + _self.margin.left + _self.margin.right)
        .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (_self.margin.left) + "," + _self.margin.top + ")");

    $.ajax({

        type: "GET",
        url: "/getPassengersByTime",
        data: {
            query: "getAllEdges",
            cols: {}
        }

    }).done(function (data) {

        data = JSON.parse(data);

        _self.flightNum = {};

        console.log(data);

        for (var i = 0; i < data.length; i++) {

            if (!_self.flightNum[data[i]["_id"]["Destination"]]) {

                _self.flightNum[data[i]["_id"]["Destination"]] = [];

            }

            _self.flightNum[data[i]["_id"]["Destination"]].push({

                date: parseDate(data[i]["_id"]["Date"]),
                value: +data[i]["Passengers"]

            });

        }

        _self.refreshChart();

    });

    _self.colors = d3.scale.category10();
}

PassengerChart.prototype.refreshChart = function () {

    var _self = this;

    var x = _self.x = d3.time.scale()
        .range([0, _self.width]);

    var y = _self.y = d3.scale.linear()
        .range([_self.height, 0]);

    var xAxis = _self.xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function (d) {
            return d3.time.format('%b %y')(new Date(d));
        })
        .innerTickSize(-_self.height)
        .outerTickSize(0)
        .tickPadding(10);

    _self.xAxis.ticks(d3.time.months, 6);

    var yAxis = _self.yAxis = d3.svg.axis()
        .scale(y)
        .orient("left").tickFormat(d3.format("s"))
        .innerTickSize(-_self.width)
        .outerTickSize(0)
        .tickPadding(10);;

    var line = _self.line = d3.svg.line()
        .x(function (d) {
            return x(d["date"]);
        })
        .y(function (d) {
            return y(d["value"]);
        });

    var dests = Object.keys(_self.flightNum);

    x.domain(d3.extent(_self.flightNum[dests[1]], function (d) {
        return d.date;
    }));

    var range1 = d3.extent(_self.flightNum[dests[0]], function (d) {
        return d.value;
    });

    var range2 = d3.extent(_self.flightNum[dests[1]], function (d) {
        return d.value;
    })

    var r = [range1[0] > range2[0] ? range2[0] : range1[0], range1[1] < range2[1] ? range2[1] : range1[1]]

    y.domain(r);

    _self.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + _self.height + ")")
        .call(xAxis);

    _self.svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Passengers");

    for (var i = 0; i < dests.length; i++) {

        _self.flightNum[dests[i]].sort(function (a, b) {
            if (b["date"].getTime() < a["date"].getTime()) return 1;
            return -1;
        });

        _self.svg.append("path")
            .datum(_self.flightNum[dests[i]])
            .attr("id", "time" + dests[i])
            .attr("class", "flightsTime")
            .attr("d", line)
            .attr("fill", "transparent")
            .attr("stroke", _self.colors(dests[i]))
            .attr("stroke-width", "2px");
    }

}