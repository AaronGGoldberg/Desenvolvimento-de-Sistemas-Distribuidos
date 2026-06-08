const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let transacoes = [];
let proximoId = 1;

// Função para calcular saldo
function calcularSaldo(contaId) {
    return transacoes
        .filter(t => t.contaId === contaId)
        .reduce((total, t) => {
            return t.tipo === 'deposito' ? total + t.valor : total - t.valor;
        }, 0);
}

// Depositar
app.post('/transacoes/deposito', (req, res) => {
    const { contaId, valor } = req.body;

    const id = parseInt(contaId, 10);
    const valorNumero = Number(valor);

    if (isNaN(id) || isNaN(valorNumero) || valorNumero <= 0) {
        return res.status(400).json({
            mensagem: 'Conta ID e valor válido são obrigatórios.'
        });
    }

    const novaTransacao = {
        id: proximoId++,
        contaId: id,
        tipo: 'deposito',
        valor: valorNumero
    };

    transacoes.push(novaTransacao);

    res.status(201).json(novaTransacao);
});

// Sacar
app.post('/transacoes/saque', (req, res) => {
    const { contaId, valor } = req.body;

    const id = parseInt(contaId, 10);
    const valorNumero = Number(valor);

    if (isNaN(id) || isNaN(valorNumero) || valorNumero <= 0) {
        return res.status(400).json({
            mensagem: 'Conta ID e valor válido são obrigatórios.'
        });
    }

    const saldoAtual = calcularSaldo(id);

    if (saldoAtual < valorNumero) {
        return res.status(400).json({
            mensagem: 'Saldo insuficiente.'
        });
    }

    const novaTransacao = {
        id: proximoId++,
        contaId: id,
        tipo: 'saque',
        valor: valorNumero
    };

    transacoes.push(novaTransacao);

    res.status(201).json(novaTransacao);
});

// Listar transações de uma conta
app.get('/transacoes/conta/:id', (req, res) => {
    const contaId = parseInt(req.params.id, 10);

    if (isNaN(contaId)) {
        return res.status(400).json({
            mensagem: 'ID inválido.'
        });
    }

    const lista = transacoes.filter(t => t.contaId === contaId);

    res.status(200).json(lista);
});

// Consultar saldo
app.get('/transacoes/conta/:id/saldo', (req, res) => {
    const contaId = parseInt(req.params.id, 10);

    if (isNaN(contaId)) {
        return res.status(400).json({
            mensagem: 'ID inválido.'
        });
    }

    const saldo = calcularSaldo(contaId);

    res.status(200).json({
        contaId,
        saldo
    });
});

app.listen(PORT, () => {
    console.log(`Transacoes Service rodando em http://localhost:${PORT}`);
});