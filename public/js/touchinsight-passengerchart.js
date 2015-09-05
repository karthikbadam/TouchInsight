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

    var query = new Query({
        index: "Date",
        value: ["199101", "200912"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();
    _self.colors = d3.scale.category10();
}

PassengerChart.prototype.refreshChart = function () {

    var _self = this;

    var x = _self.x = d3.time.scale()
        .range([0, _self.width]);

    var y = _self.y = d3.scale.linear()
        .range([_self.height, 0]);

    _self.brush = d3.svg.brush()
        .x(x)
        .on("brushend", brushed);

    var xAxis = _self.xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function (d) {
            return d3.time.format('%b %y')(new Date(d));
        })
        .innerTickSize(-_self.height)
        .outerTickSize(0)
        .tickPadding(10);

    _self.xAxis.ticks(d3.time.years, 1);

    var yAxis = _self.yAxis = d3.svg.axis()
        .scale(y)
        .orient("left").tickFormat(d3.format("s"))
        .innerTickSize(-_self.width)
        .outerTickSize(0)
        .tickPadding(10);;

    var line = _self.line = d3.svg.line()
        .x(function (d) {
            return x(parseDate(d["_id"][date]));
        })
        .y(function (d) {
            return y(d[passengers]);
        });

    x.domain(d3.extent(_self.flightNum, function (d) {
        return parseDate(d["_id"][date]);
    }));

    y.domain(d3.extent(_self.flightNum, function (d) {
        return d[passengers];
    }));

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

    _self.flightNum.sort(function (a, b) {
        if (parseDate(b["_id"][date]).getTime() <
            parseDate(a["_id"][date]).getTime()) return 1;
        return -1;
    });

    _self.svg.append("path")
        .datum(_self.flightNum)
        .attr("id", "time")
        .attr("class", "flightsTime")
        .attr("d", line)
        .attr("fill", "transparent")
        .attr("stroke", "#9ecae1")
        .attr("stroke-width", "2px");

    _self.svg.append("g")
        .attr("class", "brush")
        .call(_self.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", _self.height + 7);

    function brushed() {

        var left = _self.brush.extent()[0];
        var right = _self.brush.extent()[1];

        var leftYear = left.getFullYear().toString();
        var leftMonth = left.getMonth() < 10 ? "0" + left.getMonth().toString() : left.getMonth().toString();

        left = leftYear + leftMonth;

        var rightYear = right.getFullYear().toString();
        var rightMonth = right.getMonth() < 10 ? "0" + right.getMonth().toString() : right.getMonth().toString();

        right = rightYear + rightMonth;

        console.log(left + ", " + right);

        var query = new Query({
            index: "Date",
            value: [left, right],
            operator: "range",
            logic: currentLogic
        });

        setGlobalQuery(query, 1);

        _self.postUpdate();

    }
}

PassengerChart.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/getPassengersByTime",
        data: {
            data: queryStack
        }

    }).done(function (data) {

        _self.flightNum = JSON.parse(data);

        _self.refreshChart();

    });

}