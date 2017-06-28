<?php

	$webapp = "http://localhost:8080/9Meg0/GiraphJobServer/1.0.0/";
	$jobs = "Jobs";
	$sstep_block = "SuperstepBlock";

	function getJobsList(){
		
		global $webapp, $jobs;
		
		return json_decode(callRestApi($webapp.$jobs, "GET"), true);
	
	}
	
	function callRestApi($url, $method, $data = false){
		
		$curl = curl_init();
		
		switch($method){
			
			case "GET":
				
				
			break;
			
		}
		
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
		
		$result = curl_exec($curl);
		
		curl_close($curl);
		
		return $result;
		
	}

?>
