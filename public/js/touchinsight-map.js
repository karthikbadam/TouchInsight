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

    $.ajax({

        type: "GET",
        url: "/getFlightCounts",
        data: {
            query: "getAllEdges",
            cols: {}
        }

    }).done(function (data) {

        data = JSON.parse(data);
        console.log(data)

        _self.edges = data;

        _self.refreshMap();

    });

}

Map.prototype.refreshMap = function () {

    var _self = this;

    if (d3.select("#map").empty()) {

        _self.projection = d3.geo.albersUsa()
            .scale(700)
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
                .selectAll("circle")
                .data(_self.edges)
                .enter().append("circle")
                .attr("class", "city")
                .attr("transform", function (d, i) {
                
                    var s = d["_id"][source];
                    var loc = usStates[s];
                    
                    console.log(s + i); 
                
                    return "translate(" + _self.projection([loc.lon, loc.lat]) + ")";
                })
                .attr("fill", function (d) {
                    var de = d["_id"][dest];
                    
                    return colorscale(de); 
                })  
                .attr("fill-opacity", 0.2)
                .attr("stroke", "white")
                .attr("stroke-width", "1px")
                .attr("r", 1.5);

        });

    }


}