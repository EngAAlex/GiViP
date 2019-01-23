var webServerUrl = "http://localhost:8080/GivipServer/1.0.0/";
var jobInfoEndpoint = "JobInfo";
var superstepBlockEndpoint = "SuperstepBlock/";

var jobInfo;
var superstepBlocks = {};
var completeSuperstepBlocks = {};
var currentBlockSize = 1;

var transitionDuration = 750;

var smallMultiplePadding = 10;
var smallMultipleHeight = 50;
var smallMultipleWidth;

var bisector = d3.bisector(function (d) { return d; }).left;

var coin = true;

//ANIMATIONS
var transitionTime = 2500;
var animationLock = false;

//FORMATS

var timeFormat;

var numberFormats = {};

//var messagesFormat;
//var bytesFormat;

//X Scale

var tickValues = {};
var noOfTicks = 2;

var x;
var clipPathInfo = [];

var xAxis;
var xAxisHeight = 25;

//PAGINATION

var paginationExtent = 50;
var currentStartPage = 0;

//Y Scale
var slowestWorkerTime = 0;
var maxElementsExchanged = {
		"messages": 0,
		"bytes": 0
};

//TIME INDEX

var currentSuperstep = 0;
var currentSuperstepIndex = 0;
var nextIndex = 0;
var currentScale = 0;

//DIAGRAMS

var diagramPaddingY = 10;
var diagramPaddingX = 45;

var treemapDiagram = TreeMap();
var heatmapDiagram = Heatmap();
var chordDiagram = ChordDiagram();
var pieDiagram = Pie();
var stackedAreas = {};
stackedAreas["messages"] = [];
stackedAreas["bytes"] = [];
var histograms = [];

//HIDDEN ELEMENTS

var hiddenElements = {};

//SUPPORT VARIABLES

var extents;

var leftMargin;

var needleTick;

var scales = ["worker", "host", "rack"];
var scopes = ["messages", "bytes"];

var timer;

var messagesScales = {
		messages: "totalTrafficMessages",
		bytes: "totalTrafficBytes"	
};

var selfMessagesScales = {
		messages: "selfMessages",
		bytes: "selfBytes"	
};

var elementToIndexMapper = {
		"rack": {},
		"host": {},
		"worker": {}
};

var indexInBlockMap = {};

function dotExcaper(s){
	return s.replace(/\./g, "-");
}

//COLORS

var color = d3.scaleOrdinal(d3.schemePaired);

var arcColors = [];
arcColors["worker"] = d3.scaleOrdinal(d3.schemePaired);
arcColors["rack"] = d3.scaleOrdinal(d3.schemeAccent);
arcColors["host"] = d3.scaleOrdinal(d3.schemeSet3);

//HIERARCHIES

var simplifiedHierarchy = {};
var invertedHierarchy = [];

function startEKG(){
	if($('#play-button i').hasClass('fa-heartbeat')){
		if($('#play-button i').removeClass('fa-heartbeat'));
		if($('#play-button i').addClass('fa-stop'));
		nextSuperstep();		
		timer = setInterval(function(){
			if(currentSuperstep == superstepBlocks[scales[currentScale]].length - 1){
				if($('#nextPage').attr('disabled') == false)
					$('#nextPage').click();
				else
					startEKG();
			}else
				nextSuperstep();
		}, transitionTime*2);
	}else{
		if($('#play-button i').addClass('fa-heartbeat'));
		if($('#play-button i').removeClass('fa-stop'));
		clearInterval(timer);
	}
}

function firstSetupCallback(data){

	$.each(data, function(index, item){
		superstepBlocks[index] = item;
//		completeSuperstepBlocks[index] = item;
//		computeTicks(index);
	});

	//superstepBlocks = reduceCrossings(superstepBlocks);

	currentStartPage = Math.floor(currentSuperstepIndex/(paginationExtent*currentBlockSize));

	var superstepToSet = Math.floor((currentSuperstepIndex/(paginationExtent*currentBlockSize))/currentBlockSize);

	if(superstepToSet == 0)
		$('#step-backward-button').attr('disabled','disabled');
	if(superstepToSet == superstepBlocks[scales[currentScale]].length - 1)
		$('#step-forward-button').attr('disabled','disabled');

	paginateSuperstepBlocks();

//	chordDiagram.computeInitialOrdering();
	//	updateAxis();
	computeBlockIndeces();
//	setCurrentScale(0);
	needleTick = superstepToSet;
	setCurrentSuperstep(superstepToSet);
	createFilterSlider();

	if(nextIndex == jobInfo.nsupersteps){
		$('#nextPage').attr('disabled','disabled');
	}else{
		$('#nextPage').attr('disabled', false);
	}

	if(currentSuperstepIndex != 0)
		$('#prevPage').attr('disabled', false);
	else
		$('#prevPage').attr('disabled', 'disabled');

	$('#framesDisplay').html(Math.floor(currentSuperstepIndex/currentBlockSize) + " to " + Math.ceil(nextIndex/currentBlockSize));		
}

