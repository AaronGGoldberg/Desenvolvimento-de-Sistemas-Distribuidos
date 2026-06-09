const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.PORT) || 3004;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WS_PATH = '/ws';
const HEARTBEAT_INTERVAL_MS = 10000;
const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon'
};

function criarEstado() {
    return {
        clientes: new Map(),
        proximoClienteId: 1,
        iniciadoEm: new Date().toISOString(),
        heartbeatTimer: null
    };
}

function criarMensagem(tipo, dados = {}) {
    return {
        tipo,
        dataHora: new Date().toISOString(),
        ...dados
    };
}

function enviarJson(socket, mensagem) {
    if (!socket || socket.destroyed || !socket.writable) {
        return;
    }

    socket.write(codificarFrame(JSON.stringify(mensagem)));
}

function broadcast(estado, mensagem) {
    const payload = typeof mensagem === 'string'
        ? criarMensagem('sistema', { texto: mensagem })
        : mensagem;

    for (const { socket } of estado.clientes.values()) {
        enviarJson(socket, payload);
    }
}

function listarClientes(estado) {
    return Array.from(estado.clientes.values()).map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        conectadoEm: cliente.conectadoEm
    }));
}

function atualizarListaClientes(estado) {
    broadcast(estado, criarMensagem('clientes', {
        total: estado.clientes.size,
        clientes: listarClientes(estado)
    }));
}

function codificarFrame(texto, opcode = 0x1) {
    const payload = Buffer.from(texto);
    const tamanho = payload.length;
    let cabecalho;

    if (tamanho < 126) {
        cabecalho = Buffer.alloc(2);
        cabecalho[1] = tamanho;
    } else if (tamanho <= 65535) {
        cabecalho = Buffer.alloc(4);
        cabecalho[1] = 126;
        cabecalho.writeUInt16BE(tamanho, 2);
    } else {
        cabecalho = Buffer.alloc(10);
        cabecalho[1] = 127;
        cabecalho.writeBigUInt64BE(BigInt(tamanho), 2);
    }

    cabecalho[0] = 0x80 | opcode;
    return Buffer.concat([cabecalho, payload]);
}

function decodificarFrames(buffer) {
    const mensagens = [];
    let offset = 0;

    while (offset + 2 <= buffer.length) {
        const byteInicial = buffer[offset];
        const segundoByte = buffer[offset + 1];
        const opcode = byteInicial & 0x0f;
        const mascarado = (segundoByte & 0x80) === 0x80;
        let tamanho = segundoByte & 0x7f;
        let cabecalho = 2;

        if (tamanho === 126) {
            if (offset + cabecalho + 2 > buffer.length) break;
            tamanho = buffer.readUInt16BE(offset + cabecalho);
            cabecalho += 2;
        } else if (tamanho === 127) {
            if (offset + cabecalho + 8 > buffer.length) break;
            tamanho = Number(buffer.readBigUInt64BE(offset + cabecalho));
            cabecalho += 8;
        }

        const tamanhoMascara = mascarado ? 4 : 0;
        const inicioPayload = offset + cabecalho + tamanhoMascara;
        const fimPayload = inicioPayload + tamanho;

        if (fimPayload > buffer.length) break;

        const payload = Buffer.from(buffer.slice(inicioPayload, fimPayload));

        if (mascarado) {
            const mascara = buffer.slice(offset + cabecalho, offset + cabecalho + 4);
            for (let index = 0; index < payload.length; index += 1) {
                payload[index] ^= mascara[index % 4];
            }
        }

        mensagens.push({ opcode, texto: payload.toString('utf8') });
        offset = fimPayload;
    }

    return {
        mensagens,
        restante: buffer.slice(offset)
    };
}

function obterArquivoSeguro(urlPath) {
    const caminhoRelativo = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.slice(1));
    const caminhoArquivo = path.normalize(path.join(PUBLIC_DIR, caminhoRelativo));

    if (!caminhoArquivo.startsWith(PUBLIC_DIR)) {
        return null;
    }

    return caminhoArquivo;
}

function responderJson(res, statusCode, dados) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(dados, null, 2));
}

function primeiroValorHeader(valor) {
    if (Array.isArray(valor)) {
        return valor[0];
    }

    return valor ? String(valor).split(',')[0].trim() : '';
}

