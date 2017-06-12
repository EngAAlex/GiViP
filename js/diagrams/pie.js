
var Pie = (function(){

	var pieCurrentScale;
	var pieElements;
	var radius;
	
	var pieTip = d3.tip()
	.attr('class', 'tooltip pie-tooltip')
	.offset([0, 0])
	.html(function(d) {
		return "<strong>Identifier:</strong> <span style='color:red'>" + d.data.elementIndex + "</span><br /><strong>Share of vertices:</strong> <span style='color:red'>" + d.data.computedVertices + "</span>";
	});
	
	var label = d3.arc()
	.outerRadius(radius - 40)
	.innerRadius(radius - 40);
	
	var pie = d3.pie()
	.value(function(d) { return d.computedVertices; });

	var showTip = function(d){
			pieTip.hide();
			var target = d3.select('#pietipfollowscursor')
			.attr('cx', d3.event.offsetX)
			.attr('cy', d3.event.offsetY)
			.node();
			pieTip.show(d, target);
	};
	
	function appendToArc(g){
		var path = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

		var arc = g.selectAll(".arc")
		.data(pie(superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails)).enter()
		.append("g")
		.attr("class", "arc");
		
		arc.append("path")
		.attr("d", path)
		.attr("fill", function(d) { return colorOfElement(scales[currentScale], d.data.elementIndex); })
		.on('mousemove', showTip)
			.on('mouseleave', pieTip.hide);
	}
	
	return {

		pieAreaSetup: function(){

			pieCurrentScale = "worker";

			var hWidth = d3.select("#pieAreaSVG").node().getBoundingClientRect().width;
			var hHeight = d3.select("#pieAreaSVG").node().getBoundingClientRect().height;

			$("#pieAreaSVG").html("");

			var g = d3.select("#pieAreaSVG").append("svg").attr("width", hWidth).attr("height", hHeight)
			.append("g").attr("transform", "translate(" + hWidth / 2 + "," + hHeight / 2 + ")");
			
			var svg = d3.select("#pieAreaSVG svg");		
							
			radius = Math.min(hWidth, hHeight) / 2,

			svg.call(pieTip);
			
			appendToArc(g);

//			arc.append("text")
//			.attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
//			.attr("dy", "0.35em")
//			.text(function(d) { return d.computedVertices; });
			
			svg.append('circle').attr('id', 'pietipfollowscursor');   /* .attr('r',5) /*  to debug */

		},

		updatePie: function(){
									
//		    var t = d3.transition().duration(transitionDuration)
//		    	.selectAll("#pieAreaSVG svg .arc");
//			
//		    t.remove();
			
			d3.selectAll("#pieAreaSVG svg .arc").remove();
		    		    
			appendToArc(d3.select("#pieAreaSVG svg g"));
			
		}

	}

});