function paginateSuperstepBlocks(){
//	superstepBlocks = {};
//	for(var t in scales)
//	superstepBlocks[scales[t]] = [];

//	for(var t in scales){
//	var index = 0;			
//	for(var i=currentStartPage; i < currentStartPage + paginationExtent && i<completeSuperstepBlocks[scales[t]].length; i++){
//	superstepBlocks[scales[t]][index] = completeSuperstepBlocks[scales[t]][i];
//	index++;
//	}
//	}

	for(var t in scales){
		computeTicks(scales[t]);
	}

	updateAxis();

}

function paginationCallback(data){
	$.each(data, function(index, item){
		superstepBlocks[index] = item;
//		completeSuperstepBlocks[index] = item;
//		computeTicks(index);
	});

	paginateSuperstepBlocks();
	clearSmallMultiple();
	prepareSmallMultipleArea();	
	renderSmallMultiples();

	lockNeedle(0);
}

function nextPage(){
	currentStartPage++;
	currentSuperstepIndex = currentStartPage*(paginationExtent*currentBlockSize);

	fetchSuperstepBlock(firstSetupCallback, currentSuperstepIndex);		

}

function prevPage(){
	currentStartPage--;
	currentSuperstepIndex = (currentStartPage*paginationExtent)*currentBlockSize;

	fetchSuperstepBlock(firstSetupCallback, currentSuperstepIndex);		

}

function resizeDiagrams(){
	clearAll();
	updateAxis();
	treemapDiagram.resize();
	heatmapDiagram.resize();
	chordDiagram.resize();
	prepareAndDisplayAll();
}

function getClosestXTick(x){
	var inv = this.x.invert(x);
	var bisected = bisector(tickValues[scales[currentScale]], inv);
	var distanceL = inv - tickValues[scales[currentScale]][bisected - 1];
	var distanceR = tickValues[scales[currentScale]][bisected] - inv;
	return	distanceR > distanceL ? 
			bisected - 1 : bisected;
}

function computeTicks(scale){
	tickValues[scale] = [];
	$.each(superstepBlocks[scale], function(index, item){
		tickValues[scale][index] = item.timeIndex;
	});
}

function getYAxis(y, max, zIndex, format){
	if(y.domain()[zIndex] <= noOfTicks)
		return yAxis = d3.axisLeft().scale(y).ticks(max, "d");
	else{
		var ratio = max/noOfTicks;
		ratio += noOfTicks-(ratio%noOfTicks); 
		var reminder = noOfTicks*ratio;
		return yAxis = d3.axisLeft().scale(y).tickValues(d3.range(0, reminder + 1, ratio)).tickFormat(format);
	}
}

function updateAxis(){
	if(x == undefined)
		x = d3.scaleLinear();
	var panelWidth = d3.select(".smallMultipleRow").node().getBoundingClientRect().width;
	var internalPadding = Number.parseInt($(".panel-body").css("padding").split("px")[0]);
	smallMultipleWidth = panelWidth - internalPadding - 2*diagramPaddingX;
	x.range([diagramPaddingX, 
		smallMultipleWidth]);
	
	clipPathInfo[0] = diagramPaddingX;
	clipPathInfo[1] = smallMultipleWidth;
		
//	clipPathInfo[0] = x(0);
//	clipPathInfo[1] = x(1);
	if(xAxis == undefined)
		xAxis = d3.axisTop().scale(x).tickPadding(6).tickFormat(d3.format("d")); //.tickSize(-hiWidth, 0)

	var currentTicks = tickValues[scales[currentScale]];
	x.domain([currentTicks[0], currentTicks[currentTicks.length - 1]]);
	xAxis.tickValues(currentTicks);	
}

function appendXAxisToFrame(frame){

	var tag = "#" + frame;

//	var hWidth = d3.select(tag).node().getBoundingClientRect().width;
	
	var svg = d3.select(tag).append("svg").attr("width", smallMultipleWidth + 20).attr("height", xAxisHeight);

	svg.append("g")
	.attr("class", "x axis active")
	.attr("transform", "translate(0," + (xAxisHeight - 5) + ")")
	.style("font-size", "14");

	svg.select("g.x.axis").call(xAxis)
	.selectAll(".tick text")
	.attr("transform", "translate(0," + (3) + ")")
	.call(wrapLabels);

}

function fetchAllData(){
	fetchJobInfoData();
}

//function updateSuperstepBlock(blockSize, callback){
//fetchSuperstepBlock(startIndex, endIndex, blockSize, callback);
//}

function initDiagramAreas(){
	chordDiagram.setUpChordDiagram();
	treemapDiagram.initTreeMapArea();
	heatmapDiagram.initHeatMapArea();
}

function nextSuperstep(){
	needleTick++;	
	setCurrentSuperstep(currentSuperstep + 1, true);	
}

function previousSuperstep(){
	needleTick--;	
	setCurrentSuperstep(currentSuperstep - 1, true);
}

