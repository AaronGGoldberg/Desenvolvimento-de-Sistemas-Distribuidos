<?php
// Recebe o valor atual enviado pelo JavaScript. Se não existir, começa em 100.
$atual = isset($_POST['parametro']) ? (int)$_POST['parametro'] : 100;

// Simula a espera de 1 segundo (regra do negócio)
sleep(5);

// Decrementa o valor
$atual--;

// Retorna APENAS UMA resposta válida em JSON e encerra
echo json_encode(["parametro" => $atual]);
exit;
?>