function montarUrlsPublicas(req) {
    const protocoloHttp = primeiroValorHeader(req.headers['x-forwarded-proto'])
        || (req.socket.encrypted ? 'https' : 'http');
    const host = primeiroValorHeader(req.headers['x-forwarded-host'])
        || primeiroValorHeader(req.headers.host)
        || `localhost:${PORT}`;
    const protocoloWebSocket = protocoloHttp === 'https' ? 'wss' : 'ws';

    return {
        interfaceUrl: `${protocoloHttp}://${host}`,
        statusUrl: `${protocoloHttp}://${host}/status`,
        broadcastUrl: `${protocoloHttp}://${host}/broadcast`,
        websocketUrl: `${protocoloWebSocket}://${host}${WS_PATH}`,
        protocoloWebSocket: `${protocoloWebSocket}://`
    };
}

function lerCorpoJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.setEncoding('utf8');
        req.on('data', parte => {
            body += parte;

            if (body.length > 10000) {
                reject(new Error('Payload muito grande.'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!body.trim()) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (erro) {
                reject(new Error('JSON inválido.'));
            }
        });
        req.on('error', reject);
    });
}

async function atenderHttp(req, res, estado) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/status') {
        const urls = montarUrlsPublicas(req);        
        responderJson(res, 200, {
            status: 'online',
            protocoloWebSocket: urls.protocoloWebSocket,
            endpointWebSocket: WS_PATH,
            websocketUrl: urls.websocketUrl,
            interfaceUrl: urls.interfaceUrl,
            statusUrl: urls.statusUrl,
            broadcastUrl: urls.broadcastUrl,
            clientesConectados: estado.clientes.size,
            clientes: listarClientes(estado),
            iniciadoEm: estado.iniciadoEm
        });
        return;
    }

    if (req.method === 'POST' && url.pathname === '/broadcast') {
        try {
            const body = await lerCorpoJson(req);
            const texto = String(body.texto || body.mensagem || '').trim();

            if (!texto) {
                responderJson(res, 400, { mensagem: 'Informe o campo texto ou mensagem.' });
                return;
            }

            const mensagem = criarMensagem('notificacao', {
                origem: 'servidor-http',
                texto
            });

            broadcast(estado, mensagem);
            console.log(`[websocket] Broadcast do servidor HTTP: ${texto}`);
            responderJson(res, 202, {
                mensagem: 'Notificação enviada para os clientes conectados.',
                clientesAlcancados: estado.clientes.size,
                evento: mensagem
            });
        } catch (erro) {
            responderJson(res, 400, { mensagem: erro.message });
        }
        return;
    }

    if (req.method !== 'GET') {
        responderJson(res, 405, { mensagem: 'Método não permitido.' });
        return;
    }

    const caminhoArquivo = obterArquivoSeguro(url.pathname);

    if (!caminhoArquivo || !fs.existsSync(caminhoArquivo) || fs.statSync(caminhoArquivo).isDirectory()) {
        responderJson(res, 404, { mensagem: 'Recurso não encontrado.' });
        return;
    }

    const extensao = path.extname(caminhoArquivo);
    res.writeHead(200, { 'Content-Type': contentTypes[extensao] || 'application/octet-stream' });
    fs.createReadStream(caminhoArquivo).pipe(res);
}

function confirmarHandshake(req, socket) {
    const chave = req.headers['sec-websocket-key'];

    if (!chave) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return false;
    }

    const accept = crypto
        .createHash('sha1')
        .update(`${chave}${WEBSOCKET_GUID}`)
        .digest('base64');

    socket.write([
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '\r\n'
    ].join('\r\n'));

    return true;
}

function tratarMensagemCliente(estado, cliente, texto) {
    let mensagem;

    try {
        mensagem = JSON.parse(texto);
    } catch (erro) {
        mensagem = { tipo: 'mensagem', texto };
    }

    const tipo = String(mensagem.tipo || 'mensagem').trim();
    const conteudo = String(mensagem.texto || mensagem.mensagem || '').trim();

    console.log(`[websocket] Mensagem recebida de ${cliente.nome} (${cliente.id}): ${conteudo || texto}`);

    if (tipo === 'identificacao') {
        const nome = String(mensagem.nome || '').trim();

        if (nome) {
            cliente.nome = nome.slice(0, 40);
        }

        enviarJson(cliente.socket, criarMensagem('boas-vindas', {
            clienteId: cliente.id,
            nome: cliente.nome,
            texto: `Conectado como ${cliente.nome}.`
        }));
        atualizarListaClientes(estado);
        return;
    }

    if (!conteudo) {
        enviarJson(cliente.socket, criarMensagem('erro', {
            texto: 'Mensagem vazia não foi enviada.'
        }));
        return;
    }

    broadcast(estado, criarMensagem('notificacao', {
        origem: cliente.nome,
        clienteId: cliente.id,
        texto: conteudo.slice(0, 500)
    }));
}