function setCurrentSuperstep(c, needle = false){
	currentSuperstep = c;
	currentSuperstepIndex = c*currentBlockSize + currentStartPage*paginationExtent;
	if(currentSuperstep == superstepBlocks[scales[currentScale]].length - 1)
		$('#step-forward-button').attr("disabled", "disabled");
	else
		$('#step-forward-button').attr("disabled", false);
	if(currentSuperstepIndex == 0)
		$('#step-backward-button').attr("disabled", 'disabled');
	else
		$('#step-backward-button').attr("disabled", false);

	if(!needle){
		clearAll();
		prepareAndDisplayAll();
	}else{
//		clearChordDiagram();
//		renderChordDiagram();
		clearHeatmap();
		heatmapDiagram.showHeat(superstepBlocks["host"][currentSuperstep].latencies);
		chordDiagram.animate();		
	}
	moveNeedle(
			x(tickValues[scales[currentScale]][needleTick])				
	);
}

function setCurrentScale(c){
	currentScale = parseInt(c);
	updateFilterSlider();
//	clearChordDiagram();
//	renderChordDiagram();		
	setCurrentSuperstep(currentSuperstep, false);
//	x(tickValues[scales[currentScale]][needleTick])
}

function setCurrentScope(c){
	currentScope = c;
	chordDiagram.animate();
//	clearChordDiagram();
//	renderChordDiagram();	
}

function clearAll(){
	clearSmallMultiple();
	clearTreemap();
	clearChordDiagram();
	clearHeatmap();
}

function clearSmallMultiple(){
	$('.smallMultiple svg').remove();
	stackedAreas["messages"] = [];
	stackedAreas["bytes"] = [];

//	appendXAxisToFrame("smallMultipleMessagesUnits");
//	appendXAxisToFrame("smallMultipleMessagesBytes");
//	appendXAxisToFrame("runningTimesAreaChartSVG");

}

function clearTreemap(){
	treemapDiagram.clear();
}

function clearChordDiagram(){
	chordDiagram.clear();
}

function clearHeatmap(){
	heatmapDiagram.clear();
}

function prepareSmallMultipleArea(){
	multiplyFrames("smallMultipleMessagesUnits", "stackedAreaMessages", superstepBlocks[scales[currentScale]][0].blockElementDetails, "messages");
	multiplyFrames("smallMultipleMessagesBytes", "stackedAreaBytes", superstepBlocks[scales[currentScale]][0].blockElementDetails, "bytes");
	multiplyFrames("runningTimesAreaChartSVG", "runningTimesHistogram", superstepBlocks[scales[currentScale]][0].blockElementDetails);
}

function renderSmallMultiples(){
	$.each(superstepBlocks[scales[currentScale]][0].blockElementDetails, function(index, item){
//		var elementBlocks = [];
//		var i = -1;
		var currentElementIndex = item.elementIndex;

		if(hiddenElements[currentElementIndex]){
//			noOfElementsInScale--;
			return;
		}

		var sA = StackedArea();
		var sB = StackedArea();		
		stackedAreas["messages"][index] = sA;
		stackedAreas["bytes"][index] = sB;

		var excaped = dotExcaper(item.elementIndex);

		sA.stackedAreaSetup("stackedAreaMessages-" + excaped);
		sA.stackedArea(item.elementIndex, "messages", "stackedAreaMessages-" + excaped);
		sB.stackedAreaSetup("stackedAreaBytes-" + excaped);
		sB.stackedArea(item.elementIndex, "bytes", "stackedAreaBytes-" + excaped);

		var hI = AreaChart();
		histograms[index] = hI;
		hI.histogramAreaSetup("runningTimesHistogram-" + excaped);		
		hI.plotHistogram(item.elementIndex);		
//		noOfElementsInScale++;
	});
}

function prepareAndDisplayAll(animateOrReset = false){	

//	updateAxis();

	treemapDiagram.plotTreemap();
	heatmapDiagram.showHeat(superstepBlocks["host"][currentSuperstep].latencies);

//	pieDiagram.pieAreaSetup();

	prepareSmallMultipleArea();

//	var noOfElementsInScale = 0;

	$.each(superstepBlocks[scales[currentScale]], function(subindex, subitem){		
		$.each(subitem.blockElementDetails, function(subsubindex, subsubitem){
			if(hiddenElements[subsubitem.elementIndex]){
				$('treemap-node-' + subsubitem.elementIndex).addClass("deactivatedTile");			
				return;
			}
//			if(i == -1 && subsubitem.elementIndex == currentElementIndex){
//			i = subsubindex;
//			elementBlocks[subindex] = subsubitem; // MAY I USE THE SAME INDEX?
//			}else
//			elementBlocks[subindex] = subitem.blockElementDetails[indexInBlockMap[subsubitem.elementIndex]];					
			slowestWorkerTime = Math.max(slowestWorkerTime, subsubitem.duration);
			maxElementsExchanged["messages"] = Math.max(maxElementsExchanged["messages"], 2*subsubitem.selfMessages + subsubitem.totalTrafficMessages[0] + subsubitem.totalTrafficMessages[1]);
			maxElementsExchanged["bytes"] = Math.max(maxElementsExchanged["bytes"], 2*subsubitem.selfBytes + subsubitem.totalTrafficBytes[0] + subsubitem.totalTrafficBytes[1]);

			timeFormat = d3.formatPrefix(".0f", getOrderOfMagnitude(slowestWorkerTime));
			numberFormats["messages"] = d3.formatPrefix(".0f", getOrderOfMagnitude(maxElementsExchanged["messages"]));
			numberFormats["bytes"] = d3.formatPrefix(".0f", getOrderOfMagnitude(maxElementsExchanged["bytes"]));

		});
//		elementBlocks[subindex].timeIndex = subitem.timeIndex;
//		elementBlocks[subindex].numberOfBlock = subitem.numberOfBlock;
//		elementBlocks[subindex].nstep = subitem.nstep;
//		elementBlocks[index].scope = keys;
	});

	renderSmallMultiples();

	if(!animateOrReset)
		renderChordDiagram();
	else
		chordDiagram.animate();

}

