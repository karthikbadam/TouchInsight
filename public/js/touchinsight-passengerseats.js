function PassengerSeats(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 20,
        right: 0,
        bottom: 10,
        left: 10
    };

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.x = d3.scale.ordinal().rangePoints([0, _self.width], 1);
    _self.y = {};
    _self.dragging = {};

    _self.line = d3.svg.line();
    _self.axis = d3.svg.axis().orient("left");
    _self.background;
    _self.foreground;


    _self.svg = d3.select("#" + _self.parentId).append("svg")
        .attr("width", _self.width + _self.margin.left + _self.margin.right)
        .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + _self.margin.left + "," + _self.margin.top + ")");

    _self.edges = 0;

    $.ajax({

        type: "GET",
        url: "/getPassengerSeats",
        data: {
            query: "getAllEdges",
            cols: {}
        }

    }).done(function (data) {

        data = JSON.parse(data);

        console.log(data)

        _self.passengerSeats = data;

        _self.refreshChart();

    });

}

PassengerSeats.prototype.refreshChart = function () {

    var _self = this;

    _self.x.domain(_self.dimensions = d3.keys(_self.passengerSeats[0]["_id"])
                   .filter(function (d) {
        return (_self.y[d] = d3.scale.linear()
            .domain(d3.extent(_self.passengerSeats, function (p) {
                return +p["_id"][d];
            }))
            .range([_self.height, 0]));
    }));

    // Add grey background lines for context.
    _self.background = _self.svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(_self.passengerSeats)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#9ecae1")
        .attr("stroke-width", "0.5px");

    // Add blue foreground lines for focus.
    _self.foreground = _self.svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(_self.passengerSeats)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#9ecae1")
        .attr("stroke-width", "0.5px");

    // Add a group element for each dimension.
    var g = _self.g = _self.svg.selectAll(".dimension")
        .data(_self.dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
            return "translate(" + _self.x(d) + ")";
        })
        .call(d3.behavior.drag()
            .origin(function (d) {
                return {
                    x: _self.x(d)
                };
            })
            .on("dragstart", function (d) {
                _self.dragging[d] = _self.x(d);
                _self.background.attr("visibility", "hidden");
            })
            .on("drag", function (d) {
                _self.dragging[d] = Math.min(_self.width, Math.max(0, d3.event.x));
                _self.foreground.attr("d", path);
                _self.dimensions.sort(function (a, b) {
                    return position(a) - position(b);
                });
                _self.x.domain(dimensions);
                g.attr("transform", function (d) {
                    return "translate(" + position(d) + ")";
                })
            })
            .on("dragend", function (d) {
                delete _self.dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + _self.x(d) + ")");
                transition(_self.foreground).attr("d", path);
                _self.background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function (d) {
            d3.select(this).call(_self.axis.scale(_self.y[d]));
        })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) {
            return d;
        });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function (d) {
            d3.select(this).call(_self.y[d].brush = d3.svg.brush().y(_self.y[d])
                                 .on("brushstart", brushstart)
                                 .on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);


    function position(d) {
        var v = _self.dragging[d];
        return v == null ? _self.x(d) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    // Returns the path for a given data point.
    function path(d) {
        return _self.line(_self.dimensions.map(function (p) {
            return [position(p), _self.y[p](d["_id"][p])];
        }));
    }

    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = _self.dimensions.filter(function (p) {
                return !_self.y[p].brush.empty();
            }),
            extents = actives.map(function (p) {
                return _self.y[p].brush.extent();
            });
        _self.foreground.style("display", function (d) {
            return actives.every(function (p, i) {
                return extents[i][0] <= d["_id"][p] && d["_id"][p] <= extents[i][1];
            }) ? null : "none";
        });
    }


}