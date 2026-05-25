<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Entrada JSON
$data = json_decode(file_get_contents("php://input"), true);

$username = $data["username"] ?? "";
$password = $data["password"] ?? "";

// Validação simples (mock)
if ($username === "admin" && $password === "123") {
    
    // Simulando um token
    $token = base64_encode("admin:" . time());

    echo json_encode([
        "token" => $token
    ]);
    exit;
}

http_response_code(401);
echo json_encode(["error" => "Credenciais inválidas"]);