function renderChordDiagram(opacity = 1){
	//if(superstepBlocks[scales[currentScale]][currentSuperstep].edges.length > 0){ && hiddenElements.length != superstepBlocks[scales[currentScale]][0].blockElementDetails.length){
	chordDiagram.plotCore(opacity);	//current superstep
	var level = 1;
	for(i = currentScale + 1; i < scales.length; i++)
		chordDiagram.addOuterScale(i, level++);
//	}else
//	chordDiagram.displayNoData();
}

/*function updateScale(){
	multiplyStackedAreaFrames("smallMultipleMessages", superstepBlocks[scales[currentScale]][0].blockElementDetails);
}*/

function multiplyFrames(mainframe, prefix, elements, scope){

	appendXAxisToFrame(mainframe);

	var tag = "#"+mainframe;

	$(tag + " div").remove();

	var number = 0;
	var width = d3.select(tag).node().getBoundingClientRect().width;	
//	var height = d3.select(tag).node().getBoundingClientRect().height;
//	var ratio = height/number + padding;

	$.each(elements, function(index, item){
		if(hiddenElements[item.elementIndex])
			return;
		var excaped = dotExcaper(item.elementIndex);
		$(tag).append("<div id='" + prefix +"-" + excaped + "'></div>");
		$("#" + prefix + "-" + excaped).css("width", width).css("height", smallMultipleHeight);
		number++;
	});	

//	$(tag).css("height", number*smallMultipleHeight + xAxisHeight + 5);

}

function colorOfElement(scale, identifier){
	var modulo = 12;
	if(scale == "rack")
		modulo = 8;
	return arcColors[scale](elementToIndex(scale, identifier)%modulo);
}

//#### NEEDLE OPERATIONS

function moveNeedle(x, transition = 500){
	var dims = d3.select(".x.axis.active").node().getBBox();
	var maxW = dims.x + dims.width;
	if(x < dims.x + 3)
		x = dims.x + 3;
	if(x > maxW)
		x = maxW;
	d3.selectAll(".needle")		
	.transition(transition)
	.ease(d3.easeCubicInOut)
	.attr("x1", x)
	.attr("x2", x)
}

function lockNeedle(xIn){
	needleTick = getClosestXTick(xIn);		
	setCurrentSuperstep(needleTick, true);
	moveNeedle(
			x(tickValues[scales[currentScale]][needleTick])
	);
}

//##### INDECES TOOLS

function elementToIndex(scale, identifier){
	return elementToIndexMapper[scale][identifier];
}

function reverseElementToIndex(scale, indexToFind){ //POOR PERFORMANCE
	var toReturn;
	$.each(elementToIndexMapper[scale], function(index, item){
		if(item == indexToFind){
			toReturn = index;
			return false;
		}
	});
	return toReturn;
}

function computeHierarchyIndices(){

	var rackIndex = 0;
	var hostIndex = 0;
	var workerIndex = 0;

	for(rackIndex in jobInfo.racklist){
		var rack = jobInfo.racklist[rackIndex];
		elementToIndexMapper[rack.identifier][rack.id] = rackIndex++;
		for(hostIndex in rack.children){
			var host = rack.children[hostIndex];
			elementToIndexMapper[host.identifier][host.id] = hostIndex++;
			for(w in host.children){
				var worker = host.children[w];
				elementToIndexMapper[worker.identifier][worker.id] = workerIndex++;
			}
		}
	}	
}

//################ WARNING!!!!! ################

function computeBlockIndeces(){

	for(s in scales){
		$.each(superstepBlocks[scales[s]], function(subindex, subitem){		
			$.each(subitem.blockElementDetails, function(subsubindex, subsubitem){
				indexInBlockMap[subsubitem.elementIndex] = subsubindex; //WARNING!!! HOST AND WORKERS AND RACKS WITH SAME NAME COLLISION
			});
		})
	}	
}

