async function login() {
    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    await fetch("http://localhost/cookies/login.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include", // 🔑 importante!
        body: JSON.stringify({ username, password })
    });

    alert("Logado!");
}

async function getProfile() {
    const response = await fetch("http://localhost/cookies/profile.php", {
        credentials: "include" // 🔑 cookie vai automaticamente
    });

    const data = await response.json();
    console.log(data);
}