
function fetchJobInfoData(){

	$("#loading-modal").modal({
	    backdrop: 'static',
	    keyboard: false
	});
	
	$.ajax({

		url: webServerUrl + jobInfoEndpoint + "?jobid=" + $('#jobIdSpan').html(),
		type: "GET",
		success: function(data, textStatus, jqXHR){

			jobInfo = data;

			computeHierarchyIndices();
			
			$('#superstepNumberPanel').html(jobInfo.nsupersteps);
//			$('#computationDurationPanel').html(jobInfo.computationDuration);
			var f = d3.timeFormat("%H:%M:%S");
			var g = d3.formatPrefix(".1f", getOrderOfMagnitude(jobInfo.nmessages));
			var h = d3.formatPrefix(".1f", getOrderOfMagnitude(jobInfo.bytes));
			$('#totalMessagesPanel').html(g(jobInfo.nmessages));
			$('#totalBytesPanel').html(h(jobInfo.bytes));
			var attempt = f(jobInfo.computationDuration).split(":");
			var corrH = parseInt(attempt[0]) - 1;
		
			
			$('#computationDurationPanel').html(corrH + ":" + attempt[1] + ":" + attempt[2]);
			
//			$('#numberOfWorkersPanel').html(jobInfo.nworkers + " workers");
//			$('#numberOfHostsPanel').html(jobInfo.nhosts + " hosts");
//			$('#numberOfRacksPanel').html(jobInfo.nracks + " racks");
			bindSlider(jobInfo.nsupersteps);

			jobInfo.jobid = $('#jobIdSpan').html();
			simplifyHierarchy(jobInfo.racklist);
//			plotFixedDiagrams();

			fetchSuperstepBlock(firstSetupCallback);
	
		},
		error: function(data, textStatus, jqXHR){ alert("Could not load job info data from server ");}
	});

	$("#loading-modal").modal('hide');
	
}

function fetchSuperstepBlock(callback, startIndex = false){

	if(!($("#loading-modal").data('bs.modal') || {}).isShown)
		$("#loading-modal").modal({
		    backdrop: 'static',
		    keyboard: false
		});
	
//	endIndex = !endIndex ? jobInfo.nsupersteps : endIndex;

	startIndex = !startIndex ? 0 : startIndex;
	
	nextIndex = (currentStartPage + 1)*paginationExtent*currentBlockSize;
	
	nextIndex = nextIndex > jobInfo.nsupersteps ? jobInfo.nsupersteps : nextIndex;	
	
	superstepBlocks.length = 0;
	var returnData = {};
	
	var computedScales = 0;
	
	$.each(scales, function(i, item){
		
		$.ajax({

			url: webServerUrl + superstepBlockEndpoint + "?job=" + jobInfo.jobid + "&startIndex=" + startIndex + "&endIndex=" + nextIndex + "&blockSize=" + currentBlockSize + "&scale=" + item,
			type: "GET",
			success: function(data, textStatus, jqXHR){
				returnData[item] = data;
				computedScales++;
				if(computedScales == 3){				
					callback(returnData);
					$("#loading-modal").modal('hide');					
				}
			},
			error: function(data, textStatus, jqXHR){ alert("Could not load superstep block data from server ");}
		});

	})
}