//################ WARNING!!!!! ################

//HIERARCHY OPERATIONS

function simplifyHierarchy(hierarchy){
	simplifiedHierarchy["rack"] = {};
	simplifiedHierarchy["host"] = {};
	simplifiedHierarchy["worker"] = {};	

	invertedHierarchy[0] = {};
	invertedHierarchy[0].id = "virtualRoot";		
	invertedHierarchy[0].type = "";
	invertedHierarchy[0].parent = "";

	var index;

	$.each(hierarchy, function(index, item){
		simplifiedHierarchy["rack"][item.id] = item;

		index = invertedHierarchy.length;

		invertedHierarchy[index] = {};
		invertedHierarchy[index].id = item.id;		
		invertedHierarchy[index].type = "rack";
		invertedHierarchy[index].parent = "virtualRoot";

		$.each(item.children, function(subindex, subitem){
			simplifiedHierarchy["host"][subitem.id] = subitem;
			simplifiedHierarchy["host"][subitem.id].parent = item.id;

			index = invertedHierarchy.length;

			invertedHierarchy[index] = {};
			invertedHierarchy[index].id = subitem.id;					
			invertedHierarchy[index].type = "host";
			invertedHierarchy[index].parent = item.id;
			$.each(subitem.children, function(subsubindex, subsubitem){

				simplifiedHierarchy["worker"][subsubitem.id] = subsubitem;
				simplifiedHierarchy["worker"][subsubitem.id].parent = subitem.id;

				index = invertedHierarchy.length;

				invertedHierarchy[index] = {};
				invertedHierarchy[index].id = subsubitem.id;						
				invertedHierarchy[index].type = "worker";
				invertedHierarchy[index].parent = subitem.id;				
			});
		});
	});
	heatmapDiagram.addHosts(simplifiedHierarchy["host"]);
}

//####### HIDDEN ELEMENTS LISTENER

function clearHiddenElements(){
	hiddenElements = {};
}

function restoreHiddenElements(){
	$.each(hiddenElements, function(elementIndex, item){
		if(hiddenElements[elementIndex])
			craftEvent("click", $('#treemap-node-'+dotExcaper(elementIndex))[0]);
//		hiddenElements[elementIndex] = null;
//		var excapedElementIndex = dotExcaper(elementIndex);				
//		$('#treemap-node-'+excapedElementIndex).removeClass('deactivatedTile');
//		$('#runningTimesHistogram-' + excapedElementIndex).slideDown();
//		$('#stackedAreaBytes-' + excapedElementIndex).slideDown();
//		$('#stackedAreaMessages-' + excapedElementIndex).slideDown();
	});
	clearHiddenElements();
}

function checkElementRemoval(nodes, idOnly = false){
	$.each(nodes, function(index, item){
		var activate = false;
		var elementIndex;
		var excapedElementIndex;
		if(idOnly){
			elementIndex = item;
		}else{
			elementIndex = item.id; 
		}
		excapedElementIndex = dotExcaper(elementIndex);		
		//if(index == 0)
			if(hiddenElements[item.id])
				activate = true;
		if(activate){			
			hiddenElements[elementIndex] = null;
			$($('g').has('#treemap-node-'+excapedElementIndex)[0]).removeClass('deactivatedTile');
			$('#runningTimesHistogram-' + excapedElementIndex).slideDown();
			$('#stackedAreaBytes-' + excapedElementIndex).slideDown();
			$('#stackedAreaMessages-' + excapedElementIndex).slideDown();
			if(hiddenElements[item.parent.id]){	//!idOnly && index == 0 && 			
				var parent = item.parent.id;
				while(hiddenElements[parent]){
					var excapedParent = dotExcaper(parent);					
					$($('g').has('#treemap-node-'+excapedParent)[0]).removeClass('deactivatedTile');
					hiddenElements[parent] = null;
					/*$('#runningTimesHistogram-' + excapedParent).slideDown();
					$('#stackedAreaBytes-' + excapedParent).slideDown();
					$('#stackedAreaMessages-' + excapedParent).slideDown();*/						
					parent = item.parent.parent.id;									
				}
			}
		}else{
			hiddenElements[elementIndex] = true; //d.desc.toLowerCase();
			$($('g').has('#treemap-node-'+excapedElementIndex)[0]).addClass('deactivatedTile');
			$('#runningTimesHistogram-' + excapedElementIndex).slideUp();
			$('#stackedAreaBytes-' + excapedElementIndex).slideUp();
			$('#stackedAreaMessages-' + excapedElementIndex).slideUp();
		}

	});

	if(!animationLock)
		chordDiagram.animate();

//	clearChordDiagram();
//	renderChordDiagram();
//	prepareAndDisplayAll();
}

//####### CANVAS EVENT LISTENERS

