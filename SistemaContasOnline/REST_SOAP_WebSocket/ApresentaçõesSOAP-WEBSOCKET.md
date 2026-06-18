Aluno: Aaron Guerra Goldberg
# Apresentação resumida — SOAP

## 1. Pontos principais

- O módulo SOAP expõe um serviço acadêmico de contas na porta **3003**.
- Possui duas operações principais:
  - **consultarConta**: recebe `contaId` e retorna id, nome, e-mail, saldo e status.
  - **simularOperacao**: recebe `contaId`, `tipo` (`deposito` ou `saque`) e `valor`, atualizando o saldo em memória.
- Os dados das contas ficam em um array em memória no servidor.
- Em caso de erro, o servidor responde com **SOAP Fault**.
- O contrato do serviço está documentado no arquivo **WSDL**.

## 2. Como foi usado o frontend

- Nesta parte, o foco não é uma tela web principal.
- A demonstração pode ser feita de duas formas:
  - pelo **SoapUI**, importando a URL do WSDL;
  - pelo cliente Python em terminal, que monta envelopes SOAP e mostra um resumo da resposta.

## 3. Libs utilizadas

- **Servidor SOAP (`soap-service/server.js`)**:
  - usa apenas módulos nativos do Node.js: `http`, `fs` e `path`.
- **Cliente SOAP (`soap-client/client.py`)**:
  - usa apenas módulos nativos do Python: `http.client` e `xml.dom.minidom`.
- Não há dependência externa obrigatória para rodar essa parte.

## 4. URL de acesso

- Endpoint SOAP local:

```text
http://localhost:3003/soap
```

- WSDL local:

```text
http://localhost:3003/soap?wsdl
```

- Em Codespaces:

```text
https://<seu-codespace>-3003.app.github.dev/soap
https://<seu-codespace>-3003.app.github.dev/soap?wsdl
```

## 5. SOAP servidor e cliente: implementação

### Servidor

- O servidor cria um HTTP server e aceita:
  - `GET /soap?wsdl` para entregar o WSDL;
  - `POST /soap` para receber envelopes SOAP.
- A função `identificarOperacao` verifica se o XML recebido contém:
  - `consultarContaRequest`; ou
  - `simularOperacaoRequest`.
- A função `extrairValor` pega valores dentro das tags XML, como `contaId`, `tipo` e `valor`.
- As respostas são montadas dentro de um envelope SOAP usando `envelopeSoap`.
- Se algo der errado, como conta inexistente ou saque sem saldo, o servidor monta um `soapFault`.

### Cliente

- O cliente Python usa um menu no terminal.
- Ele monta o envelope SOAP com a função `envelope`.
- Envia a requisição com `HTTPConnection` para `localhost:3003/soap`.
- Depois lê o XML de resposta e exibe um resumo da consulta ou operação.
- Também permite mostrar o XML SOAP completo para explicar ao professor.

## 6. Termos específicos do projeto

- **SOAP**: protocolo baseado em XML para troca de mensagens entre cliente e servidor.
- **Envelope SOAP**: estrutura XML principal da mensagem, contendo `Header` e `Body`.
- **WSDL**: arquivo que descreve o serviço, operações, mensagens e URL de acesso.
- **SOAPAction**: cabeçalho HTTP usado para indicar a operação SOAP chamada.
- **SOAP Fault**: resposta padronizada de erro em SOAP.
- **Namespace (`tns`, `soapenv`, `con`)**: prefixos XML usados para diferenciar elementos do SOAP e do serviço.
- **Dados em memória**: as contas ficam em variáveis no servidor; ao reiniciar o servidor, voltam ao estado inicial.

## 7. Como rodar para demonstrar

### Terminal 1 — iniciar o servidor

```bash
cd SistemaContasOnline/REST_SOAP_WebSocket
node soap-service/server.js
```

### Terminal 2 — rodar o cliente

```bash
cd SistemaContasOnline/REST_SOAP_WebSocket
python3 soap-client/client.py
```

### Demonstração sugerida

1. Abrir `http://localhost:3003/soap?wsdl` no navegador ou SoapUI.
2. Executar a opção **1 - Consultar conta** com `contaId = 1`.
3. Executar a opção **2 - Simular depósito ou saque**.
4. Testar um saque maior que o saldo para mostrar o **SOAP Fault**.


# Apresentação resumida — WebSocket

## 1. Pontos principais

