var TreeMap = (function(){

	var strokeWidth = 2;

	var diagramPadding = -28;

	var hWidth;
	var hHeight; 
	
	var xCorrection;
	var yCorrection;

	var treemap = d3.treemap()
	.tile(d3.treemapResquarify)
	.paddingOuter(6)
	.paddingTop(25)
	.paddingInner(7)
	.round(true);

	var stratification = d3.stratify()
	.id(function(d) { return d.id; })
	.parentId(function(d) { return d.parent; });

	return {

		resize: function(){

			hWidth = d3.select("#treeMapArea").node().getBoundingClientRect().width;
			hHeight = d3.select("#treeMapArea").node().getBoundingClientRect().height;

			d3.select('#treeMapArea').select('svg')
			.attr("width", hWidth).attr("height", hHeight + 25)
			.attr("transform", "translate(-5," + diagramPadding +")");
			
			treemap.size([hWidth, hHeight]);

		},

		initTreeMapArea: function(){

			hWidth = d3.select("#treeMapArea").node().getBoundingClientRect().width;
			hHeight = d3.select("#treeMapArea").node().getBoundingClientRect().height;

			var svg = d3.select('#treeMapArea').append('svg')
			.attr("width", hWidth).attr("height", hHeight + 25)
			.attr("transform", "translate(-5," + diagramPadding +")");

			treemap.size([hWidth, hHeight]);

		},

		plotTreemap: function(){

			var svg = d3.select('#treeMapArea svg');

			xCorrection = 0;
			yCorrection = 0;
//			var virtualRoot = {};
//			virtualRoot.children = superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails;

//			var hierarchy = d3.hierarchy(
//			virtualRoot
//			)

			var hierarchy = stratification(invertedHierarchy)
			.sum(function(d) { 
				if(d.type != "worker")
					return 0;											
				return superstepBlocks[d.type][currentSuperstep].blockElementDetails[indexInBlockMap[d.id]].computedVertices; 
			});

			treemap(hierarchy);

			var cell = svg.selectAll("g")
			.data(hierarchy.descendants())
			.enter().append("g")
			.attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
			.on("mouseover", function(d){higlightElements(d3.event.target.id.split("treemap-node-")[1]);})
			.on("mouseout", function(d){higlightElements();})			
			.on("click", function(d){ 
				checkElementRemoval(d.descendants());
			});

			cell.append("rect")
			.attr("id", function(d) { return dotExcaper("treemap-node-" + d.data.id); })
			.attr("width", function(d) { return d.x1 - d.x0; })
			.attr("height", function(d) { return d.y1 - d.y0; })
			.attr("stroke", function(d){
				if(d.id == "virtualRoot")
					return "transparent";
				return d3.color(colorOfElement(d.data.type, d.id)).darker();				
			})
			.attr("fill", function(d) { 
				if(d.id == "virtualRoot")
					return "transparent";
				return colorOfElement(d.data.type, d.id); })
				.attr("stroke-width", strokeWidth)
			.attr("class", function(d){
				var classString = "";
				if(hiddenElements[d.data.id])
					classString += "deactivatedTile";
				return classString;
			});

			cell.append("clipPath")
			.attr("id", function(d) { return "clip-" + d.id; })
			.append("use")
			.attr("xlink:href", function(d) { return dotExcaper("#treemap-node-" + d.id); });

			cell.append("text")
			.attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
			.attr("id", function(d) {
				if(d.id == "virtualRoot")
					return "";
				return dotExcaper('#treemap-text-' + d.id);
				})			
			.selectAll("tspan")
			.data(function(d) {
				if(d.id == "virtualRoot")
					return "";
				var suffix = "%" + (d.x1-d.x0) + "%" + (d.y1-d.y0) + "%" + d.depth;
				return ["" + d.id.split(/(?=[A-Z][^A-Z])/g)[0] + suffix]; 
			})			
			.enter().append("tspan")
			.attr("text-anchor", "middle")
			.attr("class", function(d){
				if(simplifiedHierarchy["worker"][d.split("%")[0]] != undefined) 
					return "workerTile"; 
				else
					return "";
			})		
			.style('fill', function(d){return perceivedBrightness(
					$(dotExcaper('#treemap-node-' + d.split("%")[0])).attr("fill"));
			})
			.attr("x", function(d){ 
				var dimensions = d.split("%");
				return dimensions[1]/2;
			})//4)
			.attr("y", function(d, i) {
				var dimensions = d.split("%");				
				if(dimensions[3] != 3)					
					return 19 + i * 10;
				else
					return dimensions[2]/2;
				})
			.text(function(d) { return d.split("%")[0].split(".")[0]; });

			cell.append("title")
			.text(function(d) { return d.id + "\nVertices: " + d.value; });

			svg.select("#virtualRoot").remove();
			
//			.attr("font-size", function(d) { 
//				var splits = d.split("%");
//				return Math.min(splits[1] / splits[0].length ) + "px"; })	

		},

		clear: function(){

			d3.select('#treeMapArea svg').selectAll("g").remove();

		}

	}

});