/* off-canvas sidebar toggle */
$('[data-toggle=offcanvas]').click(function() {
	$('.row-offcanvas').toggleClass('active');
	$('.collapse').toggleClass('in').toggleClass('hidden-xs').toggleClass('visible-xs');
	if($('[data-toggle=offcanvas] i').hasClass("fa-chevron-left")){
		$('[data-toggle=offcanvas] i').removeClass("fa-chevron-left");
		$('[data-toggle=offcanvas] i').addClass("fa-chevron-right");
		$('#page-wrapper').css('margin-left', '0px');
	}else if($('[data-toggle=offcanvas] i').hasClass("fa-chevron-right")){
		$('[data-toggle=offcanvas] i').removeClass("fa-chevron-right");
		$('[data-toggle=offcanvas] i').addClass("fa-chevron-left");
		$('#page-wrapper').css('margin-left', leftMargin);		
	}
	resizeDiagrams();
});

function bindSlider(nsupersteps){
	$('#ex1').slider({
		formatter: function(value) {
			return value + ' supersteps' ;},		
			max: nsupersteps
	}).on("slideStop", function(event){
		clearAll();
		currentBlockSize = event.value;
		var page = Math.floor(currentSuperstepIndex/(currentBlockSize*paginationExtent));
		fetchSuperstepBlock(firstSetupCallback, page);
	});

	$('#globalScaleChanger').slider({
		ticks: [0, 1, 2],
		ticks_labels: ["Worker", "Host", "Rack"]
	}).on("slideStop", function(event){
		$("#loading-modal").modal({
			backdrop: 'static',
			keyboard: false
		});		
		clearAll();
		setCurrentScale(event.value);
		$("#loading-modal").modal('hide');
	});
	
	$('#latencySwitch').slider({
			ticks: [0, 1]
	}).on("slideStop", function(event){
		var target = event.currentTarget.value;
		if(target == 0){
			$('#heatMapArea').hide();
			$('#hmViewTitle').hide()
			$('#treeMapArea').show();	
			$('#clViewTitle').show()			
		}else{
			$('#heatMapArea').show();
			$('#treeMapArea').hide();	
			$('#clViewTitle').hide()			
			$('#hmViewTitle').show()			
		}
	});

	$('#ex1Slider .slider-tick-label-container').remove();

	$('#ex1Slider').append(
			`<div class='slider-tick-label-container'>				
			<div class='slider-tick-label' style='width: 100%; text-align: center'>
			<span style="float: left;">1</span>supersteps<span style="float: right;">` + jobInfo.nsupersteps + `</span></div>
			</div>`
	);


	$("#chordScopeSlider").slider({
		ticks: [0, 1]
	}).on("slideStop", function(event){
		currentScope = event.currentTarget.value;
		chordDiagram.updateScope(scopes[currentScope]);
//		chordDiagram.animate();
//		clearChordDiagram();
//		renderChordDiagram();
	});
}

function createFilterSlider(){
	var maxValue = superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails.length;


	$('#filterByTraffic').slider({
		formatter: function(value) {return 'Top ' + value ;},
		max: maxValue,
		value: maxValue
	}).on("slideStop", function(event){
		animationLock = true;
		restoreHiddenElements();
		animationLock = false;
		chordDiagram.showTopTraffic(event.currentTarget.value)
	});;

	$('#trafficSlider .slider-tick-label-container').remove();

	$('#trafficSlider').append(			
			`<div class='slider-tick-label-container'>				
			<div class='slider-tick-label' style='width: 100%; text-align: center'>
			<span style="float: left;">1</span>elements<span style="float: right;">` + maxValue + `</span></div>
			</div>`
	);	
}

function updateFilterSlider(){
	var maxValue = superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails.length;
	$('#filterByTraffic')
	.slider("setAttribute", "max", maxValue)
	.slider("setValue", maxValue)

	$('#trafficSlider .slider-tick-label-container').remove();

	$('#trafficSlider').append(			
			`<div class='slider-tick-label-container'>				
			<div class='slider-tick-label' style='width: 100%; text-align: center'>
			<span style="float: left;">0</span>elements<span style="float: right;">` + maxValue + `</span></div>
			</div>`
	);	

}

function higlightElements(elementIndex = ""){
	if(elementIndex == ""){
		$('.highlighted').removeClass("highlighted");
	}else{
		$('#chord\\%'+elementIndex).addClass("highlighted");
		$('#ribbon\\%'+elementIndex).addClass("highlighted");	
		$('#stack\\%incoming\\%'+elementIndex).addClass("highlighted");
		$('#stack\\%outgoing\\%'+elementIndex).addClass("highlighted");
		$('#area\\%'+elementIndex).addClass("highlighted");
		$('#treemap-node-'+elementIndex).addClass("highlighted");
	}
}

//CROSSING REDUCTION

