<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="">
<meta name="author" content="">

<!-- Bootstrap Core CSS -->
<link href="../vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link
	href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/9.8.0/css/bootstrap-slider.min.css"
	rel="stylesheet">


<!-- MetisMenu CSS -->
<link href="../vendor/metisMenu/metisMenu.min.css" rel="stylesheet">

<!-- Custom CSS -->
<link href="../dist/css/sb-admin-2.css" rel="stylesheet">
<link href="../dist/css/diagrams.css" rel="stylesheet">
<link href="../dist/css/histogram.css" rel="stylesheet">
<link href="../dist/css/sidebar.css" rel="stylesheet">
<link href="../dist/css/layout.css" rel="stylesheet">
<link href="../dist/css/loading.css" rel="stylesheet">

<!-- Morris Charts CSS 
<link href="../vendor/morrisjs/morris.css" rel="stylesheet">
-->
<!-- Custom Fonts -->
<link href="../vendor/font-awesome/css/font-awesome.min.css"
	rel="stylesheet" type="text/css">

<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
<!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

    <?php
				header ( 'Access-Control-Allow-Origin: *' );
				require ("../functions.php");
				$jobid = $_GET ["id"];
				
				?>

<title>GiViP -- <?php echo $jobid;?></title>

</head>

<body>

	<div id="loading-modal" class="modal fade" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<!-- 				<div class="modal-header"> -->
				<!-- 					<button type="button" class="close" data-dismiss="modal">&times;</button> -->
				<!-- 					<h4 class="modal-title">Modal Header</h4> -->
				<!-- 				</div> -->
				<div class="modal-body text-center">
					<p>GiViP is loading Data</p>
					<div class="ld ld-heartbeat">
						<div class="ld ld-hourglass ld-spin"></div>
					</div>
				</div>
				<!-- 				<div class="modal-footer"> -->
				<!-- 					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button> -->
				<!-- 				</div> -->
			</div>

		</div>
	</div>
	<div id="wrapper">

		<!-- Navigation -->
		<nav class="navbar navbar-default navbar-static-top" role="navigation"
			style="margin-bottom: 0">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle" data-toggle="collapse"
					data-target=".navbar-collapse">
					<span class="sr-only">Toggle navigation</span>
				</button>
				<a class="navbar-brand" href="index.html">GiViP: Giraph Profiler</a>
				<a href="#" data-toggle="offcanvas"><i
					class="navbar-brand fa fa-chevron-left"></i></a>
			</div>
			<a class="navbar-brand"> Analytics for <span id="jobIdSpan"><?php echo $jobid;?></span>
			</a>
			<div class="navbar-brand pull-right">
				<!-- AREA OF OLD COMMAND -->
			</div>
			<!-- /.navbar-header -->

			<div class="navbar-default sidebar collapse in hidden-xs"
				role="navigation">
				<div class="sidebar-nav navbar-collapse">
					<ul class="nav" id="side-menu">
						<li><a href="index.php"><i class="fa fa-mail-reply fa-fw"></i> <span
								class="collapse in hidden-xs">Back to job selection</span></a></li>
						<li><a href="#"><i class="fa fa-files-o fa-fw"></i> <span
								class="collapse in hidden-xs">Browse jobs<span class="fa arrow"></span></span></a>
							<ul class="nav nav-second-level collapse left-submenu">
								<?php
								$query_result = getJobsList ();
								foreach ( $query_result as $job ) {
									echo '<li>
												<a href="job.php?id=' . $job ["id"] . '">' . $job ["id"] . '</a>
											  </li>';
								}
								?>
                            </ul> <!-- /.nav-second-level --></li>
					</ul>
				</div>
				<!-- /.sidebar-collapse -->
			</div>
			<!-- /.navbar-static-side -->
		</nav>

		<div id="page-wrapper">
			<!-- /.row -->
			<div class="panel-group">
				<div class="row" style="height: 520px">
					<div class="col-md-2 no-right-padding no-left-padding fullHeight">
						<div class="short-row" style="height: 45% !important;">
							<div class="panel panel-default fullHeight">
								<div class="panel-heading panel-subheading">
									<i class="fa fa-cogs fa-fw"></i> Aggregation Panel
								</div>
								<!-- /.panel-heading -->
								<div class="panel-body text-center">
									<div class="btn-group fullHeight">
										<span>Filter</span><br /> <input id="filterByTraffic"
											class="slider" type="text" data-slider-id='trafficSlider'
											data-slider-step="1" /><br /> <span>Temporal Aggregation</span><br />
										<input id="ex1" class="slider" data-slider-id='ex1Slider'
											type="text" data-slider-min="1" data-slider-step="1"
											data-slider-value="1" /><br /> <span>Hierarchy Aggregation</span><br />
										<input id="globalScaleChanger" data-slider-value="0"
											class="slider" data-slider-id='globalScaleChangerSlider'
											type="text" data-slider-tooltip="hide"
											data-slider-ticks-snap-bounds="30" />
									</div>
								</div>
								<!-- /.panel-body -->
							</div>
							<!-- /.panel -->
						</div>
						<div class="short-row" style="height: 25% !important;">
							<div class="panel panel-default fullHeight">
								<div class="panel-heading panel-subheading">
									<i class="fa fa-mouse-pointer fa-fw"></i> Pointer Information
								</div>
								<!-- /.panel-heading -->
								<div class="panel-body">
									<div id="pointerPanel" style="display: none"></div>
									<div id="pointerPanelDefault">Hover mouse on Chord Diagram to
										display cursor information</div>
								</div>
								<!-- /.panel-body -->
							</div>
							<!-- /.panel -->
						</div>
						<div class="short-row" style="height: 19.7% !important;">
							<div class="row half-row">
								<div class="col-md-6 no-right-padding no-left-padding">
									<div class="panel panel-default fullHeight">
										<div class="panel-subeading">
											<div class="row text-center">
												<i class="fa fa-step-forward"></i> Supersteps
											</div>
										</div>
										<div class="row text-center">
											<div id="superstepNumberPanel" class="huge"></div>
										</div>
									</div>
								</div>
								<div class="col-md-6 no-left-padding no-right-padding">
									<div class="panel panel-default fullHeight">
										<div class="panel-subeading">
											<div class="row text-center">
												<i class="fa fa-clock-o"></i> Duration
											</div>
										</div>
										<div class="row text-center">
											<div id="computationDurationPanel" class="huge"></div>
										</div>
									</div>
								</div>
							</div>
							<div class="row half-row">
								<div class="col-md-6 no-right-padding no-left-padding">
									<div class="panel panel-default fullHeight">
										<div class="panel-subeading">
											<div class="row text-center">
												<i class="fa fa-envelope"></i> Messages
											</div>
										</div>
										<div class="row text-center">
											<div id="totalMessagesPanel" class="huge"></div>
										</div>
									</div>
								</div>
								<div class="col-md-6 no-left-padding no-right-padding">
									<div class="panel panel-default fullHeight">
										<div class="panel-subeading">
											<div class="row text-center">
												<i class="fa fa-th"></i> Bytes
											</div>
										</div>

										<div class="row text-center">
											<div id="totalBytesPanel" class="huge"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="short-row" style="height: 10% !important;">
							<div class="panel panel-default fullHeight">
								<div class="panel-body" style="text-align: center">
									Frames from <span id="framesDisplay"></span>
								</div>
								<!-- /.panel-body -->
							</div>
							<!-- /.panel -->
						</div>
					</div>
					<!-- 					<div class="row"> -->
					<div class="col-md-4 no-right-padding no-left-padding fullHeight">
						<div class="panel panel-default fullHeight">
							<div class="panel-heading panel-subheading text-center">
								<div style="float: left;">
									<i class="fa fa-circle-o-notch fa-fw"></i> Frame View
								</div>
								<div class="btn-group vcr-command-container">
									<button id="prevPage" class="vcr-button" onClick="prevPage()">
										<i class="fa fa-backward"></i>
									</button>
									<button id="step-backward-button" class="vcr-button"
										onclick="previousSuperstep();">
										<i class="fa fa-step-backward"></i>
									</button>
									<button id="play-button" class="vcr-button"
										onclick="startEKG();">
										<i class="fa fa-heartbeat"></i> EKG
									</button>
									<button id="step-forward-button" class="vcr-button"
										onclick="nextSuperstep();">
										<i class="fa fa-step-forward"></i>
									</button>
									<button id="nextPage" class="vcr-button" onClick="nextPage()">
										<i class="fa fa-forward"></i>
									</button>
								</div>
								<div class="pull-right">
									<span class="smaller">Messages</span> <input
										id="chordScopeSlider" class="slider"
										data-slider-id='chordScope' type="text" data-slider-value="0"
										data-slider-tooltip="hide" data-slider-handle="square" /> <span
										class="smaller">Bytes</span>
								</div>
							</div>
							<!-- /.panel-heading -->
							<div class="panel-body fullHeight" style="padding-top: 0px;">
								<div id="chordDiagramSvg" class="largeDiagram"></div>
							</div>
							<!-- /.panel-body -->
						</div>
						<!-- /.panel -->
					</div>
					<div class="col-md-6 no-left-padding no-right-padding fullHeight">
						<div class="panel panel-default fullHeight">
							<div class="panel-heading panel-subheading">
								<i class="fa fa-sitemap fa-fw"></i> Cluster View
							</div>
							<!-- 								<div class="panel-heading panel-subheading"> -->
							<!-- 									<i class="fa fa-sitemap fa-fw"></i> Cluster Hierarchy -->
							<!-- 								</div> -->
							<!-- /.panel-heading -->
							<div class="panel-body fullHeight">
								<div id="treeMapArea" class="diagram"></div>
							</div>
							<!-- /.panel-body -->
						</div>
					</div>
					<!-- 					</div> -->
				</div>
				<!-- /.row -->
				<div class="row smallMultipleRow">
					<div class="no-right-padding no-left-padding">
						<div class="panel panel-default">
							<div class="panel-heading panel-subheading">
								<i class="fa fa-clock-o fa-fw"></i>Trend View: Running times
								(ms)
								<div class="pull-right">
									<button type="button"
										class="btn btn-default btn-xs slide-button">
										<i class="fa fa-minus"></i>
									</button>
								</div>
							</div>
							<!-- /.panel-heading -->
							<div class="panel-body">
								<div id="runningTimesAreaChartSVG" class="smallMultiple"></div>
							</div>
							<!-- /.panel-body -->
						</div>
					</div>
				</div>
				<div class="row smallMultipleRow">
					<div class="panel panel-default">
						<div class="panel-heading panel-subheading">
							<i class="fa fa-envelope fa-fw"></i>Trend View: Messages
							<div class="pull-right">
								<button type="button"
									class="btn btn-default btn-xs slide-button">
									<i class="fa fa-minus"></i>
								</button>
							</div>
						</div>
						<!-- /.panel-heading -->
						<div class="panel-body">
							<div id="smallMultipleMessagesUnits" class="smallMultiple"></div>
						</div>
						<!-- /.panel-body -->
					</div>
				</div>
				<div class="row smallMultipleRow">
					<div class="panel panel-default">
						<div class="panel-heading panel-subheading">
							<i class="fa fa-th fa-fw"></i>Trend View: Bytes
							<div class="pull-right">
								<button type="button"
									class="btn btn-default btn-xs slide-button">
									<i class="fa fa-minus"></i>
								</button>
							</div>
						</div>
						<!-- /.panel-heading -->
						<div class="panel-body">
							<div id="smallMultipleMessagesBytes" class="smallMultiple"></div>
						</div>
						<!-- /.panel-body -->
					</div>
					<!-- /.panel -->
				</div>
			</div>
		</div>
		<!-- /.col-md-4 -->
	</div>
	<!-- /#page-wrapper -->
	<!-- /#wrapper -->

	<!-- jQuery -->
	<script src="../vendor/jquery/jquery.min.js"></script>
	<script
		src="https://code.jquery.com/color/jquery.color.plus-names-2.1.2.min.js"></script>

	<!-- Bootstrap Core JavaScript -->
	<script src="../vendor/bootstrap/js/bootstrap.min.js"></script>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/9.8.0/bootstrap-slider.min.js"></script>


	<!-- Metis Menu Plugin JavaScript -->
	<script src="../vendor/metisMenu/metisMenu.min.js"></script>

	<!--  d3 library and extensions -->
	<script src="https://d3js.org/d3.v4.min.js"></script>
	<script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
	<script src="https://d3js.org/d3-hierarchy.v1.min.js"></script>
	<script src="https://d3js.org/d3-color.v1.min.js"></script>
	<script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
	<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
	<script src="https://d3js.org/d3-axis.v1.min.js"></script>
	<script src="https://d3js.org/d3-array.v1.min.js"></script>
	<script src="https://d3js.org/d3-path.v1.min.js"></script>
	<script src="https://d3js.org/d3-chord.v1.min.js"></script>
	<script src="https://d3js.org/d3-timer.v1.min.js"></script>
	<script src="https://d3js.org/d3-transition.v1.min.js"></script>
	<script src="https://d3js.org/d3-shape.v1.min.js"></script>
	<script src="https://d3js.org/d3-path.v1.min.js"></script>
	<script src="https://d3js.org/d3-ease.v1.min.js"></script>

	<!-- Diagram JS files -->
	<script type="text/javascript" src="../js/tip.js"></script>
	<script type="text/javascript" src="../js/diagrams/chordDiagram.js"></script>
	<script type="text/javascript" src="../js/diagrams/stackedArea.js"></script>
	<script type="text/javascript" src="../js/diagrams/hierarchyDiagram.js"></script>
	<script type="text/javascript" src="../js/diagrams/treemap.js"></script>
	<script type="text/javascript"
		src="../js/diagrams/zoomableHistogramDiagram.js"></script>
	<script type="text/javascript" src="../js/diagrams/pie.js"></script>

	<!-- Tolls JS files -->
	<script type="text/javascript" src="../js/dataFetcher.js"></script>
	<script type="text/javascript" src="../js/functions.js"></script>
	<script type="text/javascript">		
		$('.slide-button').click(function(event){
			var iObj = $(event.currentTarget).find("i");
			var p = $($('.panel-heading').has(event.currentTarget)[0]).next()[0];			
			if(iObj.hasClass("fa-minus")){
				iObj.removeClass("fa-minus");
				iObj.addClass("fa-plus");
				$(p).slideUp();
				$(p.children[0]).find(".x.axis").removeClass("active");			
			}else{
				iObj.removeClass("fa-plus");
				iObj.addClass("fa-minus");
				$(p.children[0]).find(".x.axis").addClass("active");							
				$(p).slideDown();
				moveNeedle(
						x(tickValues[scales[currentScale]][needleTick])				
				);			
			}
		});

		$('.globalScaleChanger').click(function(event){
			setCurrentScale(event.currentTarget.id.split("-")[1]);
		});
	
		leftMargin = $('#page-wrapper').css('margin-left');

		$(window).resize(function(){
			resizeDiagrams();
		});
		
		initDiagramAreas();
		fetchAllData();
	</script>

	<!-- Morris Charts JavaScript
    <script src="../vendor/raphael/raphael.min.js"></script>
    <script src="../vendor/morrisjs/morris.min.js"></script>
    <script src="../data/morris-data.js"></script>-->

	<!-- Custom Theme JavaScript -->
	<script src="../dist/js/sb-admin-2.js"></script>

</body>

</html>
