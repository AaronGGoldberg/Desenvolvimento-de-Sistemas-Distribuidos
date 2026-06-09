const assert = require('assert');
const http = require('http');
const { iniciarServidor } = require('../server');

function criarCliente(url) {
    const socket = new WebSocket(url);
    const mensagens = [];
    const aguardando = [];

    socket.addEventListener('message', event => {
        const dados = JSON.parse(event.data);
        mensagens.push(dados);

        for (let index = aguardando.length - 1; index >= 0; index -= 1) {
            const item = aguardando[index];

            if (!item.filtro || item.filtro(dados)) {
                aguardando.splice(index, 1);
                clearTimeout(item.timeout);
                item.resolve(dados);
            }
        }
    });

    return {
        socket,
        aguardarAbertura() {
            if (socket.readyState === WebSocket.OPEN) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout aguardando abertura')), 5000);
                socket.addEventListener('open', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        },
        aguardarMensagem(filtro) {
            const existente = mensagens.find(mensagem => !filtro || filtro(mensagem));

            if (existente) {
                return Promise.resolve(existente);
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const index = aguardando.findIndex(item => item.resolve === resolve);
                    if (index >= 0) aguardando.splice(index, 1);
                    reject(new Error('Timeout aguardando mensagem WebSocket'));
                }, 5000);

                aguardando.push({ filtro, resolve, timeout });
            });
        },
        fechar() {
            socket.close();
        }
    };
}

function buscarStatus(port) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port,
            path: '/status',
            method: 'GET',
            headers: {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'exemplo-3004.app.github.dev'
            }
        }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (erro) {
                    reject(erro);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const server = iniciarServidor(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();
    const url = `ws://localhost:${port}/ws`;

    const clienteA = criarCliente(url);
    const clienteB = criarCliente(url);

    try {
        await Promise.all([
            clienteA.aguardarAbertura(),
            clienteB.aguardarAbertura()
        ]);

        await Promise.all([
            clienteA.aguardarMensagem(mensagem => mensagem.tipo === 'boas-vindas'),
            clienteB.aguardarMensagem(mensagem => mensagem.tipo === 'boas-vindas')
        ]);

        const status = await buscarStatus(port);
        assert.equal(status.websocketUrl, 'wss://exemplo-3004.app.github.dev/ws');
        assert.equal(status.protocoloWebSocket, 'wss://');        

        const recebidaNoClienteB = clienteB.aguardarMensagem(mensagem => (
            mensagem.tipo === 'notificacao' && mensagem.texto === 'Teste de broadcast em tempo real'
        ));

        clienteA.socket.send(JSON.stringify({
            tipo: 'notificacao',
            texto: 'Teste de broadcast em tempo real'
        }));

        const mensagem = await recebidaNoClienteB;
        assert.equal(mensagem.texto, 'Teste de broadcast em tempo real');
        assert.equal(mensagem.tipo, 'notificacao');

        console.log('Teste WebSocket de broadcast passou.');
    } finally {
        clienteA.fechar();
        clienteB.fechar();
        await new Promise(resolve => setTimeout(resolve, 100));
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(erro => {
    console.error(erro);
    process.exit(1);
});