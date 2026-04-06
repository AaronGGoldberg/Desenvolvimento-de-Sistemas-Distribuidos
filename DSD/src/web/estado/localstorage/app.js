async function login() {
    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    // 🚨 Salvando token no localStorage
    localStorage.setItem("token", data.token);

    alert("Logado!");
}

async function getProfile() {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/profile", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await response.json();
    console.log(data);
}