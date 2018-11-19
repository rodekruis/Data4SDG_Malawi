
var admin_level = 3; // 3 or 4
var color_thresholds_admin4 = [0,5,10,20];
var color_thresholds_admin3= [0,100,200,500];
var labels_admin4 = ['0','1-5','6-10','11-20','20+'];
var labels_admin3 = ['0','<100','<200','<500','500+'];
var color_thresholds;
var legend_labels;
var map;

setAdmin = function(admin_level) {
    document.getElementById('map-container').innerHTML = "<div id='map' style='width:600px; height:800px'></div>";
    color_thresholds = admin_level == 3 ? color_thresholds_admin3 : color_thresholds_admin4;
    legend_labels = admin_level == 3 ? labels_admin3 : labels_admin4;
    generateContent(admin_level);
}

resetAll = function() {
    //href="javascript:dc.filterAll();dc.redrawAll();"
    $('#dc-table-graph').hide();
    dc.filterAll();
    dc.redrawAll();
};


generateContent = function(admin_level) {
    // Load waterpoint-data (# of waterpoints per EA)
    d3.dsv(';')("data/WP_adm" + admin_level + "_source.csv", function (sources_data) {
    //d3.dsv(';')("data/WP_source_attribute_export.csv", function (data) {
        d3.dsv(';')("data/overview_sources_attributes.csv",function(attributes_data) {
                    
            // Load geodata
            d3.json("data/WP_admin" + admin_level + "_topojson.json",function (topodata) {
                
                // Convert from topojson to geojson format
                geodata = topojson.feature(topodata,topodata.objects["WP_admin" + admin_level]);

                // Load crossfilter object
                var cf = crossfilter(sources_data);
                var cf2 = crossfilter(attributes_data);

                // Create dimensions
                cf.id = cf.dimension(function(d) {return d.pcode; });
                cf.source = cf.dimension(function(d) {return d.source; });
                cf.source_fake = cf.dimension(function(d) {return d.source; });
                cf2.attribute = cf2.dimension(function(d) {return d.attribute; });

                // Create cross-filter groups (sum waterpoints per EA and per source)
                var id = cf.id.group().reduceSum(function(d){return d.value;});
                var source = cf.source.group().reduceSum(function(d){return d.value;});
                var attribute = cf2.attribute.group(); //.reduceSum(function(d){return d.score;});
                            
                // Define this for filter-all and count-all
                var all = cf.groupAll().reduceSum(function(d){return d.value;});
                dc.dataCount("#count-info")
                    .dimension(cf)
                    .group(all);

                // Define charts
                dc.chartRegistry.clear();
                if (map !== undefined) { console.log(map); map.remove(); }
                var map_chart = dc.leafletChoroplethChart("#map");
                var attribute_chart = dc.rowChart("#attributes");
                var source_chart = dc.rowChart("#sources");
                var data_table = dc.dataTable("#dc-table-graph");
                
                // Configure Attributes row-chart
                attribute_chart.width(200).height(300)
                    .dimension(cf2.attribute)
                    .group(attribute)
                    .colors(['#01AED9'])
                    .colorDomain([0,0])
                    .colorAccessor(function(d, i){return 1;})
                    .ordering(function(d){return -d.value;})
                    .on('filtered',function(chart,filters){
                        if (chart.filters().length == 0) {
                            cf.source_fake.filter(null);
                            dc.redrawAll();
                        } else {
                            var attribute_filter = chart.filters()[0];
                            var sources_filter = [];
                            attributes_data.forEach(function(e){ if (e.attribute == attribute_filter) {sources_filter.push(e.source);};});
                            console.log(sources_filter);
                            cf.source_fake.filter(function(d){ return sources_filter.indexOf(d) > -1; });
                            dc.redrawAll();
                        }
                    })
                    ;
                
                // Define Sources row-chart
                source_chart.width(400).height(300)
                    .dimension(cf.source)
                    .group(source)
                    .colors(['#01AED9'])
                    .colorDomain([0,0])
                    .colorAccessor(function(d, i){return 1;})
                    .ordering(function(d){return -d.value;})
                    .on('filtered',function(chart,filters){
                    })
                    ;
                
                // Define EA map-chart
                map_chart.width(660).height(800)
                    .dimension(cf.id)
                    .group(id)
                    .center([0,0])
                    .zoom(0)
                    .geojson(geodata)
                    .featureKeyAccessor(function(feature){
                                return feature.properties.pcode;
                            })
                    .colors(d3.scale.ordinal()
                                    .domain([0,1,2,3,4])
                                    .range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']))
                    .colorAccessor(function(d){
                        if (!d || d.value<=color_thresholds[0]){return 0;} 
                        else if (d.value <=color_thresholds[1]){return 1;} 
                        else if (d.value <=color_thresholds[2]){return 2;} 
                        else if (d.value <=color_thresholds[3]){return 3;} 
                        else if (d.value > color_thresholds[3]){return 4;}
                    })
                    .popup(function(d){return 'Waterpoints: ' + d.value;})
                    .renderPopup(true)
                    .legend(dc.leafletLegend(legend_labels).position('topright'))     
                    .on('filtered',function(chart,filters){
                        // if (chart.filters().length > 0){
                            // source_chart.filter(null);
                            // source_chart.redraw();
                            // $('#dc-table-graph').show();
                        // } else {
                            // $('#dc-table-graph').hide();
                        // }
                    })       
                ;
                const scaleOrdinal = d3.scale.linear()
                                    .domain([1,2,3,4,5])
                                    .range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']);
                console.log(scaleOrdinal(4.9));
                    
                // Table of activities data
                data_table.width(960).height(800)
                    .dimension(cf.id)
                    .group(function(d) { return ""; })
                    .size(200)
                    .columns([
                        function(d) { return d.source; },
                        function(d) { return d.value; },
                        function(d) { return d.pcode; }
                    ])
                    .order(d3.ascending)
                ;	
                 

                // var map_chart = dc.leafletMarkerChart("#map");
                // map_chart.width(660).height(800)
                  // .dimension(cf.id)
                  // .group(id)
                  // .center([35.5,-16.0])
                  // .zoom(1)
                  // .renderPopup(false)
                  // .filterByArea(true);
                
                // LOAD CONTENT
                $('#dc-table-graph').hide();
                dc.renderAll();
                var map = map_chart.map();
                // var polygon_layer;
                // for (var x in map._layers) {
                    // if (map._layers[x]._layers) {
                        // polygon_layer = map._layers[x];
                    // }
                // }
                // polygon_layer.setStyle({weight:0, color: 'transparent'});

                function zoomToGeom(geom){
                    var bounds = d3.geo.bounds(geom);
                    map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
                }
                zoomToGeom(geodata);

            });
        });
    });
};

setAdmin(admin_level);


//Legend code adapted from http://leafletjs.com/examples/choropleth.html
dc.leafletLegend = function () {
    var _parent, _legend = {};
    var _leafletLegend = null;
    var _position = 'bottomleft';

    _legend.parent = function (parent) {
        if (!arguments.length) {
            return _parent;
        }
        _parent = parent;
        return this;
    };

    var _LegendClass = function () {
        return L.Control.extend({
            options: {position: _position},
            onAdd: function (map) {
                this._div = L.DomUtil.create('div', 'info legend');
                map.on('moveend',this._update,this);
                this._update();
                return this._div;
            },
            _update: function () {
                if (_parent.colorDomain()) { // check because undefined for marker charts
                    var minValue = _parent.colorDomain()[0],
                        maxValue = _parent.colorDomain()[_parent.colorDomain().length - 1], //_parent.colorDomain().length - 1],
                        palette = _parent.colors().range(),
                        colorLength = _parent.colors().range().length,
                        delta = (maxValue - minValue) / colorLength,
						length = _parent.colorDomain().length,
						step = Math.floor(length/5),
                        i;

                    // define grades for legend colours
                    // based on equation in dc.js colorCalculator (before version based on colorMixin)
                    var grades = [];
                    //grades[0] = Math.round(minValue);
                    for (i = 0; i < colorLength; i++) {
                        grades[i] = Math.round(_parent.colorDomain()[step*(i)]*10)/10; //Math.round((0.5 + (i - 1)) * delta + minValue);
						if (grades[i] >= 1000000) {grades[i]=Math.round(grades[i]/100000)/10 + 'M';}
						else if (grades[i] >= 1000) {grades[i]=Math.round(grades[i]/100)/10 + 'k';}
                    };
                    labels = admin_level == 3 ? labels_admin3 : labels_admin4;
                    
					// var div = L.DomUtil.create('div', 'info legend');
                    // loop through our density intervals and generate a label with a colored
                    // square for each interval
                    this._div.innerHTML = ''; //reset so that legend is not plotted multiple times
                    for (i = 0; i < grades.length; i++) {
                            if (maxValue <= 10 && minValue >= 0 && maxValue > 1) {
                                this._div.innerHTML +=
                                '<i style="background:' + palette[i] + '"></i> ' +
                                labels[i] + (i < grades.length - 1 ? '<br>' : '');
                            } else {
                                this._div.innerHTML +=
                                '<i style="background:' + palette[i] + '"></i> ' +
                                grades[i] + (i < grades.length - 1 ? ' &ndash; ' + grades[i + 1] + '<br>' : '+');
                            }
                            
                    }
                }
            }
        });
    };

    _legend.LegendClass = function (LegendClass) {
        if (!arguments.length) {
            return _LegendClass;
        }

        _LegendClass = LegendClass;
        return _legend;
    };

    _legend.render = function () {
        // unfortunately the dc.js legend has no concept of redraw, it's always render
        if (!_leafletLegend) {
            // fetch the legend class creator, invoke it
            var Legend = _legend.LegendClass()();
            // and constuct that class
            _leafletLegend = new Legend();
            _leafletLegend.addTo(_parent.map());
        }

        return _legend.redraw();
    };

    _legend.redraw = function () {
        _leafletLegend._update();
        return _legend;
    };

    _legend.leafletLegend = function () {
        return _leafletLegend;
    };

    _legend.position = function (position) {
        if (!arguments.length) {
            return _position;
        }
        _position = position;
        return _legend;
    };

    return _legend;
};
