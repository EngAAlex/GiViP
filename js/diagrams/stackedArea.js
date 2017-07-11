var StackedArea = (function(){

	var y, yAxis, line, area, currentScope, frame, stack, tag, needle, passedElement, hWidth, hHeight;


	var stackedAreaTip = d3.tip()
	.attr('class', 'chart-tooltip stackedAreaTip')
	.offset([0,0])
	.html(function(d){
		return "<strong>Frame:</strong> <span style='color:red'>" + d.numberOfBlock + "</span><br /><strong>" + d.key + "</strong> <span style='color:red'>" + (d[1] - d[0]) + "</span>";
	});

	function getIntFromPxString(px){
		return parseInt(px.split("px")[0]);
	}

	return {
	
		resize: function(){

			var tag = "#" + frame;

			//hWidth = d3.select(tag).node().getBoundingClientRect().width - 10;
			hWidth = x.range()[1] + 5;
			hHeight = smallMultipleHeight;
			//hHeight = d3.select(tag).node().getBoundingClientRect().height;

			d3.select(tag).select('svg')
			.attr("width", hWidth).attr("height", hHeight);

		},	
	

		stackedAreaSetup: function(selectedFrame){

			frame = selectedFrame;

			tag = "#" + frame; 
//
//			hWidth = d3.select(tag).node().getBoundingClientRect().width - 10;
//			hHeight = d3.select(tag).node().getBoundingClientRect().height;
//
//			$(tag).html("");
//
//			d3.select(tag).append("svg").attr("width", hWidth).attr("height", hHeight);
			
			d3.select(tag).append("svg");
			
			this.resize();

		},

		stackedArea: function(elementIndex, scope){ //needs an array of elements, in each of them there must be 2 values.

			var cHeight = 0;
			var cWidth = 0;

			passedElement = elementIndex;

//			currentElements = elements;
			currentScope = scope;
			currentFrame = frame;

			var elementBlocks = [];

			var i = -1;

//			var hWidth = d3.select(tag + " svg").node().getBoundingClientRect().width - 10;
//			var hHeight = d3.select(tag + " svg").node().getBoundingClientRect().height;

			y = d3.scaleLinear().range([diagramPaddingY, hHeight - diagramPaddingY]);

			y.domain([maxElementsExchanged[scope], 0]);

			yAxis = getYAxis(y, maxElementsExchanged[scope], 0, numberFormats[scope]);

//			line = d3.line()
//			.x(function(d) { 
//			return x(d.data.timeIndex); })
//			.y(function(d) { return y(d.data[messagesScales[scope]][0]); });

			area = d3.area()
			.x(function(d) { 
				return x(d.data.timeIndex); })
				.y0(function(d) { 
					return y(d[0]); })//d.data[messagesOrByte(d.data.scale)[0]]; })
					.y1(function(d) { 
						return y(d[1]); });//d.data[messagesOrByte(d.data.scale)[0]] + d.data[messagesOrByte(d.data.scale)[1]]});

			var svg = d3.select(tag).selectAll("svg");

			svg.append('circle').attr('id', 'stackedtipfollowscursor-' + frame);

			svg.call(stackedAreaTip);

			stack = d3.stack()
			.keys(["incoming", "outgoing"])
			.value(function(d, key){
				var currentElement = d.blockElementDetails[indexInBlockMap[elementIndex]];				
				if(key == "incoming")
					return currentElement[messagesScales[scope]][0] + currentElement[selfMessagesScales[scope]];
				else
					return currentElement[messagesScales[scope]][1] + currentElement[selfMessagesScales[scope]];
			})	
			.order(d3.stackOrderNone)
			.offset(d3.stackOffsetNone);

			svg.append("g")
			.attr("class", "xb axis")
			.attr("stroke", "black")
			.attr("transform", "translate(0," + (hHeight - diagramPaddingY) + ")")
			.call(d3.axisBottom().scale(x).ticks(0));

			svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (diagramPaddingX) + ",0)");					

//			svg.select("g.x.axis").call(xAxis);
			svg.select("g.y.axis").call(yAxis);		

//			plotStack(svg, currentElements);

			var g = svg.append("g").selectAll("path.stackedArea")
			.data(stack(superstepBlocks[scales[currentScale]])).enter();

//			g.append("path")
//			.attr("class", "chartLine")
//			.attr("d", line)
//			.attr("stroke", function(d){ 
//			return d3.color(white); });			

			g.append("path")
			.attr("id", function(d){ return dotExcaper("stack%" + d.key + "%" + passedElement);})
			.attr("class", "stackedArea")
			.attr("d", function(d) { return area(d); })
			.attr("fill", function(d){
				if(d.key == "incoming")
					return d3.color(colorOfElement(scales[currentScale], passedElement)).darker();
				else
					return colorOfElement(scales[currentScale], passedElement);
			})
			.on('mousemove',/*tip.show*/
					function (d) {
				stackedAreaTip.hide();
				var target = d3.select('#stackedtipfollowscursor-' + frame)
				.attr('cx', d3.event.offsetX)
				.attr('cy', d3.event.offsetY)
				.node();
				var indexToShow = getClosestXTick(d3.event.offsetX);
//				var indexToShow = Math.round(d3.event.offsetX/x(d[0].data.nstep)) - 1;
//				indexToShow = indexToShow < 0 ? 0 : indexToShow;
				d[indexToShow].key = d.key;
				stackedAreaTip.show(d[indexToShow], target);
				higlightElements(d3.event.target.id.split('%')[2]);
			})
			.on('mouseout', function(d){ stackedAreaTip.hide(); higlightElements();});

			// Vertical grid
			svg.append("g")       
			.attr("class", "vertical-axis")
			.attr("transform", "translate(0," + (hHeight)  + ")")
			.attr("stroke", "lightgray")
			.attr("stroke-dasharray", "5,5")
			.attr("stroke-opacity", "0.4")
			.call(d3.axisBottom().scale(x)
					.tickSize(-(hHeight), 0, 0)
					.tickFormat("")
					.tickValues(xAxis.tickValues())
			);

			svg.append("g").
			append("line")
			.attr("class", "needle")
			.attr("x1", x(x.domain()[0])) 
			.attr("y1", 0)
			.attr("x2", x(x.domain()[0]))  
			.attr("y2", hHeight)	
			.call(d3.drag().on("drag", function(d){
				moveNeedle(d3.event.x);
			})
			.on("end", function(d){
				lockNeedle(d3.event.x);
			}));			

		},

		clear: function(elements){

			d3.select(tag + " svg").selectAll("g").remove();

//			plotStack(d3.select(tag).selectAll("svg"), elements);		

		},

	}

});
