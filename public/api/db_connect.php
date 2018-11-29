<?php
session_start();

function connect_db() {
	$db = mysqli_connect(
		"localhost", 		/* hostname */
		"root", 			/* username */
		"",					/* password */
		"clickbait_label" 	/* database name */
	) or die("Connection failed: " . mysqli_connect_error());

	if (mysqli_connect_errno()) {
		printf("Connect failed: %s\n", mysqli_connect_error());
		exit();
	}

	return $db;
}