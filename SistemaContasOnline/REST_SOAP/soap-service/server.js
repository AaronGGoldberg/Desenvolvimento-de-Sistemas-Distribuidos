const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const NAMESPACE = 'http://contasonline.soap/';
const WSDL_PATH = path.join(__dirname, 'contas-online.wsdl');

const contas = [
    { id: 1, nome: 'Aaron Guerra Goldberg', email: 'aaron@email.com', saldo: 500, status: 'ATIVA' },
    { id: 2, nome: 'Maria Oliveira', email: 'maria@email.com', saldo: 250, status: 'ATIVA' },
    { id: 3, nome: 'Joao Silva', email: 'joao@email.com', saldo: 0, status: 'BLOQUEADA' }
];

function escapeXml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function extrairValor(xml, tag) {
    const regex = new RegExp(`<(?:\\w+:)?${tag}>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'i');
    const encontrado = xml.match(regex);
    return encontrado ? encontrado[1].trim() : '';
}

function localizarConta(contaId) {
    const conta = contas.find(item => item.id === contaId);

    if (!conta) {
        throw new Error(`Conta ${contaId} não encontrada.`);
    }

    return conta;
}

function validarContaId(xml) {
    const contaId = Number.parseInt(extrairValor(xml, 'contaId'), 10);

    if (!Number.isInteger(contaId) || contaId <= 0) {
        throw new Error('O campo contaId deve ser um número inteiro positivo.');
    }

    return contaId;
}

function envelopeSoap(conteudoBody) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soapenv:Body>
${conteudoBody}
  </soapenv:Body>
</soapenv:Envelope>`;
}

function soapFault(mensagem) {
    return envelopeSoap(`    <soapenv:Fault>
      <faultcode>soapenv:Client</faultcode>
      <faultstring>${escapeXml(mensagem)}</faultstring>
    </soapenv:Fault>`);
}

function consultarConta(xml) {
    const contaId = validarContaId(xml);
    const conta = localizarConta(contaId);

    return envelopeSoap(`    <tns:consultarContaResponse>
      <tns:contaId>${conta.id}</tns:contaId>
      <tns:nome>${escapeXml(conta.nome)}</tns:nome>
      <tns:email>${escapeXml(conta.email)}</tns:email>
      <tns:saldo>${conta.saldo.toFixed(2)}</tns:saldo>
      <tns:status>${escapeXml(conta.status)}</tns:status>
    </tns:consultarContaResponse>`);
}

function simularOperacao(xml) {
    const contaId = validarContaId(xml);
    const tipo = extrairValor(xml, 'tipo').toLowerCase();
    const valor = Number.parseFloat(extrairValor(xml, 'valor').replace(',', '.'));
    const conta = localizarConta(contaId);

    if (!['deposito', 'saque'].includes(tipo)) {
        throw new Error('O campo tipo deve ser deposito ou saque.');
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error('O campo valor deve ser maior que zero.');
    }

    if (tipo === 'saque' && valor > conta.saldo) {
        throw new Error('Saldo insuficiente para simular o saque.');
    }

    const saldoAntes = conta.saldo;
    const saldoDepois = tipo === 'deposito' ? saldoAntes + valor : saldoAntes - valor;
    const mensagem = `Operação ${tipo} simulada com sucesso.`;

    return envelopeSoap(`    <tns:simularOperacaoResponse>
      <tns:contaId>${conta.id}</tns:contaId>
      <tns:tipo>${escapeXml(tipo)}</tns:tipo>
      <tns:valor>${valor.toFixed(2)}</tns:valor>
      <tns:saldoAntes>${saldoAntes.toFixed(2)}</tns:saldoAntes>
      <tns:saldoDepois>${saldoDepois.toFixed(2)}</tns:saldoDepois>
      <tns:mensagem>${escapeXml(mensagem)}</tns:mensagem>
    </tns:simularOperacaoResponse>`);
}

function identificarOperacao(xml) {
    if (/<(?:\w+:)?consultarContaRequest[\s>]/i.test(xml)) {
        return consultarConta;
    }

    if (/<(?:\w+:)?simularOperacaoRequest[\s>]/i.test(xml)) {
        return simularOperacao;
    }

    throw new Error('Operação SOAP não reconhecida.');
}

function enviarXml(res, statusCode, xml) {
    res.writeHead(statusCode, { 'Content-Type': 'text/xml; charset=utf-8' });
    res.end(xml);
}

function buildBaseUrl(req) {
    const forwardedProtoHeader = req.headers['x-forwarded-proto'];
    const forwardedHostHeader = req.headers['x-forwarded-host'];

    const protocol = forwardedProtoHeader
        ? forwardedProtoHeader.split(',')[0].trim()
        : 'http';

    const host = forwardedHostHeader
        ? forwardedHostHeader.split(',')[0].trim()
        : req.headers.host;

    return `${protocol}://${host}`;
}

function carregarWsdl(req) {
    const wsdl = fs.readFileSync(WSDL_PATH, 'utf8');
    const soapAddress = `${buildBaseUrl(req)}/soap`;

    return wsdl.replace(
        /<soap:address location="[^"]+" \/>/,
        `<soap:address location="${soapAddress}" />`
    );
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/soap' && url.search.toLowerCase() === '?wsdl') {
        res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        res.end(carregarWsdl(req));
        return;
    }

    if (req.method !== 'POST' || url.pathname !== '/soap') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Endpoint SOAP disponível em POST /soap e WSDL em GET /soap?wsdl');
        return;
    }

    let body = '';

    req.setEncoding('utf8');
    req.on('data', parte => {
        body += parte;
    });

    req.on('end', () => {
        try {
            const operacao = identificarOperacao(body);
            enviarXml(res, 200, operacao(body));
        } catch (erro) {
            enviarXml(res, 500, soapFault(erro.message));
        }
    });
});

server.listen(PORT, () => {
    console.log(`SOAP Service iniciado na porta ${PORT}.`);
    console.log(`Localhost: http://localhost:${PORT}/soap`);
    console.log(`WSDL localhost: http://localhost:${PORT}/soap?wsdl`);
    console.log('Codespaces: use a URL pública da porta 3003 no formato https://<seu-codespace>-3003.app.github.dev/soap');
    console.log('WSDL Codespaces: https://<seu-codespace>-3003.app.github.dev/soap?wsdl');
});