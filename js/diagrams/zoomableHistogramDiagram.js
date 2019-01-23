
var AreaChart = (function(){

	var y, yAxis, area, line, hWidth, hHeight, frame;

	var histogramTip = d3.tip()
	.attr('class', 'chart-tooltip histogramTip')
	.offset([0,0])
	.html(function(d){
		var uls = "Computations: <ul>";
		$.each(d.computations, function(index, item){
			uls += "<li>"+item.classname+"&emsp;<span style='float: right;'>x"+item.occurrencies+"</span></li>"
		})
		uls += "</ul>";
		return "<strong>Frame:</strong> <span style='color:red'>" + d.numberOfBlock + "</span><br />" +
				"<strong>Duration:</strong> <span style='color:red'>" + d.duration + "</span><br />" +
				uls;
	});

//	function zoom() {
//		d3.transform(x);
//		draw();	
//	}

	return {

		resize: function(){

			var tag = "#" + frame;

			//hWidth = d3.select(tag).node().getBoundingClientRect().width - 10;
			hWidth = x.range()[1] + 5;// - x.range()[0];
			hHeight = smallMultipleHeight;
			//hHeight = d3.select(tag).node().getBoundingClientRect().height;

			d3.select(tag).select('svg')
			.attr("width", hWidth).attr("height", hHeight);

		},

		histogramAreaSetup: function(selectedFrame){

			frame = selectedFrame;

			/*
			hWidth = d3.select("#" + frame).node().getBoundingClientRect().width - 10;
			hHeight = d3.select("#" + frame).node().getBoundingClientRect().height;
			*/
			
			d3.select("#" + frame).append("svg");//.attr("width", hWidth).attr("height", hHeight);
			
			this.resize();

//			addXAxis();
		},

		plotHistogram: function(elementIndex){

			var tag = "#" + frame + " svg"

//			var maxSuperstep = d3.max(elements, 
//			function(d){ return d[xElement] * d.numberOfBlock; });

			// Scales. Note the inverted domain for the y-scale: bigger is up!
			y = d3.scaleLinear().range([hHeight - diagramPaddingY, diagramPaddingY]);
//			yAxis = d3.axisLeft().scale(y).tickPadding(6); //.tickSize(-hiHeight)

			// An area generator.
			area = d3.area()
			.x(function(d) {
				return x(d.timeIndex); })
				.y0(y(0))
				.y1(function(d) {
					var currentElement = d.blockElementDetails[indexInBlockMap[elementIndex]];									
					return y(currentElement.duration); });

			// A line generator.
			line = d3.line()
			.x(function(d) { return x(d.timeIndex); })
			.y(function(d) { 
				var currentElement = d.blockElementDetails[indexInBlockMap[elementIndex]];				
				return y(currentElement.duration); });

			var svg = d3.select(tag);
			
			svg.call(histogramTip);
			
			svg = svg.append("g");

			svg.append('circle').attr('id', 'histogramTipfollowscursor-'+frame);

			svg.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("x", clipPathInfo[0])
			.attr("y", y(1))
			.attr("width", clipPathInfo[1] - clipPathInfo[0])
			.attr("height", y(0) - y(1));

			// Compute the domain.
			y.domain([0, slowestWorkerTime]);

			yAxis = getYAxis(y, slowestWorkerTime, 1, timeFormat);

			svg.append("path")
			.datum(superstepBlocks[scales[currentScale]])
			.attr("id", function(d){ return dotExcaper("area%" + elementIndex);})			
			.attr("class", "area")
			.attr("clip-path", "url(#clip)")
			.attr("fill", function(d){
				return colorOfElement(scales[currentScale], elementIndex);
			})
			.attr("d", area)
			.on('mouseover',/*tip.show*/
					function (d) {
				histogramTip.hide();
				var target = d3.select('#histogramTipfollowscursor-'+frame)
				.attr('cx', d3.event.offsetX)
				.attr('cy', hHeight)
				.node();
				histogramTip.show(d[getClosestXTick(d3.event.offsetX)], target);
				higlightElements(d3.event.target.id.split('%')[1]);				
			})
			.on('mouseout', function(d){ histogramTip.hide(); higlightElements();});

			svg.append("g")
			.attr("class", "xb axis")
			.attr("stroke", "black")
			.attr("transform", "translate(0," + (hHeight - diagramPaddingY) + ")")
			.call(d3.axisBottom().scale(x).ticks(0));

			svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (diagramPaddingX) + ",0)")
			.style("font-size", "14");					

			svg.append("path")
			.datum(superstepBlocks[scales[currentScale]])
			.attr("class", "line")
			.attr("clip-path", "url(#clip)")
			.attr("d", line)
			.attr("stroke", function(d){
				return d3.color(colorOfElement(scales[currentScale], elementIndex)).darker();
			});

			svg.append("rect")
			.attr("class", "pane")
			.attr("width", hWidth)
			.attr("height", hHeight)
			.style("fill", "none");
			//.call(d3.zoom().on("zoom", zoom));
			
			// Vertical grid
			svg.append("g")    
			.datum(superstepBlocks[scales[currentScale]])
			.attr("class", function(d){return d[currentSuperstep].latencies != undefined || d[currentSuperstep].latencies > 0 ? "vertical-axis latency" : "vertical-axis";})
			.attr("transform", "translate(0," + (hHeight)  + ")")
			.attr("stroke-dasharray", "5,5")
			.attr("stroke-opacity", "0.4")			
			.call(d3.axisBottom().scale(x)
					.tickSize(-(hHeight), 0, 0)
					.tickFormat("")
					.tickValues(xAxis.tickValues())
			);

			//.attr("stroke", function(d){ return
			//	d[currentSuperstep].latencies != undefined || d[currentSuperstep].latencies > 0 ? "purple" : "lightgray";})

			
			svg.append("line")
			.attr("class", "needle")
			.attr("x1", x(x.domain()[0])) 
			.attr("y1", 0)
			.attr("x2", x(x.domain()[0]))  
			.attr("y2", hHeight)			
			.call(d3.drag()
					.on("drag", function(d){
						moveNeedle(d3.event.x)})
						.on("end", function(d){
							lockNeedle(d3.event.x);
						}));			

			// Bind the data to our path elements.
//			svg.select("path.area").data(elements);
//			svg.select("path.line").data(elements);

//			svg.select("g.x.axis").call(xAxis);
			svg.select("g.y.axis").call(yAxis);
//			svg.select("path.area").attr("d", area);
//			svg.select("path.line").attr("d", line);


		},

		clear: function(){

			d3.select("#" + frame + " svg").selectAll("g").remove();

		}

	}

});
