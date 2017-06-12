function reduceCrossing(data){
//	initialOrdering = {};
//	inverseInitialOrdering = {};			
	extents = {};
	var indices = {};

	var supersteps = jobInfo.nsupersteps;

	for(i = 2; i >= 0; i--){
		initialOrdering[scales[i]] = {};
		var currentBatch = data[scales[i]][0].blockElementDetails;
		var currentEdges = data[scales[i]][0].edges;
		var unassignedVertices = currentBatch.length;
		var tempData = {};
//		var tempArray = [];
		var batchSize = currentBatch.length;

		for(var p=0; p<unassignedVertices; p++)
			tempArray[p] = -1;

		//INIT

		for(var t in currentBatch){
			var current = currentBatch[t];
			indices[current.elementIndex] = t;
			tempData[current.elementIndex] = {elementIndex: current.elementIndex, neighbors: {}, uNeighbors: {}, noOfUNeighbors: 0, openEdges: 0};
		}
		for(var t in currentEdges){
			var current = currentEdges[t];	
			tempData[current.source].placed = -1;					
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
			if(lastIndex == -1){
				tempArray[0] = chosen.elementIndex;
				lastIndex = 0;
			}else{
				var indexLeft; 
				var indexRight;
				if(scales[i] == "rack"){
					indexLeft = lastIndex-1%batchSize;
					indexRight = lastIndex+1%batchSize;							
				}else{
					var parent = simplifiedHierarchy[scales[i]][chosen.elementIndex].parent;
					var extent = extents[scales[i+1]][parent].extent;
					var start = extents[scales[i+1]][parent].start;
					var lowerBound = extents[scales[i+1]][parent].lowerBound;
					var upperBound = extents[scales[i+1]][parent].upperBound;

					indexLeft = circularReference(lowerBound-1, extent);
					indexRight = circularReference(upperBound +1, extent);
				}
//				var modulo;
//				var startingIndex = 0;
				var valueLeft = 0;
				var valueRight = 0;

				tempData[chosen.elementIndex].placed = indexLeft;
				valueLeft = computeCrossingsForLayout(tempData, edges, i);

				tempData[chosen.elementIndex].placed = indexRight;
				valueRight = computeCrossingsForLayout(tempData, edges, i);				

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
						item.openEdges -= edgeValue;
						chosen.openEdges -= edgeValue;
					}
				}
			});
			unassignedVertices--;
		}while(unassignedVertices > 0);

		initialOrdering[scales[i]] = tempArray;


		if(scales[i] != "worker"){
			var current = {};
			$.each(currentBatch, function(index, item){
				current[item.elementIndex] = {};
				current[item.elementIndex].start = inverseInitialOrdering[item.elementIndex];
				current[item.elementIndex].extent = simplifiedHierarchy[scales[i]][item.elementIndex].children.length;
				current[item.elementIndex].lowerBound = 0;		
				current[item.elementIndex].upperBound = 0;												
			});
			extents[scales[i]] = current;
		}else{
			for(var t=2; t >= 0; t++){
				var temp = [];
				for(var o=0; o<scales[t].length; o++){
					var temp = [];				
					$.each(tempData[scales[t]], function(index, item){
						temp[item.placed] = data[scales[i]][o].blockElementDetails[indices[index]];
					});
					data[scales[i]][o].blockElementDetails = temp;						
				}
			}
			return data;
		}

	}

}

function computeCrossingsForLayout(tempData, edges, scale){
	var crossings = 0;
	edges.foreach(function(firstEdge, firstEdgeIndex){
		edges.foreach(function(secondEdge, secondEdgeIndex){
			switch(scale){
			case 2: 
				if((tempData[firstEdge.source].placed == -1	||
						tempData[firstEdge.target].placed == -1)	|| 
						(tempData[secondEdge.source].placed == -1	||
								tempData[secondEdge.target].placed == -1))						
					return false;
				break;
			default: break;
			}

			var parent = simplifiedHierarchy[scales[i]][chosen.elementIndex].parent;								

			var firstEdgeSource, secondEdgeSource;
			var firstEdgeTarget, secondEdgeTarget;

			if(tempData[firstEdge.source].placed != -1)
				firstEdgeSource = tempData[firstEdge.source].placed;
			else
				firstEdgeSource = extents[scales[i+1]][firstEdge.source].upperBound;

			if(tempData[firstEdge.target].placed != -1)
				firstEdgeTarget = tempData[firstEdge.target].placed;
			else
				firstEdgeTarget = extents[scales[i+1]][firstEdge.target].upperBound;

			if(tempData[secondEdge.source].placed != -1)
				secondEdgeSource = tempData[secondEdge.source].placed;
			else
				secondEdgeSource = extents[scales[i+1]][secondEdge.source].upperBound;

			if(tempData[secondEdge.target].placed != -1)
				secondEdgeTarget = tempData[secondEdge.target].placed;
			else
				secondEdgeTarget = extents[scales[i+1]][secondEdge.target].upperBound;

			if(!(firstEdgeSource < secondEdgeSource)
					||
					!(firstEdgeTarget > secondEdgeTarget))
				crossings += firstEdge.value + secondEdge.value;
		});		
	});
	return crossings/2;
}
