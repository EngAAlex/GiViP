var Heatmap = (function(){

	var container = "#heatMapArea";
	var hostLabelsX;
	var hostLabelsY;
	var hWidth;
	var hHeight;
	var elements;
	var data = [];
	var gridSizeX;
	var gridSizeY;
	var legendElementWidth = "5px";
	var legendElementHeight = "10px";
	var diagramPadding = -24;
	var internalPadding = 10;

	var heatmapTip = d3.tip()
	.attr('class', 'chart-tooltip heatmapTip')
	.html(function(d){
		return "<strong>Source:</strong> <span style='color:red'>" + d.source + "</span><br />" +
		"<strong>Target:</strong> <span style='color:red'>" + d.target + "</span><br />" +
		"<strong>Latency:</strong> <span style='color:red'>" + d.latency + "</span>";
	});	

	return{

		setupNodeLabels: function(){
			var svg = d3.select(container + " svg");

			var hostLabelsY = svg.selectAll(".hostY")
			.data(elements)
			.enter().append("text")
			.text(function (d) { return d; })
			.attr("x", function(d, i) { return ((i * gridSizeY) - diagramPadding*2.8 + internalPadding); })
			.attr("y", -30)
			.style("text-anchor", "end")
			.attr("width", gridSizeY)
			.attr("transform", "rotate(90)");

			//.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

			//.attr("x", 0)
			//.attr("y", function (d, i) { return i * gridSizeY; })

			var hostLabelsX = svg.selectAll(".hostX")
			.data(elements)
			.enter().append("text")
			.text(function(d) { return d; })
			.attr("x", function(d, i) { return (i * gridSizeX) - diagramPadding*2 + internalPadding + 10; })
			.attr("y", -diagramPadding + 3)
			.attr("width", gridSizeX)
			.style("text-anchor", "middle");//			.attr("transform", "translate(" + gridSizeX + ", -6)");

//			.attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

			// text label for the y axis

		},

		resize: function(redraw = true){

			hWidth = d3.select("#clusterArea").node().getBoundingClientRect().width + diagramPadding;
			hHeight = d3.select("#clusterArea").node().getBoundingClientRect().height + diagramPadding;			

			d3.select(container).select('svg')
			.attr("width", hWidth).attr("height", hHeight);

			gridSizeX = hWidth/elements.length-internalPadding;
			gridSizeY = hHeight/elements.length-internalPadding;

			heatmapTip.offset([gridSizeY,0]);

			/*this.setupLabels();*/
			if(redraw)
				this.showHeat(data);

		},

		initHeatMapArea: function(){

			hWidth = d3.select("#clusterArea").node().getBoundingClientRect().width + diagramPadding;
			hHeight = d3.select("#clusterArea").node().getBoundingClientRect().height + diagramPadding;

			d3.select(container).append('svg');

		},

		addHosts: function(hosts){
			var i = 0;
			elements = [];
			$.each(hosts, function(index, item){
				elements[i] = index;
				i++;
			});

			this.resize(false);

		},

		showHeat: function(data/*S = false*/){

			/*if(dataS != false)
				data = dataS;*/

			if(data.length == 0 || data == undefined){
				//this.displayNoData();
			}else{

				var svg = d3.select(container + " svg");

				var scale = d3.scaleLinear()
				.domain([0, /*d3.max(data, function (d) { return d.latency; })*/50])
				.range([0, 1]);

				/*var cards = svg.selectAll(".tile")
			.data(data);

			cards.append("title");*/

				var cards = svg.selectAll("g")
				.data(data)
				.enter().append("g");

				cards.append("rect")
				.attr("x", function(d) { return (indexInBlockMap[d.target] * gridSizeX) - diagramPadding + 2*internalPadding; })
				.attr("y", function(d) { return (indexInBlockMap[d.source] * gridSizeY) - diagramPadding + internalPadding; })
				.attr("rx", 0)
				.attr("ry", 0)
				.attr("id", function(d){return "heatmap-tile-"+d.target+"%&%"+d.source;})
				.attr("class", "heatmaptile bordered")
				.attr("width", gridSizeX)
				.attr("height", gridSizeY)
				.style("fill", function(d) { return d3.interpolateYlOrRd(scale(d.latency)); })		
				.on("mouseover", function(d){
					heatmapTip.show(d);
					var toHighlight = d3.event.target.id.split("heatmap-tile-")[1].split("%&%");
					higlightElements(toHighlight[0]);
					higlightElements(toHighlight[1]);})
					.on("mouseout", function(d){higlightElements(); heatmapTip.hide();})	

					cards.select("title").text(function(d) { return d.value; });

				cards.exit().remove();

				svg.append("g").append("text")
				.attr("y", "-40")
				.attr("x", (hHeight / 2))
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.style("font-weight", "bold")
				.attr("transform", "rotate(90)")
				.text("SOURCE"); 

				svg.append("g").append("text")             
				.attr("transform",
						"translate(" + hWidth/2 + " ," + 
						-diagramPadding + ")")
						.style("text-anchor", "middle")
						.style("font-weight", "bold")
						.text("TARGET");

				svg.call(heatmapTip);

				/*
			var legend = svg.selectAll(".legend")
			.data([0].concat(colorScale.quantiles()), function(d) { return d; });

			legend.enter().append("g")
			.attr("class", "legend");

			legend.append("rect")
			.attr("x", function(d, i) { return legendElementWidth * i; })
			.attr("y", height)
			.attr("width", width)
			.attr("height", "10px")
			.style("fill", function(d, i) { return colors[i]; });

			legend.append("text")
			.attr("class", "mono")
			.text(function(d) { return Math.round(d); })
			.attr("x", function(d, i) { return legendElementWidth * i; })
			.attr("y", height + gridSize);

			legend.exit().remove();*/
			}

		},

		displayNoData: function(){
			var svg = d3.select(container + " svg");

			svg.append("g")
			.attr("id", "no-data-text")
			.attr("transform","translate(" + (hWidth/2 - 40) + ", " + hHeight/2 + ")")
			.append("text")
			.attr("anchor-point", "middle")
			.text("No data to display")
			.attr("opacity", 1);			
		},

		clear: function(){

			d3.select(container + " svg").selectAll("g").remove();

			/*d3.select(container + ' svg').selectAll("rect").remove();
			d3.select(container + ' svg').selectAll(".hostX").remove();
			d3.select(container + ' svg').selectAll(".hostY").remove();
			d3.select(container + ' svg').selectAll("text").remove();*/

		}

	}

});