function reduceCrossings(data){
//	initialOrdering = {};
//	inverseInitialOrdering = {};			
	extents = {};
	var indices = {};

	var supersteps = jobInfo.nsupersteps;

	for(i = 2; i >= 0; i--){
//		initialOrdering[scales[i]] = {};
		var currentBatch = data[scales[i]][0].blockElementDetails;
		var currentEdges = data[scales[i]][0].edges;
		var unassignedVertices = currentBatch.length;
		var tempData = {};
//		var tempArray = [];
		var batchSize = currentBatch.length;

//		for(var p=0; p<unassignedVertices; p++)
//		tempArray[p] = -1;

		//INIT

		for(var t in currentBatch){
			var current = currentBatch[t];
			indices[current.elementIndex] = t;
			tempData[current.elementIndex] = {elementIndex: current.elementIndex, placed: -1, neighbors: {}, uNeighbors: {}, noOfUNeighbors: 0, openEdges: 0};
		}
		for(var t in currentEdges){
			var current = currentEdges[t];	
			tempData[current.source].uNeighbors[current.target] = true;
			tempData[current.target].uNeighbors[current.source] = true;
			tempData[current.source].neighbors[current.target] = current.size/supersteps;
			tempData[current.target].neighbors[current.source] = current.size/supersteps;
			tempData[current.source].noOfUNeighbors += 1; 					
			tempData[current.target].noOfUNeighbors += 1; 										
//			tempData[current.source].openEdges += current.size/supersteps; 
//			tempData[current.target].openEdges += current.size/supersteps; 					
		}

		var lastIndex = -1;

		//MAIN LOOP
		do{
			var chosen;
			var minNeighbors = Number.MAX_VALUE;
			//CHOOSE ELEMENT BY NO OF UNPLACED NEIGHBORS
			$.each(tempData, function(index, item){
				if(item.placed == -1 && item.noOfUNeighbors < minNeighbors){
					minNeighbors = item.noOfUNeighbors;
					chosen = item;
				}
			});

//			batchSize++;

			var left = false;

			//CHOOSE ITS FINAL POSITION
			if(lastIndex == -1 && scales[i] == "rack"){
				lastIndex = 0;				
			}else{
				var indexLeft; 
				var indexRight;
				if(scales[i] == "rack"){
					indexLeft = lastIndex-1%batchSize;
					indexRight = lastIndex+1%batchSize;
				}else{
					var parent = simplifiedHierarchy[scales[i]][chosen.elementIndex].parent;
					var start = extents[scales[i+1]][parent].start;					
					var extent = extents[scales[i+1]][parent].extent;
					var lowerBound = extents[scales[i+1]][parent].lowerBound;
					var upperBound = extents[scales[i+1]][parent].upperBound;
					var sectorLastIndex = extents[scales[i+1]][parent].lastIndex;
					
					if(sectorLastIndex == -1){
						indexLeft = start;
						indexRight = start;
					}else{					
						indexLeft = circularReference(lowerBound-1, start, extent);
						indexRight = circularReference(upperBound +1, start, extent);
					}
				}
//				var modulo;
//				var startingIndex = 0;
				var valueLeft = 0;
				var valueRight = 0;

				tempData[chosen.elementIndex].placed = indexLeft;
				valueLeft = computeCrossingsForLayout(tempData, currentEdges, i);

				if(indexLeft == indexRight)
					valueRight = valueLeft;
				else{
					tempData[chosen.elementIndex].placed = indexRight;
					valueRight = computeCrossingsForLayout(tempData, currentEdges, i);
				}

				if(valueLeft < valueRight){
					lastIndex = indexLeft;
					left = true;
				}else{							
					lastIndex = indexRight;
				}

			}

//			tempArray[lastIndex] = chosen.elementIndex;
			tempData[chosen.elementIndex].placed = lastIndex;

//			inverseInitialOrdering[chosen.elementIndex] = lastIndex;

			if(scales[i] != "rack"){
				extents[scales[i+1]][simplifiedHierarchy[scales[i]][chosen.elementIndex].parent].lastIndex = lastIndex;				
				if(left)
					extents[scales[i+1]][simplifiedHierarchy[scales[i]][chosen.elementIndex].parent].lowerBound = lastIndex;
				else
					extents[scales[i+1]][simplifiedHierarchy[scales[i]][chosen.elementIndex].parent].upperBound = lastIndex;						
			}

			//UPDATE
			$.each(tempData, function(index, item){
				if(item.uNeighbors[chosen.elementIndex]){
					item.uNeighbors[chosen.elementIndex] = null;
					item.noOfUNeighbors--;							
					if(item.placed){
						var edgeValue = item.neighbors[chosen.elementIndex];
//						item.openEdges -= edgeValue;
//						chosen.openEdges -= edgeValue;
					}
				}
			});
			unassignedVertices--;
		}while(unassignedVertices > 0);

//		initialOrdering[scales[i]] = tempArray;

		for(var o=0; o<scales[i].length; o++){
			var temp = [];				
			$.each(tempData, function(index, item){
				temp[item.placed] = data[scales[i]][o].blockElementDetails[indices[index]];
			});
			data[scales[i]][o].blockElementDetails = temp;						
		}
		if(scales[i] != "worker"){
			var current = {};
			var rotation = 0;
			$.each(tempData, function(index, item){
				var currentExtent = simplifiedHierarchy[scales[i]][item.elementIndex].children.length;
				current[item.elementIndex] = {};
				current[item.elementIndex].start = /*item.placed +*/ rotation;
				current[item.elementIndex].extent = currentExtent;
				current[item.elementIndex].lowerBound = rotation;//item.placed;		
				current[item.elementIndex].upperBound = rotation; //item.placed;
				current[item.elementIndex].lastIndex = -1;
				
				rotation += currentExtent;
			});
			extents[scales[i]] = current;
		}else{
			return data;
		}

	}

}

