<?php
	//exemplo 1
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Methods: *");
	header("Access-Control-Allow-Headers: Content-Type");
	$i = $_POST["parametro"];

	$resposta = [
    		"status" => "sucesso",
    		"parametro" => $i,
    		"mensagem" => "Chamada ajax: " . $i
	];
	echo json_encode($resposta);

	//exemplo 2
	/*$a = fopen("a.txt", "r");
	$i = fgets($a);
	$i = ($i + 1);
	fclose($a);

	$a = fopen("a.txt", "w");
	fwrite($a, $i);
	fclose($a);

	$_POST["parametro"] = $i;
	echo json_encode($_POST);*/

?>
