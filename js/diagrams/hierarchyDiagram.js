
var hierarchyDiagramPadding = 25;
//var hHeight = 0;
//var hWidth = 0;

var hierarchyTip = d3.tip()
.attr('class', 'tooltip hierarchy-tooltip')
.offset([0, 0])
.html(function(d) {
	return "<strong>Type:</strong> <span style='color:red'>" + d.data.identifier + "</span><br /><strong>Identifier:</strong> <span style='color:red'>" + d.data.id + "</span>";
});

function hierarchyAreaSetup(){

	var hWidth = d3.select("#hierarchyAreaSVG").node().getBoundingClientRect().width;
//	var hHeight = d3.select("#hierarchyAreaSVG").node().getBoundingClientRect().height;

	var hHeight = $($(".col-md-6")[0]).height();
	
	$("#hierarchyAreaSVG").html("");
	
	d3.select("#hierarchyAreaSVG").append("svg").attr("width", hWidth).attr("height", hHeight)
								.append("g");

	d3.select("#hierarchyAreaSVG svg").append('circle').attr('id', 'hierarchytipfollowscursor');   /* .attr('r',5) /*  to debug */
	
}

function plotHierarchy(elements){
	
	var hierarchy = d3.hierarchy(elements)
					  .sum(function (d) {
						  var totalValue = 1;						  
							if(d.children != undefined)
								totalValue += d.children.length;
						  return totalValue; });
	
	var packer = d3.pack()
				   .padding(hierarchyDiagramPadding)
				   .size([d3.select("#hierarchyAreaSVG").select('svg').attr("width"), d3.select("#hierarchyAreaSVG").select('svg').attr("height")]);
	
	var svg = d3.select("#hierarchyAreaSVG svg");
	
	svg.call(hierarchyTip);
	
	var hArea = svg.select("g").selectAll("g")
				   .data(packer(hierarchy).descendants())
				   .enter().append("g")
					    .attr("class", function(d) { return "node" + (!d.children ? " node--leaf" : d.depth ? "" : " node--root"); })
					    .attr("transform", "translate(0,0)")
					    .each(function(d) { d.node = this; })					    
					    /*.on("mouseover", hovered(true))
					    .on("mouseout", hovered(false));*/
					    
	hArea.append("circle")
	  .attr("cx", function(d){ return d.x; })
	  .attr("cy", function(d){ return d.y;})
      .attr("r", function(d) { 
		  return d.r; })
	  .attr("id", function(d) { return "node-" + d.id; })
      .style("fill", function(d) {
		  if(d.data.identifier == undefined)
			return "transparent";
		  return colorOfElement(d.data.identifier, d.data.id); })
      .style("stroke", function(d) {
		  if(d.data.identifier == undefined)
			return "transparent";
		  return d3.color(colorOfElement(d.data.identifier, d.data.id)).darker(); })
	  .style("stroke-width", "3px")
	  	.on('mousemove',/*tip.show*/
				function (d) {
			hierarchyTip.hide();
			var target = d3.select('#hierarchytipfollowscursor')
			.attr('cx', d3.event.offsetX)
			.attr('cy', d3.event.offsetY)
			.node();
			hierarchyTip.show(d, target);})
		.on('mouseleave', hierarchyTip.hide);;
}