function computeCrossingsForLayout(tempData, edges, scale){
	var crossings = 0;
	var currentExtents = extents[scales[i+1]];
	edges.forEach(function(firstEdge, firstEdgeIndex){
		if(firstEdge.messagesExchanged == 0)
			return;
		edges.forEach(function(secondEdge, secondEdgeIndex){
			if(firstEdge === secondEdge || secondEdge.messagesExchanged == 0)
				return;
			if(scales[scale] == "rack") 
				if((tempData[firstEdge.source].placed == -1	||
						tempData[firstEdge.target].placed == -1)	|| 
						(tempData[secondEdge.source].placed == -1	||
								tempData[secondEdge.target].placed == -1))						
					return false;

//			var parent = simplifiedHierarchy[scales[i]][chosen.elementIndex].parent;								

			var firstEdgeSource, secondEdgeSource;
			var firstEdgeTarget, secondEdgeTarget;

			if(tempData[firstEdge.source].placed != -1)
				firstEdgeSource = tempData[firstEdge.source].placed;
			else
				firstEdgeSource = currentExtents[getParent(firstEdge.source)].start;

			if(tempData[firstEdge.target].placed != -1)
				firstEdgeTarget = tempData[firstEdge.target].placed;
			else
				firstEdgeTarget = currentExtents[getParent(firstEdge.target)].start + currentExtents[getParent(firstEdge.target)].extent;

			if(tempData[secondEdge.source].placed != -1)
				secondEdgeSource = tempData[secondEdge.source].placed;
			else
				secondEdgeSource = currentExtents[getParent(secondEdge.source)].start;

			if(tempData[secondEdge.target].placed != -1)
				secondEdgeTarget = tempData[secondEdge.target].placed;
			else
				secondEdgeTarget = currentExtents[getParent(secondEdge.target)].start + currentExtents[getParent(secondEdge.target)].extent;

			if(!(firstEdgeSource <= secondEdgeSource)
					||
					!(firstEdgeTarget >= secondEdgeTarget))
				crossings += firstEdge.messagesExchanged + secondEdge.messagesExchanged;
		});		
	});
	return crossings/2;
}

function circularReference(value, start, extent){
	var correctedValue = value - start;
	var temp = correctedValue%extent;
	if(temp<0)
		temp += extent;
	return temp + start;
}

function getParent(element){
	return simplifiedHierarchy[scales[i]][element].parent;
}

//OTHERS

function wrapLabels(text) {
	var index = 0;
	var deactivatedIndices = 0;
	var a = document.createElement('canvas');
	var b = a.getContext('2d');	
	text.each(function(){
		var current = d3.select(this);
		var labelLength = current.node().getComputedTextLength();					
		if(deactivatedIndices > 0){
			current.text("");	   
			deactivatedIndices--;
		}else if(index <= tickValues[scales[currentScale]].length - 1){
			var nextLabelWidth = b.measureText(tickValues[scales[currentScale]][index + 1]).width;
			var widthAccumulator = x(tickValues[scales[currentScale]][index + 1]) - x(tickValues[scales[currentScale]][index]);
			while(widthAccumulator < labelLength + nextLabelWidth/2 && index <= tickValues[scales[currentScale]].length - 2){
				deactivatedIndices++;
				index++;
				widthAccumulator += x(tickValues[scales[currentScale]][index + 1]) - x(tickValues[scales[currentScale]][index]);
				nextLabelWidth = b.measureText(tickValues[scales[currentScale]][index]).width;	
			}
			index++;			
		}
	});	
}

function craftEvent(eventName, target){
	var event = document.createEvent('MouseEvents');
	event.initMouseEvent(eventName, true ,true);
	target.dispatchEvent(event);
}

function perceivedBrightness(hex){
	var rgb = hexToRGB(hex);
	var o = Math.round(((rgb["r"] * 299) + (rgb["g"] * 587) + (rgb["b"] * 114)) /1000);
	if(o > 125)
		return "black";
	else
		return "white";
}

function hexToRGB(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function getOrderOfMagnitude(n) {
	var order = Math.floor(Math.log(n) / Math.LN10
			+ 0.000000001); // because float math sucks like that
	return Math.pow(10,order);
}

function sortByKeys(elements){
	return Object.keys(elements).sort( function(keyA, keyB) {
		return elements[keyA].order - elements[keyB].order;
	});
}

function sortWeights(a, b){
	if(a.weight < b.weight)
		return -1;
	else if(a.weight > b.weight)
		return 1;
	return 0;
}
