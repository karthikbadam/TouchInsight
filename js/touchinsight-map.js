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

    _self.width = options.width;

    _self.height = options.height;

    _self.svg = d3.select("#" + _self.parentId)
        .append("svg")
        .attr("id", "choropleth")
        .attr("width", _self.svgWidth + _self.margin.left - _self.margin.right)
        .attr("height", _self.height + _self.margin.top + _self.margin.bottom)

    _self.sourceAirports = flights().distinct(source);
    _self.destAirports = flights().distinct(destination);

    var edges = {};

    for (var i = 0; i < _self.sourceAirports.length; i++) {

        for (var j = 0; j < _self.destAirports.length; j++) {

            if (!edges[_self.sourceAirports[i]]) {

                edges[_self.sourceAirports[i]] = {};

            }

            if (!edges[_self.sourceAirports[i]][_self.destAirports[j]]) {

                edges[_self.sourceAirports[i]][_self.destAirports[j]] = 0;
            }

            edges[_self.sourceAirports[i]][_self.destAirports[j]] =
                flights({
                "Source": _self.sourceAirports[i],
                "Destination": _self.destAirports[j]
            }).sum(numFlights);

        }

    }

}