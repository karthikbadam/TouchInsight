function Map(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 20,
        right: 0,
        bottom: 30,
        left: 30
    };

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.svg = d3.select("#" + _self.parentId)
        .append("svg")
        .attr("id", "choropleth")
        .attr("width", _self.width + _self.margin.left + _self.margin.right)
        .attr("height", _self.height + _self.margin.top + _self.margin.bottom)

    _self.edges = 0;

    _self.query = {
        index: "Date",
        cols: {
            Date: ["199101", "200912"]
        }
    }
    
    _self.postUpdate(_self.query);

    _self.colors = d3.scale.category10();

}

Map.prototype.refreshChart = function () {

    var _self = this;

    if (d3.select("#map").empty()) {

        var top = 49.3457868;
        var left = -124.7844079;
        var right = -66.9513812;
        var bottom = 24.7433195;

        var scale = 57 * _self.height / Math.abs(bottom - top);

        console.log(scale);

        _self.projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([(_self.width + _self.margin.left + _self.margin.right) / 2, (_self.height + _self.margin.top + _self.margin.bottom) / 2]);

        _self.path = d3.geo.path()
            .projection(_self.projection);

        // draw map
        d3.json("data/us.json", function (error, us) {

            _self.svg.append("path")
                .attr("id", "map")
                .datum(topojson.feature(us, us.objects.land))
                .attr("class", "land")
                .attr("d", _self.path);

            _self.svg.append("path")
                .datum(
                    topojson.mesh(us,
                        us.objects.states,
                        function (a, b) {
                            return a !== b;
                        }))
                .attr("class", "state-boundary")
                .attr("d", _self.path);

            _self.svg.append("g")
                .attr("class", "source")
                .selectAll("circle")
                .data(_self.edges)
                .enter().append("circle")
                .attr("class", "city")
                .attr("transform", function (d, i) {

                    var s = d["_id"][source];
                    var loc = usStates[s];

                    return "translate(" + _self.projection([loc.lon, loc.lat]) + ")";
                })
                .attr("fill", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return "#9ecae1";
                })
                .attr("fill-opacity", 0.7)
                .attr("stroke", "white")
                .attr("stroke-width", "0.5px")
                .attr("r", function (d, i) {

                    return (Math.log(d["Flights"] + 1)) + "px";
                });


            _self.svg.append("g")
                .attr("class", "destination")
                .selectAll("circle")
                .data(_self.edges)
                .enter().append("circle")
                .attr("class", "city")
                .attr("transform", function (d, i) {

                    var s = d["_id"][destination];
                    var loc = usStates[s];

                    return "translate(" + _self.projection([loc.lon, loc.lat]) + ")";
                })
                .attr("fill", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return "#fdbb84";
                })
                .attr("fill-opacity", 0.7)
                .attr("stroke", "white")
                .attr("stroke-width", "0.5px")
                .attr("r", function (d, i) {

                    return (Math.log(d["Flights"] + 1)) + "px";
                });


            _self.svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(_self.edges)
                .enter().append("line")
                .attr("class", "link")
                .attr("stroke", function (d) {
                    return "#9ecae1";
                    //return _self.colors(d["_id"][destination]);
                })
                .attr("stroke-width", function (d, i) {
                    return 0.5;
                    return (Math.log(d["Flights"] + 1)) + "px";
                })
                .attr("stroke-opacity", 0.05)
                .attr("x1", function (d, i) {

                    var s = d["_id"][source];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[0];
                })
                .attr("y1", function (d, i) {

                    var s = d["_id"][source];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[1];

                })
                .attr("x2", function (d, i) {

                    var s = d["_id"][destination];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[0];

                })
                .attr("y2", function (d, i) {

                    var s = d["_id"][destination];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[1];

                });

            _self.svg.append("text")
                .attr("transform", "translate(" + (_self.width - 100) + "," + (_self.height + _self.margin.top) + ")")
                .text("Flights across US")
                .style("font-size", "14px");

        });

    } else {

        var sourceCircles = _self.svg.selectAll(".source circle").data(_self.edges);

        sourceCircles.exit().remove()
            .transition().duration(1000);

        sourceCircles.enter()
            .append("circle")
            .transition().duration(1000)
            .ease("bounce")
            .attr("transform", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];

                return "translate(" + _self.projection([loc.lon, loc.lat]) + ")";
            })
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return "#9ecae1";
            })
            .attr("fill-opacity", 0.7)
            .attr("stroke", "white")
            .attr("stroke-opacity", 1)
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {

                return (Math.log(d["Flights"] + 1)) + "px";
            });

        var destCircles = _self.svg.selectAll(".destination circle").data(_self.edges);

        destCircles.exit().remove()
            .transition().duration(1000);

        destCircles.enter()
            .append("circle")
            .transition().duration(1000)
            .ease("bounce")
            .attr("transform", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];

                return "translate(" + _self.projection([loc.lon, loc.lat]) + ")";
            })
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return "#fdbb84";
            })
            .attr("fill-opacity", 0.7)
            .attr("stroke-opacity", 1)
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {

                return (Math.log(d["Flights"] + 1)) + "px";
            });


        var cityLinks = _self.svg.selectAll(".links line").data(_self.edges);

        cityLinks.exit().remove()
            .transition().duration(1000);

        cityLinks.enter()
            .append("line")
            .transition().duration(1000)
            .ease("linear")
            .attr("class", "link")
            .attr("stroke", function (d) {
                return "#9ecae1";
                //return _self.colors(d["_id"][destination]);
            })
            .attr("stroke-width", function (d, i) {
                return 0.5;
                return (1 + Math.log(d["Flights"] + 1)) + "px";
            })
            .attr("stroke-opacity", 0.05)
            .attr("x1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];
            })
            .attr("y1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            })
            .attr("x2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];

            })
            .attr("y2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            });


    }

}

Map.prototype.postUpdate = function (query) {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/getFlightCounts",
        data: query

    }).done(function (data) {

        data = JSON.parse(data);

        console.log(data)

        _self.edges = data;

        _self.refreshChart();

    });
}