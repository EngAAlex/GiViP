var ChordDiagram = (function(){

	var hWidth;
	var hHeight;

	var iUpdatedGroups;
	var completeGroups = [];
	var newCompleteGroups = [];

	//LAST CHORD
	var lastChord;

	var currentData;
	var currentNoOfElements;
	var oldSelfWeights = {};
	var oldMaxSelfWeight;	
	var totalWeights;
	var sortedTotalWeights;

	var arcs = [];
	var radii = [];
	var matrix;
	var totalTraffic;
	var tempAngleFill;

	var padAngle = 0.03;

	var chordGirth = 30;

	//LOCAL INDICES -- USED ALSO TO MODIFY THE CIRCULAR ORDER OF THE ELEMENTS

	var localIndices;
	var reverseLocalIndices;

	var noDataDisplayed;
	var sameExtent;
	var validEdges;

	var minRibbonExtent = 0.003;

	var initialOrdering;
	var inverseInitialOrdering;

	var currentScope = "messages";

	var edgeValues = {messages: "messagesExchanged", bytes: "size"};

	//ARCS & RIBBONS
	var arc;
	var ribbon;

	function baseLevelInfo(d, updatedGroups){
		var desc = "";
		if(d.index%2 == 0)
			desc = "Incoming messages";
		else
			desc = "Outgoing messages";
		return "<strong>" + d.desc + ":</strong> <span style='color:red'>" + reverseLocalIndices[correctIndex(d.index)] + "</span><br /><strong>"+desc+":</strong> <span style='color:red'>" + updatedGroups[d.index].value + "</span>"  + "</span><br /><strong>Self Traffic:</strong><span style='color:red'>" + updatedGroups[d.index][selfMessagesScales["messages"]] + "</span>";		
//		return "<strong>" + d.desc + ":</strong> <span style='color:red'>" + reverseLocalIndices[correctIndex(d.index)] + "</span><br /><strong>"+desc+":</strong> <span style='color:red'>" + d.value + "</span>"  + "</span><br /><strong>Self Traffic:</strong><span style='color:red'>" + d[selfMessagesScales["messages"]] + "</span>";		
	}

	function ribbonInfo(d){
		return "<strong>Messages:</strong> <span style='color:red'>" + d.source.value + "</span><br /><strong>Sender:</strong> <span style='color:red'>" + reverseLocalIndices[correctIndex(d.source.index)] + "</span> to <span style='color:red'>" + reverseLocalIndices[correctIndex(d.target.index)];		
	}

	function outerRingInfo(d){
		return "<strong>" + d.desc + ":</strong> <span style='color:red'>" + d.elementIndex + "</span><br /><strong>Traffic:</strong> <span style='color:red'>" + (d[messagesScales[currentScope]][0] + d[messagesScales[currentScope]][1] + d[selfMessagesScales[currentScope]])  + "</span>";
	}

	function hidePointerInfo(){
		$('#pointerPanelDefault').show();
		$('#pointerPanel').empty().hide();			
	}

	var formatValue = d3.formatPrefix(",.0", 1e3);

	var minByStartAngle = function (d){return d.startAngle; };
	var maxByEndAngle = function (d){return d.endAngle; };

	function correctIndex(i){
		return (i - i%2)/2;
	}

	function reverseCorrectIndex(i){
		return i*2;
	}

	function ribbonLayout(chords){
		if(chords == undefined)
			return [];
		chords = specificBubbleSort(bubbleSortChordsBySource(chords));
		var tmpTargets = [];
		for(i=0; i<chords.length; i++){
			//SOURCE TRANSLATION AND SIZING
			var current = chords[i];
			ribbonSizingAndTranslation(chords.groups, current.source, current.source.index, tempAngleFill);
			//TARGET TRANSLATION AND SIZING
			current.target.value = current.source.value;
			tmpTargets[tmpTargets.length] = current.target;
			current.source.elementIndex = reverseLocalIndices[correctIndex(current.source.index)];
			current.target.elementIndex = reverseLocalIndices[correctIndex(current.target.index)];			
			//ribbonSizingAndTranslation(current.target, current.target.subindex,1);
		}
		tmpTargets = bubbleSortChordsByTarget(tmpTargets)
		tmpTargets = specificBubbleSortForTargets(tmpTargets);
		for(i=0; i<tmpTargets.length; i++){
			current = tmpTargets[i];
			ribbonSizingAndTranslation(chords.groups, current, current.index, tempAngleFill);  
		}
		return chords;
	}

	function chordsLayout(chords, sameExtent){
		for(i=0; i<chords.groups.length; i++)
			tempAngleFill[i] = 0;

		var traffics = [];
		var emptyChords = 0;

		var updatedGroups = chords.groups;

		var availableArea = 2*Math.PI;
		var currentTotalTraffic = totalTraffic;
		if(sameExtent)
			var sameExtentValue = availableArea / (updatedGroups.length);
		else
			for(i=0; i<updatedGroups.length; i += 2){

				var incomingTraffic = 0;
				for(j=1; j<matrix.length; j += 2){
					if(i != j)
						incomingTraffic += matrix[j][i];
				}
				traffics[i] = incomingTraffic;
				var sum = incomingTraffic + updatedGroups[i+1].value; 
				if(sum/totalTraffic*availableArea < 2*padAngle)
					currentTotalTraffic -= sum;
			}	

		for(i=0; i<updatedGroups.length; i += 2){
			var sM = superstepBlocks[scales[currentScale]][currentSuperstep]
			.blockElementDetails[indexInBlockMap[reverseLocalIndices[correctIndex(i)]]].selfMessages;
			var sB = superstepBlocks[scales[currentScale]][currentSuperstep]
			.blockElementDetails[indexInBlockMap[reverseLocalIndices[correctIndex(i)]]].selfBytes; 

			updatedGroups[i].elementIndex = reverseLocalIndices[correctIndex(i)];
			updatedGroups[i+1].elementIndex = reverseLocalIndices[correctIndex(i)];		
			updatedGroups[i].desc = scales[currentScale][0].toUpperCase() + scales[currentScale].substring(1);
			updatedGroups[i+1].desc = scales[currentScale][0].toUpperCase() + scales[currentScale].substring(1);
			updatedGroups[i].selfMessages = sM;
			updatedGroups[i+1].selfMessages = sM;
			updatedGroups[i].selfBytes = sB;
			updatedGroups[i+1].selfBytes = sB;		

			if(sameExtent){
				updatedGroups[i].endAngle = updatedGroups[i].startAngle + sameExtentValue;
				updatedGroups[i+1].startAngle = updatedGroups[i].endAngle;
				updatedGroups[i+1].endAngle = updatedGroups[i+1].startAngle + sameExtentValue;
				if(i + 2 < matrix.length)
					updatedGroups[i + 2].startAngle = updatedGroups[i+1].endAngle;					
			}else{
				updatedGroups[i].value = traffics[i];
				var sum = traffics[i] + updatedGroups[i+1].value;
				var extent = availableArea*(sum/totalTraffic);
				totalWeights[updatedGroups[i].elementIndex] = sum;

				if(extent < 2*padAngle){
					updatedGroups[i].endAngle = updatedGroups[i].startAngle + 0.00001;
					updatedGroups[i+1].startAngle = updatedGroups[i].endAngle;
					updatedGroups[i+1].endAngle = updatedGroups[i+1].startAngle + 0.00001;
					if(i + 2 < matrix.length)
						updatedGroups[i + 2].startAngle = updatedGroups[i+1].endAngle;						
				}else{
//					if(i == 0)
//					updatedGroups[i].startAngle = padAngle/4;
					extent = availableArea*(sum/currentTotalTraffic) - padAngle/2;
					var inextent = extent*(traffics[i]/sum);
					var outextent = extent*(updatedGroups[i+1].value/sum);						
					updatedGroups[i].endAngle = updatedGroups[i].startAngle + inextent;
					updatedGroups[i+1].startAngle = updatedGroups[i].endAngle;
					updatedGroups[i+1].endAngle = updatedGroups[i+1].startAngle + outextent;

					if(i + 2 < matrix.length)
						updatedGroups[i + 2].startAngle = updatedGroups[i+1].endAngle + padAngle/2;
				}
			}
			newCompleteGroups[0][updatedGroups[i].elementIndex] = {};				
			newCompleteGroups[0][updatedGroups[i].elementIndex].startAngle = updatedGroups[i].startAngle;				
			newCompleteGroups[0][updatedGroups[i].elementIndex].endAngle = updatedGroups[i+1].endAngle;				

		}
		chords.groups = updatedGroups;
		iUpdatedGroups = updatedGroups;
//		completeGroups[0] = updatedGroups;
		return updatedGroups;
	}

	function ribbonSizingAndTranslation(updatedGroups, currentElement, currentIndex, tempAngleFill){
		var extent = (updatedGroups[currentIndex].endAngle - updatedGroups[currentIndex].startAngle)*(currentElement.value/updatedGroups[currentIndex].value);//currentSource.endAngle - currentSource.startAngle;
		if(extent < minRibbonExtent)
			extent = minRibbonExtent;
		currentElement.startAngle = updatedGroups[currentIndex].startAngle + tempAngleFill[currentIndex];
		currentElement.endAngle = currentElement.startAngle + extent;
		tempAngleFill[currentIndex] += extent;
	}

	function storeOuterRingArc(d, scale, level, startAngle, endAngle){
//		completeGroups[level][completeGroups[level].length] = d;
		newCompleteGroups[level][d.elementIndex] = {};
		newCompleteGroups[level][d.elementIndex].startAngle = startAngle;
		newCompleteGroups[level][d.elementIndex].endAngle = endAngle;
		d.desc = scales[scale]
//		return arcs[level].startAngle(startAngle).endAngle(endAngle)();
	}

	function computeInternalIndices(scale){
		var currentIndex = 0;
		localIndices = {};
		reverseLocalIndices = [];

		for(rackIndex in jobInfo.racklist){
			var rack = jobInfo.racklist[rackIndex];
			if(scale == "rack"){
				if(storeIndex(rack, currentIndex))
					currentIndex++;
			}else{
				for(hostIndex in rack.children){
					var host = rack.children[hostIndex];
					if(scale == "host"){
						if(storeIndex(host, currentIndex))
							currentIndex++;						
					}else{
						for(w in host.children){
							var worker = host.children[w];
							if(storeIndex(worker, currentIndex))
								currentIndex++;
						}
					}
				}
			}
		}

	}

	function storeIndex(item, currentIndex){
		if(hiddenElements[item.id])
			return false;
		else{
			localIndices[item.id] = currentIndex;
			reverseLocalIndices[currentIndex] = item.id;
			return true;
		}
	}

	function matrixFromElements(edges){
		validEdges = 0;
		var matrix = [];
		for(i=0; i<reverseLocalIndices.length*2; i += 2){
			matrix[i] = [];
			matrix[i+1] = [];
			for(t=0; t<reverseLocalIndices.length*2; t += 2){
				matrix[i][t] = 0;
				matrix[i][t + 1] = 0;
				matrix[i+1][t] = 0;
				matrix[i+1][t + 1] = 0;			
			}
		}
		for(i in edges){
			var e = edges[i];
			if(e[edgeValues[currentScope]] == 0 || hiddenElements[e.source] || hiddenElements[e.target])
				continue;	
			validEdges++;
			var sourceIndex = reverseCorrectIndex(localIndices[e.source]);
			var targetIndex = reverseCorrectIndex(localIndices[e.target]);
			switch(messagesScales[currentScope]){
			case "totalTrafficMessages": matrix[sourceIndex + 1][targetIndex] = e.messagesExchanged; break;
			case "totalTrafficBytes": matrix[sourceIndex + 1][targetIndex] = e.size; break;
			}
		}
		return matrix;
	}

//	Returns an array of tick angles and values for a given group and step.
	function groupTicks(d, step) {
		var k = (d.endAngle - d.startAngle) / d.value;
		return d3.range(0, d.value, step).map(function(value) {
			return {value: value, angle: value * k + d.startAngle};
		});
	}

	function groupTicksForOuterRings(d, step, scale, level){
		var startAngle = getAngleForElement(d, scale, level, true);
		var endAngle = getAngleForElement(d, scale, level, false);
		var k = (endAngle - startAngle) / d.value;
		return d3.range(0, d.value, step).map(function(value) {
			return {value: value, angle: value * k + startAngle};
		});
	}

	function getAngleForElement(element, scale, level, isStart, array = completeGroups){

		if(isStart)
			return d3.min(simplifiedHierarchy[scales[scale]][element.elementIndex].children, function(d){
				if(!hiddenElements[d.id])
					return array[level - 1][d.id].startAngle;
			});
		else
			return d3.max(simplifiedHierarchy[scales[scale]][element.elementIndex].children, function(d){
				if(!hiddenElements[d.id])				
					return array[level - 1][d.id].endAngle;
			});

	}

//	THE FOLLOWING METHODS SHOULD BE MERGED INTO ONE

	function bubbleSortChordsBySource(chords){
		var bubbled = true;
		while(bubbled){
			bubbled = false;
			for(i=0; i<chords.length-1; i++)
				if(chords[i].source.index > chords[i+1].source.index){
					var tmp = chords[i];
					chords[i] = chords[i+1];
					chords[i+1] = tmp;
					bubbled = true;
				}
		}
		return chords;
	}

	function specificBubbleSort(chords){
		var bubbled = true;
		while(bubbled){
			bubbled = false;
			for(i=0; i<chords.length-1; i++)
				if(chords[i].source.index == chords[i+1].source.index){
					var ci = correctIndex(chords[i].source.index);
					var cst = correctIndex(chords[i].source.subindex);
					var operator;
					if(cst > ci)
						operator = chords[i].source.subindex < chords[i+1].source.subindex;
					else
						if(correctIndex(chords[i+1].source.subindex) < ci)
							operator = chords[i].source.subindex < chords[i+1].source.subindex;
						else{
							continue;
						}
					if(operator){
						var tmp = chords[i];
						chords[i] = chords[i+1];
						chords[i+1] = tmp;
						bubbled = true;
					}
				}
		}
		return chords;
	}

	function bubbleSortChordsByTarget(chords){
		var bubbled = true;
		while(bubbled){
			bubbled = false;
			for(i=0; i<chords.length-1; i++)
				if(chords[i].index > chords[i+1].index){
					var tmp = chords[i];
					chords[i] = chords[i+1];
					chords[i+1] = tmp;
					bubbled = true;
				}
		}
		return chords;
	}

	function specificBubbleSortForTargets(igi){
		var bubbled = true;
		while(bubbled){
			bubbled = false;
			for(i=0; i<igi.length-1; i++)
				if(igi[i].index == igi[i+1].index){
					var ci = correctIndex(igi[i].subindex);
					var cst = correctIndex(igi[i].index);
					var operator;
					if(cst < ci)
						operator = igi[i].subindex < igi[i+1].subindex;
					else
						if(correctIndex(igi[i+1].subindex) < cst)
							operator = igi[i].subindex < igi[i+1].subindex;
						else{
							continue;
						}
					if(operator){
						var tmp = igi[i];
						igi[i] = igi[i+1];
						igi[i+1] = tmp;
						bubbled = true;
					}
				}
		}
		return igi;
	}

	function updateFrameDependencies(){	

		var svg = d3.select("#chordDiagramSvg svg");

		var width = svg.attr("width"),
		height = svg.attr("height") - 50,
		outerRadius = Math.min(width, height) * 0.4,
		innerRadius = outerRadius - chordGirth,
		midInnerRadius = outerRadius + outerRadius*0.09,
		midOuterRadius = midInnerRadius + 25,
		maxInnerRadius = midOuterRadius + midOuterRadius*0.02,
		maxOuterRadius = maxInnerRadius + 10;

		arcs[1] = d3.arc()
		.innerRadius(midInnerRadius)
		.outerRadius(midOuterRadius);

		arcs[2] = d3.arc()
		.innerRadius(maxInnerRadius)
		.outerRadius(maxOuterRadius);

		radii[0] = [];
		radii[1] = [];
		radii[2] = [];
		radii[2][0] = maxInnerRadius;
		radii[2][1] = maxOuterRadius;
		radii[1][0] = midInnerRadius;
		radii[1][1] = midOuterRadius;
		radii[0][0] = innerRadius;
		radii[0][1] = outerRadius;

		svg.append('circle').attr('id', 'tipfollowscursor');   /* .attr('r',5) /*  to debug */

		arc = d3.arc()
		.innerRadius(radii[0][0]);

		ribbon = d3.ribbon()
		.radius(radii[0][0]);

//		svg.call(baseLevelTip);
//		svg.call(ribbonTip);
//		svg.call(outerRingTip);
	}	

	//ANIMATION UTILS
	function arcTween(oldGroups, tOldSelfWeights, tOldMaxSelfWeight, newSelfWeights, newMaxSelfWeight) {

		var oldChords = {};
		var oldStartAngles = [];
		var oldEndAngles = [];

		if (oldGroups) {
			oldGroups.forEach( function(chordData) {
				oldChords[ arcKey(chordData) ] = chordData;
			});
		}

		oldGroups.forEach(function(item, index){
			if(index%2 == 0){
				oldStartAngles[item.elementIndex] = [];
				oldEndAngles[item.elementIndex] = [];
			}

			oldStartAngles[item.elementIndex][index%2] = item.startAngle;
			oldEndAngles[item.elementIndex][index%2] = item.endAngle;			
		});

		return function(d,i) {

			var oldGirth;

			var newGirth = computeArcGirth(newSelfWeights[d.elementIndex], newMaxSelfWeight);

			if(oldStartAngles[d.elementIndex] != undefined && oldEndAngles[d.elementIndex] != undefined){//oldChords[ arcKey(d) ] != undefined &&  oldGroups[i] != undefined){
				oldStartAngle = oldStartAngles[d.elementIndex][i%2];
				oldEndAngle = oldEndAngles[d.elementIndex][i%2];
				oldGirth = computeArcGirth(tOldSelfWeights[d.elementIndex], tOldMaxSelfWeight);
			}else{
				oldStartAngle = d.startAngle;
				oldEndAngle = d.endAngle;
				oldGirth = newGirth;
			}

			var interpolateStart = d3.interpolate(oldStartAngle, d.startAngle);
			var interpolateEnd = d3.interpolate(oldEndAngle, d.endAngle);

			var interpolateGirth = d3.interpolate(oldGirth, newGirth);

			return function(t) {
				return arc.startAngle(interpolateStart(t)).endAngle(interpolateEnd(t)).outerRadius(interpolateGirth(t))();
			}
		}
	}

	function externalArcTween(tOldCompleteGroups, level, scale){

		return function (d, i) {

			var tween;
			var startAngle, oldStartAngle;
			var endAngle, oldEndAngle;

			startAngle = getAngleForElement(d, scale, level, true, newCompleteGroups);
			endAngle = getAngleForElement(d, scale, level, false, newCompleteGroups);

			if (tOldCompleteGroups[level][ d.elementIndex ] && tOldCompleteGroups[level - 1][d.id] != undefined) {

				oldStartAngle = getAngleForElement(d, scale, level, true, tOldCompleteGroups);
				oldEndAngle = getAngleForElement(d, scale, level, false, tOldCompleteGroups);

			}
			else {

				oldStartAngle = startAngle;
				oldEndAngle = endAngle;		

			}

			storeOuterRingArc(d, scale, level, startAngle, endAngle);

			var interpolateStart = d3.interpolate(oldStartAngle, startAngle);
			var interpolateEnd = d3.interpolate(oldEndAngle, endAngle);

			return function(t){
				return arcs[level].startAngle(interpolateStart(t)).endAngle(interpolateEnd(t))();
			}

		}

	}

	function chordKey(data){
		return data.source.elementIndex+"%"+data.target.elementIndex;
	}

	function arcKey(data){
		var suffix = data.index%2 == 0 ? "IN" : "OUT";
		return data.elementIndex + "%" + suffix;
	}

	function chordTween(oldLayout) {
		//this function will be called once per update cycle

		//Create a key:value version of the old layout's chords array
		//so we can easily find the matching chord 
		//(which may not have a matching index)

		var oldChords = {};

		if (oldLayout) {
			oldLayout.forEach( function(chordData) {
				oldChords[ chordKey(chordData) ] = chordData;
			});
		}

		return function (d, i) {
			//this function will be called for each active chord

			var tween;
			var old = oldChords[ chordKey(d) ];
			if (old) {
				//old is not undefined, i.e.
				//there is a matching old chord value

				//check whether source and target have been switched:
				if (d.source.index != old.source.index ){
					//swap source and target to match the new data
					old = {
							source: old.target,
							target: old.source
					};
				}

				tween = d3.interpolate(old, d);
			}
			else {
				//create a zero-width chord object
				var emptyChord = {
						source: { startAngle: d.source.startAngle,
							endAngle: d.source.startAngle},
							target: { startAngle: d.target.startAngle,
								endAngle: d.target.startAngle}
				};
				tween = d3.interpolate( emptyChord, d );
			}

			return function (t) {
				//this function calculates the intermediary shapes
				return ribbon(tween(t));
			};
		};
	}

//	function chordTween(chord) {
//	return function(d,i) {
//	var i = d3.interpolate(chord.chords[i], d);

//	return function(t) {
//	return chordl(i(t));
//	}
//	}
//	}

	function computeArcGirth(currentSelfWeight, maxSelfWeight){
		if(currentSelfWeight == 0)
			return radii[0][0] + 10;
		else
			return radii[0][0] + 5 + chordGirth*(currentSelfWeight/maxSelfWeight);
	}

	return {

		resize: function(){
			var svg = d3.select("#chordDiagramSvg svg");

			hWidth = d3.select("#chordDiagramSvg").node().getBoundingClientRect().width;
			hHeight = d3.select("#chordDiagramSvg").node().getBoundingClientRect().height;

			svg.attr("width", hWidth).attr("height", hHeight);

			updateFrameDependencies();

		},

		setUpChordDiagram: function(){

			hWidth = d3.select("#chordDiagramSvg").node().getBoundingClientRect().width;
			hHeight = d3.select("#chordDiagramSvg").node().getBoundingClientRect().height;

			var svg = d3.select("#chordDiagramSvg").append("svg")
			.attr("width", hWidth).attr("height", hHeight);

			updateFrameDependencies();

		},

		displayNoData: function(opacity){
			noDataDisplayed = true;

			var svg = d3.select("#chordDiagramSvg").select("svg");

			svg.append("g")
			.attr("id", "no-data-text")
			.attr("transform","translate(" + (hWidth/2 - 40) + ", " + hHeight/2 + ")")
			.append("text")
			.attr("anchor-point", "middle")
			.text("No edges to display")
			.attr("opacity", opacity);

		},

		animate: function(){

			d3.select("#no-data-text").remove();

			var elements = superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails;
			var edges = superstepBlocks[scales[currentScale]][currentSuperstep].edges;

			sameExtent = false;
			var selfWeights = {};
			totalWeights = {};
			var maxSelfWeight = 0;

			if(noDataDisplayed){
				this.clear();
				renderChordDiagram(0);
				d3.select('#chordDiagramSvg svg')
				.transition()
				.duration(transitionTime)
				.attr("opacity", 1);

				return;
			}

			newCompleteGroups = [];

			var svg = d3.select("#chordDiagramSvg").select("svg");
//			completeGroups[0] = {};

			newCompleteGroups[0] = {};

			computeInternalIndices(scales[currentScale]);

			matrix = matrixFromElements(edges);

//			if(validEdges == 0)
//			sameExtent = true;

//			currentNoOfElements = noOfElements;
			currentData = edges;

			$.each(elements, function(index, item){
				selfWeights[item.elementIndex] = item[selfMessagesScales[currentScope]];
				maxSelfWeight = Math.max(maxSelfWeight, item[selfMessagesScales[currentScope]]);
			});

			totalTraffic = 0;

			for(t = 1; t<matrix.length; t += 2){
				for(z = 0; z<matrix.length; z += 2)
					if(t!=z){
						totalTraffic += matrix[t][z];
					}
			}

			totalTraffic*=2;

			var chord;

			if(reverseLocalIndices.length < 2 || validEdges == 0){
//				chord = [];
//				chord.groups = [];
				this.displayNoData(0);

				d3.select('#no-data-text text')
				.attr("opacity", 0)				
				.transition()
				.duration(transitionTime)
				.attr("opacity", 1);
				d3.select('#chordDiagramSvg .container')
				.attr("opacity", 1)				
				.transition()
				.duration(transitionTime)
				.attr("opacity", 0);

				level = 1;
				for(var t = currentScale + 1; t < scales.length; t++){
					d3.select('#chordDiagramSvg .outerRing-' + level)
					.attr("opacity", 1)					
					.transition()
					.duration(transitionTime)
					.attr("opacity", 0);
					level++;
				}

				return;
			}else
				chord = d3.chord()(matrix);

			updatedGroups = chordsLayout(chord, sameExtent); 
			var rl = ribbonLayout(chord);

			// update arcs
			svg.select(".container")
			.datum(chord);

			var groups = svg
			.select(".groups")
			.selectAll("path")
			.data(updatedGroups, arcKey);

			var newGroups = 
<<<<<<< HEAD
				groups.enter()//.append("g")
				.append("path")
=======
				groups.append("path")
>>>>>>> refs/remotes/origin/Development
				.attr("class", "arc")
				.attr("id", function(d){ return dotExcaper("chord%"+d.elementIndex);})
				.style("stroke", function(d) { return d3.color(colorOfElement(scales[currentScale], d.elementIndex)).darker(); })
<<<<<<< HEAD
				.attr("opacity", "0")
				.attr("d", d3.arc().innerRadius(radii[0][0]).outerRadius(function(d){
					var currentSelfWeight = selfWeights[reverseLocalIndices[correctIndex(d.index)]];
					return computeArcGirth(currentSelfWeight, maxSelfWeight);
=======
				.attr("opacity", "0");
				/*.on('mouseover', null)
				.on('mouseover',
						function (d) {
					$('#pointerPanelDefault').hide();
					$('#pointerPanel').html(
							baseLevelInfo(d)
					);
					$('#pointerPanel').show();
					higlightElements(dotExcaper(d.elementIndex));
>>>>>>> refs/remotes/origin/Development
				})
<<<<<<< HEAD
				)
				.style("background-repeat", "repeat")
				.attr("fill", function(d){
					if(d.index%2 == 0)
						return "url(#crosshatch-" + d.elementIndex + ")";
					else
						return colorOfElement(scales[currentScale], d.elementIndex)})				
						.on('mouseover',
								function (d) {
							$('#pointerPanelDefault').hide();
							$('#pointerPanel').html(
									baseLevelInfo(d)
							);
							$('#pointerPanel').show();
							higlightElements(dotExcaper(d.elementIndex));
						})
						.on('mouseleave', function(d){
							hidePointerInfo();
							higlightElements();
						});//baseLevelTip.hide)		
=======
				.on('mouseleave', function(d){
					hidePointerInfo();
					higlightElements();
				});//baseLevelTip.hide)*/								
>>>>>>> refs/remotes/origin/Development

			//update chords
			var chords = svg.select(".ribbons")
			.selectAll("path")
			.data(rl, chordKey);

			var newChords = 
				chords.enter()
				.insert("path")
				.attr("id", function(d){
					var root  = "ribbon%";
					return root += reverseLocalIndices[correctIndex(d.source.index)];				
				})
				.attr("d", ribbon)
				.style("fill", function(d) {return colorOfElement(scales[currentScale], reverseLocalIndices[correctIndex(d.source.index)]); })
				.style("stroke", function(d) {return d3.rgb(colorOfElement(scales[currentScale], reverseLocalIndices[correctIndex(d.source.index)])).darker(); })//;
				.attr("opacity", "0")
				.on('mousemove',/*tip.show*/
						function (d) {
					$('#pointerPanelDefault').hide();
					$('#pointerPanel').html(
							ribbonInfo(d)
					);
					$('#pointerPanel').show();	
					higlightElements(d.elementIndex);				
				})
				.on('mouseleave', function(d){
					hidePointerInfo();
					higlightElements();
				});//ribbonTip.hide);					

			var tOldSelfWeights = oldSelfWeights;
			var tOldMaxSelfWeight = oldMaxSelfWeight; 

			//COMPUTE ANIMATION FOR OUTER RINGS
			var level = 1;
			var newOuterArcs = [];
			var outerArcs = [];			
			for(var scale = currentScale + 1; scale < scales.length; scale++){
				var originalElements = superstepBlocks[scales[scale]][currentSuperstep].blockElementDetails;

				var elements = [];

				if(!noDataDisplayed)
					for(var t=0; t<originalElements.length; t++)
						if(!hiddenElements[originalElements[t].elementIndex])
							elements[elements.length] = originalElements[t];

				newCompleteGroups[level] = {};

				var out = svg.select(".outerRing-" + level)
				.selectAll("path")
				.data(elements, function(data) {return data.elementIndex;} );

				var currentAddedArcs = 
					out.enter()
<<<<<<< HEAD
					.append("path")
					.attr("id", function(d){return dotExcaper("chord%"+d.elementIndex);})
					.attr("d", function(d){
						var startAngle = getAngleForElement(d, scale, level, true, newCompleteGroups);
						var endAngle = getAngleForElement(d, scale, level, false, newCompleteGroups);
						storeOuterRingArc(d, scale, level, startAngle, endAngle);
						return arcs[level].startAngle(startAngle).endAngle(endAngle)();
					})
					.style("stroke", function(d) { return d3.rgb(colorOfElement(scales[scale], d.elementIndex)).darker(); })
					.attr("fill", function(d){ return colorOfElement(scales[scale], d.elementIndex); })
					.attr("opacity", 0)			
					.on('mousemove',/*tip.show*/
=======
					.append("g");
					/*.on('mousemove',/*tip.show
>>>>>>> refs/remotes/origin/Development
							function (d) {
						$('#pointerPanelDefault').hide();
						$('#pointerPanel').html(
								outerRingInfo(d)	
						);
						$('#pointerPanel').show();
						higlightElements(dotExcaper(d.elementIndex));					
					})
					.on('mouseleave', function(d){hidePointerInfo(); higlightElements();}); */


				newOuterArcs[level] = currentAddedArcs;
				outerArcs[level] = out;

				level++;

			}

			//SAVE LAST STATE

			var tOldCompleteGroups = [];
//			var specificGroups = [];

			for(var i=0; i<completeGroups.length; i++)
				tOldCompleteGroups[i] = completeGroups[i];

//			for(var i=0; i<lastChord.length; i++)
//			specificGroups[i] = lastChord.groups[i];

			//ANIMATE CORE

			chords.exit()
			.attr("opacity", 1)
			.transition()
			.duration(transitionTime)
			.attr("opacity", 0)
			.remove();

			groups
			.transition()
			.duration(transitionTime)
			.attrTween("d", arcTween(lastChord.groups, tOldSelfWeights, tOldMaxSelfWeight, selfWeights, maxSelfWeight));			

			groups.exit()
			.attr("opacity", 1)
			.transition()
			.duration(transitionTime)
			.attr("opacity", 0)
			.remove();

			groups
			.transition()
			.duration(transitionTime)
			.attrTween("d", arcTween(lastChord.groups, tOldSelfWeights, tOldMaxSelfWeight, selfWeights, maxSelfWeight));

			newGroups
			.attr("opacity", 0)
			.transition()
			.duration(transitionTime)
			.attr("opacity", 1);

			chords
			.transition()
			.duration(transitionTime)
			.attrTween("d", chordTween(lastChord));

			newChords
			.attr("opacity", 0)		
			.transition()
			.duration(transitionTime)
			.attr("opacity", 1);	

			//ANIMATE OUTER RINGS

			level = 1;
			for(var t = currentScale + 1; t < scales.length; t++){
				newOuterArcs[level].transition()
				.attr("opacity" , 0)
				.duration(transitionTime)
				.attr("opacity", 1);

				outerArcs[level]
				.attr("opacity", 1)			
				.transition()
				.duration(transitionTime)
				.attrTween("d", externalArcTween(tOldCompleteGroups, level, t));

				outerArcs[level]
				.exit()
				.attr("opacity", 1)
				.transition()
				.duration(transitionTime)
				.attr("opacity", 0)
				.remove();

				level++;
			}		

			lastChord = chord;
			oldSelfWeights = selfWeights;
			oldMaxSelfWeight = maxSelfWeight; 
			sortedTotalWeights = sortByKeys(totalWeights);

			completeGroups[0] = newCompleteGroups[0];
			level = 1;
			for(var t = currentScale + 1; t < scales.length; t++){
				completeGroups[level] = newCompleteGroups[level];
			}

		},		

		plotCore: function(opacity = 1){

			var elements = superstepBlocks[scales[currentScale]][currentSuperstep].blockElementDetails;
			var edges = superstepBlocks[scales[currentScale]][currentSuperstep].edges;

			sameExtent = false;
			var selfWeights = {};
			totalWeights = {};
			var maxSelfWeight = 0;
			noDataDisplayed = false;

			var svg = d3.select("#chordDiagramSvg").select("svg").attr("opacity", opacity);

			newCompleteGroups[0] = {};

			computeInternalIndices(scales[currentScale]);

			matrix = matrixFromElements(edges);

//			if(validEdges == 0)
//			sameExtent = true;

//			currentNoOfElements = noOfElements;
			currentData = edges;

			$.each(elements, function(index, item){
				selfWeights[item.elementIndex] = item[selfMessagesScales[currentScope]];
				maxSelfWeight = Math.max(maxSelfWeight, item[selfMessagesScales[currentScope]]);
			});

			totalTraffic = 0;

			for(t = 1; t<matrix.length; t += 2){
				for(z = 0; z<matrix.length; z += 2)
					if(t!=z){
						totalTraffic += matrix[t][z];
					}
			}

			totalTraffic*=2;

			var chord;

			if(reverseLocalIndices.length < 2 || validEdges == 0){
				this.displayNoData(1);
//				chord = [];
//				chord.groups = [];
				return;
			}else
				chord = d3.chord()(matrix);

			lastChord = chord;
			oldSelfWeights = selfWeights;
			oldMaxSelfWeight = maxSelfWeight;

			var defs = svg.append("svg:defs");

			var pattern = defs.selectAll("pattern")
			.data(elements)
			.enter().append("svg:pattern")
			.attr("id", function(d, i){return "crosshatch-"+d.elementIndex;})
			.attr("width", 8)
			.attr("height", 8)
			.attr("patternUnits", "userSpaceOnUse");

			pattern.append("svg:pattern")
			.attr("id", function(d, i){return "crosshatch-transparent";})
			.attr("width", 8)
			.attr("height", 8)
			.attr("patternUnits", "userSpaceOnUse");

			pattern.append("svg:rect")
			.attr("width", 8)
			.attr("height", 8)
			.attr("fill", function(d,i){return colorOfElement(scales[currentScale], d.elementIndex);});

			pattern.append("svg:image")
			.attr("width", 8)
			.attr("height", 8)
			.attr("xlink:href", "../dist/media/somepattern.gif");

			pattern.append("svg:pattern")
			.attr("id", function(d, i){return "crosshatch-transparent";})
			.attr("width", 8)
			.attr("height", 8)
			.attr("patternUnits", "userSpaceOnUse");		

			var g = svg.append("g")
			.attr("class", "container")
			.attr("transform", "translate(" + svg.attr("width") / 2 + "," + (svg.attr("height") / 2 - 6) + ")")
			.datum(lastChord);

			g.append("g")
			.attr("class", "groups");				

			g.append("g")
			.attr("class", "ribbons");			

			var updatedGroups;
			tempAngleFill = [];

			var group = svg.select("g.groups")//			.selectAll("g")
			.selectAll("path")
			.data(function(chords) {
				if(chords == undefined)
					updatedGroups = [];
				else
					updatedGroups = chordsLayout(chords, sameExtent); 
				return updatedGroups;
			}, arcKey)
<<<<<<< HEAD
			.enter().append("path")
=======
			.enter().append("g")
			.on('mouseover',
					function (d) {
				$('#pointerPanelDefault').hide();
				$('#pointerPanel').html(
						baseLevelInfo(d, iUpdatedGroups)
				);
				$('#pointerPanel').show();
				higlightElements(dotExcaper(d.elementIndex));
			})
			.on('mouseleave', function(d){
				hidePointerInfo();
				higlightElements();
			});//baseLevelTip.hide);

			group.append("path")
>>>>>>> refs/remotes/origin/Development
			.attr("class", "arc")
			.attr("id", function(d){ return dotExcaper("chord%"+d.elementIndex);})
			.style("stroke", function(d) { return d3.color(colorOfElement(scales[currentScale], d.elementIndex)).darker(); })
			.attr("d", d3.arc().innerRadius(radii[0][0]).outerRadius(function(d){
				var currentSelfWeight = selfWeights[reverseLocalIndices[correctIndex(d.index)]];
				return computeArcGirth(currentSelfWeight, maxSelfWeight);
			})
			)
			.style("background-repeat", "repeat")
			.attr("fill", function(d){
				if(d.index%2 == 0)
					return "url(#crosshatch-" + d.elementIndex + ")";
				else
					return colorOfElement(scales[currentScale], d.elementIndex)})//;			
					.on('mouseover',
							function (d) {
						$('#pointerPanelDefault').hide();
						$('#pointerPanel').html(
								baseLevelInfo(d)
						);
						$('#pointerPanel').show();
						higlightElements(dotExcaper(d.elementIndex));
					})
					.on('mouseleave', function(d){
						hidePointerInfo();
						higlightElements();
					});//baseLevelTip.hide);

			/*group.append("path")
			.attr("class", "arc")
			.attr("id", function(d){ return dotExcaper("chord%"+d.elementIndex);})
			.style("stroke", function(d) { return d3.color(colorOfElement(scales[currentScale], d.elementIndex)).darker(); })
			.attr("d", d3.arc().innerRadius(radii[0][0]).outerRadius(function(d){
				var currentSelfWeight = selfWeights[reverseLocalIndices[correctIndex(d.index)]];
				return computeArcGirth(currentSelfWeight, maxSelfWeight);
			})
			)
			.style("background-repeat", "repeat")
			.attr("fill", function(d){
				if(d.index%2 == 0)
					return "url(#crosshatch-" + d.elementIndex + ")";
				else
					return colorOfElement(scales[currentScale], d.elementIndex)});*/

			svg.select("g.ribbons")
			.selectAll("path")
			.data(ribbonLayout)
			.enter().append("path")
			.attr("id", function(d){
				var root  = "ribbon%";
				return root += reverseLocalIndices[correctIndex(d.source.index)];				
			})
			.attr("d", ribbon)
			.style("fill", function(d) {return colorOfElement(scales[currentScale], reverseLocalIndices[correctIndex(d.source.index)]); })
			.style("stroke", function(d) {return d3.rgb(colorOfElement(scales[currentScale], reverseLocalIndices[correctIndex(d.source.index)])).darker(); })//;
			.on('mousemove',/*tip.show*/
					function (d) {
				$('#pointerPanelDefault').hide();
				$('#pointerPanel').html(
						ribbonInfo(d)
				);
				$('#pointerPanel').show();	
				higlightElements(d.elementIndex);				
			})
			.on('mouseleave', function(d){
				hidePointerInfo();
				higlightElements();
			});//ribbonTip.hide);

			sortedTotalWeights = sortByKeys(totalWeights);

			var gi = svg.append("g");

			gi.append("rect")
			.attr("x", 5)
			.attr("y", 5)
			.attr("width", 20)
			.attr("height", 20)
			.attr("stroke", "black")
			.attr("fill", "transparent");

			gi.append("text")
			.attr("x", 27)
			.attr("y", 20)
			.text("OUT");

			gi.append("text")
			.attr("x", 27)
			.attr("y", 45)
			.text("IN");

			gi.append("rect")
			.attr("x", 5)
			.attr("y", 30)
			.attr("width", 20)
			.attr("height", 20)
			.attr("stroke", "black")
			.attr("fill", "white");

			gi.append("svg:image")
			.attr("x", 6)
			.attr("y", 31)
			.attr("width", 18)
			.attr("height", 18)
			.attr("xlink:href", "../dist/media/somepattern.gif");

			completeGroups[0] = newCompleteGroups[0];

		},

		addOuterScale: function(scale, level){

			var originalElements = superstepBlocks[scales[scale]][currentSuperstep].blockElementDetails;

			var svg = d3.select("#chordDiagramSvg").select("svg");

			var elements = [];
			lastOuterRings = {};

			if(noDataDisplayed)
				elements = [];
			else
				for(var t=0; t<originalElements.length; t++)
					if(!hiddenElements[originalElements[t].elementIndex])
						elements[elements.length] = originalElements[t];

			newCompleteGroups[level] = {};

			var h = svg.append("g")
			.attr("class","outerRing-"+level)
			.attr("transform", "translate(" + hWidth / 2 + "," + (hHeight / 2 - 6) + ")")
			.datum(elements, function(data) {return data.elementIndex;} );

			var addedArcs = h
			.selectAll("path")
			.data(function (arcs){ 
<<<<<<< HEAD
				return arcs; });
=======
				return arcs; })
				.enter().append("g")
				.on('mousemove',/*tip.show*/
						function (d) {
					$('#pointerPanelDefault').hide();
					$('#pointerPanel').html(
							outerRingInfo(superstepBlocks[scales[scale]][currentSuperstep].blockElementDetails[elementToIndex(scales[scale],d.elementIndex)])	
					);
					$('#pointerPanel').show();
					higlightElements(dotExcaper(d.elementIndex));					
				})
				.on('mouseleave', function(d){hidePointerInfo(); higlightElements();}); 
>>>>>>> refs/remotes/origin/Development

			addedArcs.enter().append("path")
			.attr("id", function(d){return dotExcaper("chord%"+d.elementIndex);})
			.attr("d", function(d){
				var startAngle = getAngleForElement(d, scale, level, true, newCompleteGroups);
				var endAngle = getAngleForElement(d, scale, level, false, newCompleteGroups);
				storeOuterRingArc(d, scale, level, startAngle, endAngle);
				return arcs[level].startAngle(startAngle).endAngle(endAngle)();
//				return outerRingArc(d, scale, level, startAngle, endAngle);				
			})
			.style("stroke", function(d) { return d3.rgb(colorOfElement(scales[scale], d.elementIndex)).darker(); })
			.attr("fill", function(d){ return colorOfElement(scales[scale], d.elementIndex); })			
			.on('mousemove',/*tip.show*/
					function (d) {
				$('#pointerPanelDefault').hide();
				$('#pointerPanel').html(
						outerRingInfo(d)	
				);
				$('#pointerPanel').show();
				higlightElements(dotExcaper(d.elementIndex));					
			})
			.on('mouseleave', function(d){hidePointerInfo(); higlightElements();}); 

			completeGroups[level] = newCompleteGroups[level];

		},

		clear: function(){
			$('#chordDiagramSvg svg').empty();
		},

		showTopTraffic: function(top){
			animationLock = true;
			$.each(sortedTotalWeights.slice(top, sortedTotalWeights.length), function(index, item){
				craftEvent("click", $('#treemap-node-'+dotExcaper(item))[0]);
//				d3.select('#treemap-node-'+dotExcaper(item)).node().dispatchEvent(event);				
//				$('#treemap-node-'+dotExcaper(item)).click();
			});
			animationLock = false;

			this.animate();

//			checkElementRemoval(sortedTotalWeights.slice(top, sortedTotalWeights.length), true);
		},

		updateScope: function(newScope){
			currentScope = newScope;
			chordDiagram.animate();
		}

	}

});
