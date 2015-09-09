function FlightsBar(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 5,
        right: 20,
        bottom: 30,
        left: 40
    };


    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.actualheight = options.height - _self.margin.top - _self.margin.bottom;

    //_self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.height = 10000;

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

    if (!_self.svg || _self.svg.select("rect").empty()) {

        d3.select("#" + _self.parentId).append("text")
            .text("Number of flights from")
            .style("font-size", "12px");


        _self.svg = d3.select("#" + _self.parentId).append("div")
            .style("overflow", "scroll")
            .style("width", _self.width + _self.margin.left + _self.margin.right)
            .style("height", _self.actualheight + _self.margin.top + _self.margin.bottom - 15)
            .append("svg")
            .attr("id", "flightsbar")
            .attr("width", _self.width + _self.margin.left + _self.margin.right - 5)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left) + "," + 
                  _self.margin.top + ")");


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

        //_self.barH = _self.height / _self.flightNum.length;
        _self.barH = 20;

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
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .text(function (d) {
                return d["_id"][source];
            });

    } else {

        var allBars = _self.svg.selectAll("g").data(_self.flightNum);

        allBars.exit().remove();

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.flightNum, function (d) {
                return Math.pow(d[numFlights], 1);
            })])
            .range([0, _self.width]);

        var rects = allBars.enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        rects.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[numFlights], 1));
            })
            .attr("height", _self.barH - 5)
            .attr("fill", "#9ecae1");

        rects.append("text")
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

        allBars.select("rect").attr("width", function (d) {
                return _self.x(Math.pow(d[numFlights], 1));
            })
            .attr("height", _self.barH - 5)
            .attr("fill", "#9ecae1");

        allBars.select("text")
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

        _self.y = d3.scale.ordinal()
            .domain(_self.flightNum.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        var allText = _self.svg.selectAll("text.name").data(_self.flightNum);

        allText.exit().remove();

        allText.enter().append("text")
            .attr("x", _self.margin.left - 5)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .text(function (d) {
                return d["_id"][source];
            });

        allText.attr("x", _self.margin.left - 5)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .text(function (d) {
                return d["_id"][source];
            });

    }

}

FlightsBar.prototype.refreshMicroViz = function () {

    var _self = this;

    if (!d3.select("#flightsbar").empty()) {
        _self.svg.remove();
    }

    _self.horizonWidth = _self.width + _self.margin.left + _self.margin.right;
    _self.horizonHeight = _self.actualheight + _self.margin.top + _self.margin.bottom;

    console.log("horizon" + _self.horizonHeight);

    var barWidth = 45;

    var size = _self.horizonWidth / barWidth;

    var data = _self.flightNum.slice(0, Math.ceil(size / 2));

    var data2 = _self.flightNum.slice(
        _self.flightNum.length - 1 - Math.ceil(size / 2),
        _self.flightNum.length - 1);

    _self.svg = d3.select("#" + _self.parentId).append("svg")
        .attr("id", "micro-flights-bar")
        .attr("width", _self.horizonWidth)
        .attr("height", _self.horizonHeight);

    _self.y = d3.scale.linear()
        .range([_self.horizonHeight, 0]);

    _self.y.domain([0, d3.max(_self.flightNum, function (d) {
        return d[numFlights];
    })]);

    _self.opacityScale1 = d3.scale.linear()
        .range([0.2, 1]);

    _self.opacityScale1.domain([0, d3.max(data, function (d) {
        return d[numFlights];
    })]);

    _self.opacityScale2 = d3.scale.linear()
        .range([1, 0.2]);

    _self.opacityScale2.domain([0, d3.max(data2, function (d) {
        return d[numFlights];
    })]);

    var bar1 = _self.svg.selectAll(".high")
        .data(data).enter()
        .append("rect")
        .attr("class", "high")
        .attr("x", function (d, i) {
            return i * barWidth;
        })
        .attr("y", function (d) {
            return 0;
        })
        .attr("height", function (d) {
            return _self.horizonHeight;
        })
        .attr("width", barWidth - 2)
        .attr("fill", "#9ecae1")
        .attr("fill-opacity", function (d) {
            return _self.opacityScale1(d[numFlights]);
        });

    var text1 = _self.svg.selectAll(".texthigh")
        .data(data).enter()
        .append("text")
        .attr("class", "texthigh")
        .attr("x", function (d, i) {
            return i * barWidth;
        })
        .attr("y", function (d) {
            return _self.horizonHeight - 5;
        })
        .style("width", barWidth - 2)
        .attr("fill", "#222")
        .attr("font-size", "9px")
        .text(function (d) {
            return d["_id"][source].substr(0, 8);
        });

    var bar2 = _self.svg.selectAll(".low")
        .data(data2).enter()
        .append("rect")
        .attr("class", "low")
        .attr("x", function (d, i) {
            return data.length * barWidth + i * barWidth;
        })
        .attr("y", function (d) {
            return 0;
        })
        .attr("height", function (d) {
            return _self.horizonHeight;
        })
        .attr("width", barWidth - 2)
        .attr("fill", "#d62728")
        .attr("fill-opacity", function (d) {
            return _self.opacityScale2(d[numFlights]);
        });

    var text2 = _self.svg.selectAll(".textlow")
        .data(data2).enter()
        .append("text")
        .attr("class", "textlow")
        .attr("x", function (d, i) {
            return data.length * barWidth + i * barWidth;
        })
        .attr("y", function (d) {
            return _self.horizonHeight - 5;
        })
        .style("width", barWidth - 2)
        .attr("fill", "#222")
        .attr("font-size", "9px")
        .text(function (d) {
            return d["_id"][source].substr(0, 8);
        });


    _self.svg.append("text")
        .attr("transform", "translate(" + 0 + "," + 10 + ")")
        .text("Flights from")
        .style("font-size", "11px");
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

        if (largedisplay) {
            _self.refreshChart();
            return;
        }

        if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

            _self.refreshChart();

        } else {

            _self.refreshMicroViz();
        }

    });

}