- O módulo WebSocket implementa notificações em tempo real na porta **3004**.
- Permite comunicação bidirecional: cliente envia mensagem para o servidor e o servidor envia para todos os clientes conectados.
- Cada aba aberta no navegador vira um cliente WebSocket.
- O servidor mantém uma lista de clientes conectados e envia atualizações de presença.
- Também existe uma rota HTTP para disparar mensagens de broadcast.

## 2. Como foi usado o frontend

- O frontend está em `websocket-service/public`.
- A tela mostra:
  - status da conexão;
  - URL WebSocket usada;
  - ID/nome do cliente;
  - quantidade de clientes conectados;
  - formulário para enviar mensagens;
  - lista de mensagens recebidas em tempo real.
- O JavaScript da página cria a conexão com:

```js
new WebSocket(websocketUrl)
```

- Se a conexão cair, a interface tenta reconectar automaticamente.

## 3. Libs utilizadas

- **Servidor WebSocket (`websocket-service/server.js`)**:
  - usa apenas módulos nativos do Node.js: `http`, `crypto`, `fs` e `path`.
- **Frontend**:
  - HTML, CSS e JavaScript puro.
- Não usa a biblioteca `ws`; o handshake e os frames WebSocket foram implementados manualmente.

## 4. URL de acesso

- Interface web local:

```text
http://localhost:3004
```

- Endpoint WebSocket local:

```text
ws://localhost:3004/ws
```

- Status HTTP:

```text
http://localhost:3004/status
```

- Broadcast HTTP:

```text
POST http://localhost:3004/broadcast
```

- Em Codespaces:

```text
https://<seu-codespace>-3004.app.github.dev
wss://<seu-codespace>-3004.app.github.dev/ws
```

## 5. WebSocket servidor: implementação

- O servidor HTTP atende arquivos estáticos da pasta `public`.
- Quando recebe evento `upgrade` no caminho `/ws`, faz o handshake WebSocket.
- O handshake usa o cabeçalho `Sec-WebSocket-Key` e gera `Sec-WebSocket-Accept` com SHA-1 + Base64.
- Cada conexão recebe um ID sequencial, como `cliente-1`.
- As conexões ficam guardadas em um `Map`, usando o ID como chave.
- A função `broadcast` envia uma mensagem para todos os clientes conectados.
- As funções `codificarFrame` e `decodificarFrames` tratam os frames WebSocket manualmente.
- Um heartbeat envia mensagens periódicas de monitoramento para mostrar que a conexão continua ativa.

## 6. SOAP servidor e cliente: relação com esta parte

- Nesta apresentação, SOAP não é o foco.
- A diferença principal é:
  - **SOAP** funciona por requisição/resposta HTTP com XML.
  - **WebSocket** mantém uma conexão aberta para troca contínua de mensagens.
- Por isso, o WebSocket é mais adequado para notificações em tempo real.

## 7. Termos específicos do projeto

- **WebSocket**: protocolo que mantém conexão persistente entre cliente e servidor.
- **Handshake**: etapa inicial que transforma uma conexão HTTP em WebSocket.
- **Upgrade**: cabeçalho/evento usado para trocar de HTTP para WebSocket.
- **Frame**: pacote de dados enviado pelo WebSocket.
- **Broadcast**: envio da mesma mensagem para todos os clientes conectados.
- **Heartbeat**: mensagem periódica para indicar que o servidor continua ativo.
- **Map**: estrutura do JavaScript usada para guardar clientes conectados no formato chave/valor; aqui a chave é o ID do cliente.
- **JSON**: formato usado nas mensagens, com campos como `tipo`, `origem`, `texto` e `dataHora`.

## 8. Como rodar para demonstrar

### Terminal — iniciar o servidor

```bash
cd SistemaContasOnline/REST_SOAP_WebSocket
node websocket-service/server.js
```

### Navegador

1. Abrir `http://localhost:3004`.
2. Abrir a mesma URL em outra aba.
3. Identificar cada cliente com nomes diferentes.
4. Enviar uma mensagem em uma aba e observar o broadcast chegando nas duas.
5. Opcional: acessar `http://localhost:3004/status` para ver os clientes conectados.

### Broadcast via terminal

```bash
curl -X POST http://localhost:3004/broadcast \
  -H "Content-Type: application/json" \
  -d '{"texto":"Mensagem enviada pelo endpoint HTTP"}'
```