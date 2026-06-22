<?php
header("Content-Type: application/json");

// Pegando header Authorization
$headers = getallheaders();
$auth = $headers["Authorization"] ?? "";

if (strpos($auth, "Bearer ") === 0) {
    $token = str_replace("Bearer ", "", $auth);

    // Validação fake
    if ($token) {
        echo json_encode([
            "user" => "admin",
            "role" => "admin"
        ]);
        exit;
    }
}

http_response_code(401);
echo json_encode(["error" => "Não autorizado"]);