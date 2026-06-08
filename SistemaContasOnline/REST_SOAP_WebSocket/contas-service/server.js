const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let contas = [];
let proximoId = 1;

// Função simples para validar email
function emailValido(email) {
    return typeof email === 'string' && email.includes('@') && email.includes('.');
}

// Criar conta
app.post('/contas', (req, res) => {
    const { nome, email } = req.body;

    if (!nome || !email) {
        return res.status(400).json({
            mensagem: 'Nome e email são obrigatórios.'
        });
    }

    const nomeLimpo = String(nome).trim();
    const emailLimpo = String(email).trim().toLowerCase();

    if (!nomeLimpo || !emailLimpo) {
        return res.status(400).json({
            mensagem: 'Nome e email não podem estar vazios.'
        });
    }

    if (!emailValido(emailLimpo)) {
        return res.status(400).json({
            mensagem: 'Email inválido.'
        });
    }

    const contaExistente = contas.find(conta => conta.email === emailLimpo);

    if (contaExistente) {
        return res.status(409).json({
            mensagem: 'Já existe uma conta cadastrada com este email.'
        });
    }

    const novaConta = {
        id: proximoId++,
        nome: nomeLimpo,
        email: emailLimpo
    };

    contas.push(novaConta);

    res.status(201).json(novaConta);
});

// Listar contas
app.get('/contas', (req, res) => {
    res.status(200).json(contas);
});

// Buscar conta por ID
app.get('/contas/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({
            mensagem: 'ID inválido.'
        });
    }

    const conta = contas.find(c => c.id === id);

    if (!conta) {
        return res.status(404).json({
            mensagem: 'Conta não encontrada.'
        });
    }

    res.status(200).json(conta);
});

app.listen(PORT, () => {
    console.log(`Contas Service rodando em http://localhost:${PORT}`);
});