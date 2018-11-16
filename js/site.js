
var map;

resetAll = function() {
    //href="javascript:dc.filterAll();dc.redrawAll();"
    $('#dc-table-graph').hide();
    dc.filterAll();
    dc.redrawAll();
};

// Load waterpoint-data (# of waterpoints per EA)
d3.dsv(';')("data/WP_adm4_source.csv", function (sources_data) {
//d3.dsv(';')("data/WP_source_attribute_export.csv", function (data) {
    d3.dsv(';')("data/overview_sources_attributes.csv",function(attributes_data) {
                
        // Load geodata
        d3.json("data/WP_admin4_topojson.json",function (topodata) {
            
            // Convert from topojson to geojson format
            geodata = topojson.feature(topodata,topodata.objects.WP_admin4);

            // Load crossfilter object
            var cf = crossfilter(sources_data);
            var cf2 = crossfilter(attributes_data);

            // Create dimensions
            cf.id = cf.dimension(function(d) {return d.EACODE; });
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
            //dc.chartRegistry.clear();
            //if (map !== undefined) { map.remove(); }
            var attribute_chart = dc.rowChart("#attributes");
            var source_chart = dc.rowChart("#sources");
            var map_chart = dc.leafletChoroplethChart("#map");
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
                    console.log(chart.filters());
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
                            return feature.properties.EACODE;
                        })
                .colors(d3.scale.ordinal()
                                .domain([1,2,3,4,5])
                                .range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']))
                .colorAccessor(function(d){
                    if (!d || d.value==0){return 1;} else if (d.value <=5){return 2;} else if (d.value <=10){return 3;} else if (d.value <=20){return 4;} else if (d.value >20){return 5;}
                })
                // .colorCalculator(function(d){console.log(d.value);
                    // if (!d || d.value==0){return '#f1eef6';} else if (d.value <=5){return '#bdc9e1';} else if (d.value <=10){return '#74a9cf';} else if (d.value <=20){return '#2b8cbe';} else if (d.value >20){return '#045a8d';}
                // })
                .popup(function(d){return 'Waterpoints: ' + d.value;})
                .renderPopup(true)
                .legend(dc.leafletLegend().position('topright'))     
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
            
            /* var _info = L.control();
            _info.onAdd = function(map) {
              this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
              this.update();
              return this._div;
            };
            // method that we will use to update the control based on feature properties passed
            _info.update = function(props) {
              this._div.innerHTML = '<h4>Extreme Events</h4>' + (props ?       
                '<b>' + props.key + '</b><br />' + 'Event probability: ' + 
                Math.round(100 * props.value.count / (timeAggCount)) + '%' : 'Hover over a map region');
            }; */
                
            // Table of activities data
			data_table.width(960).height(800)
				.dimension(cf.id)
				.group(function(d) { return ""; })
				.size(200)
				.columns([
                    function(d) { return d.source; },
                    function(d) { return d.value; },
                    function(d) { return d.EACODE; }
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
