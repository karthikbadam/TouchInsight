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

    _self.edges = 0;

    var query = new Query({
        index: "Date",
        value: ["199101", "200912"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();
}

Map.prototype.refreshChart = function () {

    var _self = this;

    if (d3.select("#map").empty()) {

        var top = 49.3457868;
        var left = -124.7844079;
        var right = -66.9513812;
        var bottom = 24.7433195;

        var scale = 55 * (_self.height + _self.margin.top + _self.margin.bottom) / Math.abs(bottom - top);

        console.log(scale);

        _self.projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([(_self.width + _self.margin.left + _self.margin.right) / 2, (_self.height + _self.margin.top + _self.margin.bottom) / 2]);

        _self.path = d3.geo.path()
            .projection(_self.projection);

        _self.svg = d3.select("#" + _self.parentId)
            .append("svg")
            .attr("id", "choropleth")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)

        // Create the area where the lasso event can be triggered
        var lasso_area = _self.svg.append("rect")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .style("opacity", 0);

        var lasso_draw = function () {
            // Style the possible dots
            _self.lasso.items().filter(function (d) {
                    return d.possible === true
                })
                .classed({
                    "not_possible": false,
                    "possible": true
                })
                .attr("r", "6px");

            // Style the not possible dot
            _self.lasso.items().filter(function (d) {
                    return d.possible === false
                })
                .classed({
                    "not_possible": true,
                    "possible": false
                });
        };

        var lasso_end = function () {
            // Style the selected dots

            var selectedSources = [];
            var selectedDestinations = [];

            _self.lasso.items().filter(function (d) {
                    if (d.selected === true) {

                        if (d.type == source) {
                            selectedSources.push(d.name);
                        }

                        if (d.type == destination) {
                            selectedDestinations.push(d.name);
                        }
                    }

                    return d.selected === true
                })
                .classed({
                    "not_possible": false,
                    "possible": false
                });

            if (selectedSources.length > 0) {

                var query1 = new Query({
                    index: source,
                    value: selectedSources,
                    operator: "in",
                    logic: currentLogic
                });

                setGlobalQuery(query1, flag = selectedDestinations.length > 0 ? 0 : 1);
            }

            if (selectedDestinations.length > 0) {
                var query2 = new Query({
                    index: destination,
                    value: selectedDestinations,
                    operator: "in",
                    logic: selectedSources.length > 0? "AND": currentLogic
                });

                setGlobalQuery(query2, 1);
            }

            // Reset the style of the not selected dots
            _self.lasso.items().filter(function (d) {
                    return d.selected === false
                })
                .classed({
                    "not_possible": false,
                    "possible": false
                })
                .attr("r", "3px");

        };

        _self.lasso = d3.lasso()
            .closePathDistance(75) // max distance for the lasso loop to be closed
            .closePathSelect(true) // can items be selected by closing the path?
            .hoverSelect(true)
            .area(lasso_area) // area where the lasso can be started
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        // draw map
        d3.json("data/us.json", function (error, us) {

            _self.svg.append("path")
                .attr("id", "map")
                .datum(topojson.feature(us, us.objects.land))
                .attr("class", "land")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            _self.svg.append("path")
                .datum(
                    topojson.mesh(us,
                        us.objects.states,
                        function (a, b) {
                            return a !== b;
                        }))
                .attr("class", "state-boundary")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            var cities = [];
            var sourceCities = [];
            var destinationCities = [];

            for (var i = 0; i < _self.edges.length; i++) {

                var d = _self.edges[i];
                var sourceCity = d["_id"][source];
                var destinationCity = d["_id"][destination];

                if (sourceCities.indexOf(sourceCity) < 0) {
                    cities.push({
                        name: sourceCity,
                        type: source
                    });
                    sourceCities.push(sourceCity);
                }

                if (destinationCities.indexOf(destinationCity) < 0) {
                    cities.push({
                        name: destinationCity,
                        type: destination
                    });
                    destinationCities.push(destinationCity);
                }
            }

            _self.svg
                .selectAll(".city")
                .data(cities)
                .enter().append("circle")
                .attr("class", "city")
                .style("pointer-events", "none")
                .attr("fill", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return d.type == source ? "#4292c6" : "#fb6a4a";
                })
                .attr("cx", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    return _self.projection([loc.lon, loc.lat])[0];
                }).attr("cy", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    return _self.projection([loc.lon, loc.lat])[1];
                })
                .attr("fill-opacity", 1)
                .attr("stroke", "white")
                .attr("stroke-width", "0.5px")
                .attr("r", function (d, i) {
                    return "3px";
                });


            _self.lasso.items(d3.selectAll("circle"));

            _self.svg.append("g")
                .style("pointer-events", "none")
                .attr("class", "links")
                .selectAll("line")
                .data(_self.edges)
                .enter().append("line")
                .attr("class", "link")
                .style("pointer-events", "none")
                .attr("stroke", function (d) {
                    return "#9ecae1";
                    //return _self.colors(d["_id"][destination]);
                })
                .attr("stroke-width", function (d, i) {
                    return (Math.log(d["Flights"] + 0.5)) + "px";
                })
                .attr("stroke-opacity", 0.03)
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

            _self.svg.call(_self.lasso);


        });

    } else {

        var cities = [];
        var sourceCities = [];
        var destinationCities = [];
        for (var i = 0; i < _self.edges.length; i++) {

            var d = _self.edges[i];
            var sourceCity = d["_id"][source];
            var destinationCity = d["_id"][destination];

            if (sourceCities.indexOf(sourceCity) < 0) {
                cities.push({
                    name: sourceCity,
                    type: source
                });
                sourceCities.push(sourceCity);
            }

            if (destinationCities.indexOf(destinationCity) < 0) {
                cities.push({
                    name: destinationCity,
                    type: destination
                });
                destinationCities.push(destinationCity);
            }
        }

        var cityCircles = _self.svg
            .selectAll(".city")
            .data(cities);

        cityCircles.exit().attr("r", "0.1px").transition().duration(1000);


        cityCircles.enter().append("circle")
            .transition().duration(1000)
            .attr("class", "city")
            .style("pointer-events", "none")
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "#4292c6" : "#fb6a4a";
            })
            .attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[0];
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[1];
            })
            .attr("fill-opacity", 1)
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {
                return "3px";
            });

        cityCircles.attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[0];
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[1];
            })
            .attr("fill-opacity", 1)
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {
                return "3px";
            });


        _self.lasso.items(d3.selectAll("circle"));

        var cityLinks = _self.svg.selectAll(".links").selectAll("line").data(_self.edges);

        cityLinks.exit().remove();

        cityLinks.enter()
            .append("line")
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

        cityLinks.attr("x1", function (d, i) {

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


Map.prototype.refreshThumbnail = function () {

    var _self = this;

    if (d3.select("#map").empty()) {

        var top = 49.3457868;
        var left = -124.7844079;
        var right = -66.9513812;
        var bottom = 24.7433195;

        var scale = 55 * (_self.height + _self.margin.top + _self.margin.bottom) / Math.abs(bottom - top);

        _self.projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([(_self.width + _self.margin.left + _self.margin.right) / 2, (_self.height + _self.margin.top + _self.margin.bottom) / 2]);

        _self.path = d3.geo.path()
            .projection(_self.projection);

        _self.svg = d3.select("#" + _self.parentId)
            .append("svg")
            .attr("id", "choropleth")
            .attr("class", "thumbnail")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom);

        // draw map
        d3.json("data/us.json", function (error, us) {

            _self.svg.append("path")
                .attr("id", "map")
                .datum(topojson.feature(us, us.objects.land))
                .attr("class", "land")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            _self.svg.append("path")
                .datum(
                    topojson.mesh(us,
                        us.objects.states,
                        function (a, b) {
                            return a !== b;
                        }))
                .attr("class", "state-boundary")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            var cities = [];
            var sourceCities = [];
            var destinationCities = [];

            for (var i = 0; i < _self.edges.length; i++) {

                var d = _self.edges[i];
                var sourceCity = d["_id"][source];
                var destinationCity = d["_id"][destination];

                if (sourceCities.indexOf(sourceCity) < 0) {
                    cities.push({
                        name: sourceCity,
                        type: source
                    });
                    sourceCities.push(sourceCity);
                }

                if (destinationCities.indexOf(destinationCity) < 0) {
                    cities.push({
                        name: destinationCity,
                        type: destination
                    });
                    destinationCities.push(destinationCity);
                }
            }

            _self.svg
                .selectAll(".city")
                .data(cities)
                .enter().append("circle")
                .attr("class", "city")
                .style("pointer-events", "none")
                .attr("fill", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return d.type == source ? "#4292c6" : "#fb6a4a";
                })
                .attr("cx", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    return _self.projection([loc.lon, loc.lat])[0];
                }).attr("cy", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    return _self.projection([loc.lon, loc.lat])[1];
                })
                .attr("fill-opacity", 1)
                .attr("stroke", "white")
                .attr("stroke-width", "0.5px")
                .attr("r", function (d, i) {
                    return "1px";
                });

            _self.svg.append("g")
                .style("pointer-events", "none")
                .attr("class", "links")
                .selectAll("line")
                .data(_self.edges)
                .enter().append("line")
                .attr("class", "link")
                .style("pointer-events", "none")
                .attr("stroke", function (d) {
                    return "#9ecae1";
                    //return _self.colors(d["_id"][destination]);
                })
                .attr("stroke-width", function (d, i) {
                    return (Math.log(d["Flights"] + 0.5)) + "px";
                })
                .attr("stroke-opacity", 0.01)
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

        });

    } else {

        var cities = [];
        var sourceCities = [];
        var destinationCities = [];
        for (var i = 0; i < _self.edges.length; i++) {

            var d = _self.edges[i];
            var sourceCity = d["_id"][source];
            var destinationCity = d["_id"][destination];

            if (sourceCities.indexOf(sourceCity) < 0) {
                cities.push({
                    name: sourceCity,
                    type: source
                });
                sourceCities.push(sourceCity);
            }

            if (destinationCities.indexOf(destinationCity) < 0) {
                cities.push({
                    name: destinationCity,
                    type: destination
                });
                destinationCities.push(destinationCity);
            }
        }

        var cityCircles = _self.svg
            .selectAll(".city")
            .data(cities);

        cityCircles.exit().attr("r", "0.1px").transition().duration(1000);

        cityCircles.enter().append("circle")
            .transition().duration(1000)
            .attr("class", "city")
            .style("pointer-events", "none")
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "#4292c6" : "#fb6a4a";
            })
            .attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[0];
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[1];
            })
            .attr("fill-opacity", 1)
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {
                return "3px";
            });

        cityCircles.attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[0];
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                return _self.projection([loc.lon, loc.lat])[1];
            })
            .attr("fill-opacity", 1)
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("r", function (d, i) {
                return "1px";
            });

        var cityLinks = _self.svg.selectAll(".links").selectAll("line").data(_self.edges);

        cityLinks.exit().remove();

        cityLinks.enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", function (d) {
                return "#9ecae1";
                //return _self.colors(d["_id"][destination]);
            })
            .attr("stroke-width", function (d, i) {
                return 0.5;
                return (1 + Math.log(d["Flights"] + 1)) + "px";
            })
            .attr("stroke-opacity", 0.01)
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

        cityLinks.attr("x1", function (d, i) {

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


Map.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/getFlightCounts",
        data: {
            data: queryStack
        }
    }).done(function (data) {

        _self.edges = JSON.parse(data);

        if (device == 0) {
            _self.refreshChart();
            return;
        }

        if (device == 1) {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshMicroViz();
            }
        }

        if (device == 2) {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshThumbnail();
            }
        }

    });
}