function FlightsBar(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 5,
        right: 20,
        bottom: 30,
        left: 55
    };

    d3.select("#" + _self.parentId).append("text")
        .text("Number of flights from")
        .style("font-size", "12px");

    _self.width = options.width - _self.margin.left - _self.margin.right;

    //_self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.height = 10000;

    _self.svg = d3.select("#" + _self.parentId).append("div")
        .style("overflow", "scroll")
        .style("width", options.width)
        .style("height", options.height - 15)
        .append("svg")
        .attr("id", "flightsbar")
        .attr("width", _self.width + _self.margin.left + _self.margin.right - 5)
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
}

FlightsBar.prototype.refreshChart = function () {

    var _self = this;

    _self.x = d3.scale.linear()
        .domain([0, d3.max(_self.flightNum, function (d) {
            return Math.pow(d[numFlights], 1);
        })])
        .range([0, _self.width]);

    _self.y = d3.scale.ordinal()
        .domain(_self.flightNum.map(function (d) {
            return d["_id"][source];
        }))
        .rangeBands([0, _self.height]);

    _self.barH = _self.height / _self.flightNum.length;

    _self.bars = _self.svg.selectAll("g")
        .data(_self.flightNum)
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
        });

    _self.bars.append("rect")
        .attr("width", function (d) {
            return _self.x(Math.pow(d[numFlights], 1));
        })
        .attr("height", _self.barH - 5)
        .attr("fill", "#9ecae1");

    _self.bars.append("text")
        .attr("x", function (d) {
            return 5;
        })
        .attr("y", _self.barH / 3)
        .attr("fill", "#222")
        .attr("text-anchor", "start")
        .attr("dy", ".35em")
        .text(function (d) {
            return d[numFlights];
        });

    _self.svg.selectAll("text.name")
        .data(_self.flightNum)
        .enter().append("text")
        .attr("x", _self.margin.left - 5)
        .attr("y", function (d) {
            return _self.y(d["_id"][source]) + _self.barH / 2;
        })
        .attr("fill", "#222")
        .attr("text-anchor", "end")
        .attr('class', 'name')
        .text(function (d) {
            return d["_id"][source];
        });

}

FlightsBar.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/getFlightsBySource",
        data: {
            data: queryStack
        }

    }).done(function (data) {

        _self.flightNum = JSON.parse(data);

        _self.refreshChart();

    });

}