function registrarConexao(req, socket, estado) {
    const clienteId = `cliente-${estado.proximoClienteId}`;
    estado.proximoClienteId += 1;

    const cliente = {
        id: clienteId,
        nome: clienteId,
        socket,
        conectadoEm: new Date().toISOString(),
        buffer: Buffer.alloc(0)
    };

    estado.clientes.set(clienteId, cliente);
    console.log(`[websocket] Conexão aberta: ${cliente.id} de ${req.socket.remoteAddress}`);

    enviarJson(socket, criarMensagem('boas-vindas', {
        clienteId: cliente.id,
        nome: cliente.nome,
        texto: `Bem-vindo! Você está conectado como ${cliente.id}.`
    }));

    broadcast(estado, criarMensagem('sistema', {
        texto: `${cliente.id} entrou no monitor em tempo real.`
    }));
    atualizarListaClientes(estado);

    socket.on('data', chunk => {
        cliente.buffer = Buffer.concat([cliente.buffer, chunk]);
        const resultado = decodificarFrames(cliente.buffer);
        cliente.buffer = resultado.restante;

        for (const frame of resultado.mensagens) {
            if (frame.opcode === 0x8) {
                socket.end(codificarFrame('', 0x8));
                return;
            }

            if (frame.opcode === 0x9) {
                socket.write(codificarFrame(frame.texto, 0xA));
                continue;
            }

            if (frame.opcode === 0x1) {
                tratarMensagemCliente(estado, cliente, frame.texto);
            }
        }
    });

    socket.on('close', () => {
        if (estado.clientes.delete(cliente.id)) {
            console.log(`[websocket] Conexão encerrada: ${cliente.nome} (${cliente.id})`);
            broadcast(estado, criarMensagem('sistema', {
                texto: `${cliente.nome} saiu do monitor em tempo real.`
            }));
            atualizarListaClientes(estado);
        }
    });

    socket.on('error', erro => {
        console.error(`[websocket] Erro na conexão ${cliente.id}: ${erro.message}`);
    });
}

function iniciarHeartbeat(estado) {
    estado.heartbeatTimer = setInterval(() => {
        if (estado.clientes.size === 0) {
            return;
        }

        broadcast(estado, criarMensagem('monitoramento', {
            origem: 'servidor',
            texto: `Monitoramento ativo: ${estado.clientes.size} cliente(s) conectado(s).`
        }));
    }, HEARTBEAT_INTERVAL_MS);
}

function criarServidor() {
    const estado = criarEstado();
    const server = http.createServer((req, res) => {
        atenderHttp(req, res, estado).catch(erro => {
            console.error(`[http] Erro ao processar requisição: ${erro.message}`);
            responderJson(res, 500, { mensagem: 'Erro interno no servidor.' });
        });
    });

    server.on('upgrade', (req, socket) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname !== WS_PATH) {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
            return;
        }

        if (confirmarHandshake(req, socket)) {
            registrarConexao(req, socket, estado);
        }
    });

    server.on('close', () => {
        if (estado.heartbeatTimer) {
            clearInterval(estado.heartbeatTimer);
        }
    });

    iniciarHeartbeat(estado);
    server.estadoWebSocket = estado;
    return server;
}

function iniciarServidor(porta = PORT) {
    const server = criarServidor();

    server.listen(porta, () => {
        const endereco = server.address();
        const portaReal = typeof endereco === 'object' && endereco ? endereco.port : porta;
        console.log(`WebSocket Service iniciado na porta ${portaReal}.`);
        console.log(`Interface web: http://localhost:${portaReal}`);
        console.log(`Endpoint WebSocket: ws://localhost:${portaReal}${WS_PATH}`);
        console.log(`Status HTTP: http://localhost:${portaReal}/status`);
        console.log(`Broadcast HTTP: POST http://localhost:${portaReal}/broadcast`);
        console.log(`Codespaces: abra a porta ${portaReal} no navegador e use a URL pública https://<seu-codespace>-${portaReal}.app.github.dev`);
        console.log(`WebSocket Codespaces: wss://<seu-codespace>-${portaReal}.app.github.dev${WS_PATH}`);        
    });

    return server;
}

if (require.main === module) {
    iniciarServidor();
}

module.exports = {
    criarServidor,
    iniciarServidor,
    codificarFrame,
    decodificarFrames,
    montarUrlsPublicas
};