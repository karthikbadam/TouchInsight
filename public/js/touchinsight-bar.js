function Bar(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.target = options.target;

    _self.link = options.link;

    _self.text = options.text;

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

Bar.prototype.refreshChart = function () {

    var _self = this;

    if (!_self.svg || _self.svg.select("rect").empty()) {

        d3.select("#" + _self.parentId).append("text")
            .text(_self.text)
            .style("font-size", "12px");


        _self.svg = d3.select("#" + _self.parentId).append("div")
            .style("overflow", "scroll")
            .style("width", _self.width + _self.margin.left + _self.margin.right)
            .style("height", _self.actualheight + _self.margin.top + _self.margin.bottom - 15)
            .append("svg")
            .attr("id", _self.target + "bar")
            .attr("width", _self.width + _self.margin.left + _self.margin.right - 5)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left) + "," +
                _self.margin.top + ")");


        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        //_self.barH = _self.height / _self.targetData.length;
        _self.barH = 20;

        _self.bars = _self.svg.selectAll("g")
            .data(_self.targetData)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        _self.bars.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        _self.svg.selectAll("text.name")
            .data(_self.targetData)
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

        if (device == 2 && _self.parentId != "div" + mainView[0] + "" + mainView[1]) {

            d3.select("#" + _self.parentId).select("div")
                .style("overflow", "hidden");

        }

    } else {

        var allBars = _self.svg.selectAll("g").data(_self.targetData);

        allBars.exit().remove();

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        var rects = allBars.enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        rects.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        allBars.select("rect").attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        var allText = _self.svg.selectAll("text.name").data(_self.targetData);

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

Bar.prototype.refreshMicroViz = function () {

    var _self = this;

    if (!d3.select("#flightsbar").empty()) {
        _self.svg.remove();
    }

    if (!_self.svg || _self.svg.select("rect").empty()) {

        _self.horizonWidth = _self.width + _self.margin.left + _self.margin.right;
        _self.horizonHeight = _self.actualheight + _self.margin.top + _self.margin.bottom;

        console.log("horizon" + _self.horizonHeight);

        var barWidth = 45;

        var size = _self.horizonWidth / barWidth;

        var data = _self.targetData.slice(0, Math.ceil(size / 2));

        var data2 = _self.targetData.slice(
            _self.targetData.length - 1 - Math.ceil(size / 2),
            _self.targetData.length - 1);

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("id", "micro-flights-bar")
            .attr("width", _self.horizonWidth)
            .attr("height", _self.horizonHeight);

        _self.y = d3.scale.linear()
            .range([_self.horizonHeight, 0]);

        _self.y.domain([0, d3.max(_self.targetData, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale1 = d3.scale.linear()
            .range([0.2, 1]);

        _self.opacityScale1.domain([0, d3.max(data, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale2 = d3.scale.linear()
            .range([1, 0.2]);

        _self.opacityScale2.domain([0, d3.max(data2, function (d) {
            return d[_self.target];
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
                return _self.opacityScale1(d[_self.target]);
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
                return _self.opacityScale2(d[_self.target]);
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
            .text(_self.text)
            .style("font-size", "9px");

    } else {
        var barWidth = 45;

        var size = _self.horizonWidth / barWidth;

        var data = _self.targetData.slice(0, Math.ceil(size / 2));

        var data2 = _self.targetData.slice(
            _self.targetData.length - 1 - Math.ceil(size / 2),
            _self.targetData.length - 1);

        _self.y.domain([0, d3.max(_self.targetData, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale1 = d3.scale.linear()
            .range([0.2, 1]);

        _self.opacityScale1.domain([0, d3.max(data, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale2 = d3.scale.linear()
            .range([1, 0.2]);

        _self.opacityScale2.domain([0, d3.max(data2, function (d) {
            return d[_self.target];
        })]);

        var bar1 = _self.svg.selectAll(".high")
            .data(data);

        bar1.exit().remove().transition().duration(500);

        bar1.enter()
            .append("rect")
            .transition().duration(500)
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
                return _self.opacityScale1(d[_self.target]);
            });

        bar1.attr("x", function (d, i) {
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
                return _self.opacityScale1(d[_self.target]);
            });

        var text1 = _self.svg.selectAll(".texthigh")
            .data(data);

        text1.exit().remove().transition().duration(500);

        text1.enter()
            .append("text")
            .transition().duration(500)
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

        text1.attr("x", function (d, i) {
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
            .data(data2);

        bar2.exit().remove().transition().duration(500);

        bar2.enter()
            .append("rect")
            .transition().duration(500)
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
                return _self.opacityScale2(d[_self.target]);
            });

        bar2.attr("x", function (d, i) {
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
                return _self.opacityScale2(d[_self.target]);
            });

        var text2 = _self.svg.selectAll(".textlow")
            .data(data2);

        text2.exit().remove().transition().duration(500);

        text2.enter()
            .append("text")
            .transition().duration(500)
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

        text2.attr("x", function (d, i) {
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

    }
}

Bar.prototype.refreshThumbnail = function () {

    var _self = this;

    if (!_self.svg || _self.svg.select("rect").empty()) {

        d3.select("#" + _self.parentId).append("text")
            .text(_self.text)
            .style("font-size", "9px");


        _self.svg = d3.select("#" + _self.parentId).append("div")
            .style("overflow", "scroll")
            .style("width", _self.width + _self.margin.left + _self.margin.right)
            .style("height", _self.actualheight + _self.margin.top + _self.margin.bottom - 10)
            .append("svg")
            .attr("id", _self.target + "bar")
            .attr("class", "thumbnail")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left) + "," +
                _self.margin.top + ")");


        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        //_self.barH = _self.height / _self.targetData.length;
        _self.barH = 15;

        _self.bars = _self.svg.selectAll("g")
            .data(_self.targetData)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        _self.bars.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        _self.svg.selectAll("text.name")
            .data(_self.targetData)
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

        var allBars = _self.svg.selectAll("g").data(_self.targetData);

        allBars.exit().remove();

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        var rects = allBars.enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        rects.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        allBars.select("rect").attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
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
                return Math.round(d[_self.target]);
            });

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        var allText = _self.svg.selectAll("text.name").data(_self.targetData);

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


Bar.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/" + _self.link,
        data: {
            data: queryStack
        }

    }).done(function (data) {

        _self.targetData = JSON.parse(data);

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