const statusIndicator = document.getElementById('status-indicator');
const connectionStatus = document.getElementById('connection-status');
const wsUrlElement = document.getElementById('ws-url');
const clientIdElement = document.getElementById('client-id');
const clientCountElement = document.getElementById('client-count');
const messagesElement = document.getElementById('messages');
const nameForm = document.getElementById('name-form');
const clientNameInput = document.getElementById('client-name');
const messageForm = document.getElementById('message-form');
const messageText = document.getElementById('message-text');
const clearLogButton = document.getElementById('clear-log');
const quickActionButtons = document.querySelectorAll('[data-message]');

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const websocketUrl = `${protocol}//${window.location.host}/ws`;
let socket;
let meuClienteId = '';
let tentativasReconexao = 0;

wsUrlElement.textContent = websocketUrl;

function atualizarStatus(online, texto) {
  statusIndicator.classList.toggle('online', online);
  statusIndicator.classList.toggle('offline', !online);
  connectionStatus.textContent = texto;
  messageText.disabled = !online;
}

function enviar(dados) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    adicionarMensagem({
      tipo: 'erro',
      origem: 'interface',
      texto: 'A conexão WebSocket ainda não está aberta.'
    });
    return;
  }

  socket.send(JSON.stringify(dados));
}

function formatarHora(dataHora) {
  if (!dataHora) {
    return new Date().toLocaleTimeString('pt-BR');
  }

  return new Date(dataHora).toLocaleTimeString('pt-BR');
}

function adicionarMensagem(mensagem) {
  const item = document.createElement('li');
  item.className = mensagem.tipo || 'mensagem';

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.innerHTML = `
    <span>${formatarHora(mensagem.dataHora)}</span>
    <span>${mensagem.tipo || 'mensagem'}</span>
    <span>${mensagem.origem || mensagem.nome || 'servidor'}</span>
  `;

  const texto = document.createElement('div');
  texto.textContent = mensagem.texto || JSON.stringify(mensagem);

  item.append(meta, texto);
  messagesElement.prepend(item);
}

function tratarMensagem(evento) {
  let mensagem;

  try {
    mensagem = JSON.parse(evento.data);
  } catch (erro) {
    mensagem = { tipo: 'mensagem', texto: evento.data };
  }

  if (mensagem.tipo === 'boas-vindas') {
    meuClienteId = mensagem.clienteId;
    clientIdElement.textContent = mensagem.nome || mensagem.clienteId;
  }

  if (mensagem.tipo === 'clientes') {
    clientCountElement.textContent = mensagem.total;
    return;
  }

  adicionarMensagem(mensagem);
}

function conectar() {
  atualizarStatus(false, 'Conectando...');
  socket = new WebSocket(websocketUrl);

  socket.addEventListener('open', () => {
    tentativasReconexao = 0;
    atualizarStatus(true, 'Conectado');
    adicionarMensagem({
      tipo: 'sistema',
      origem: 'interface',
      texto: 'Conexão WebSocket aberta. Agora é possível enviar e receber mensagens em tempo real.'
    });
  });

  socket.addEventListener('message', tratarMensagem);

  socket.addEventListener('close', () => {
    atualizarStatus(false, 'Desconectado');
    clientCountElement.textContent = '0';
    adicionarMensagem({
      tipo: 'sistema',
      origem: 'interface',
      texto: 'Conexão encerrada. Tentando reconectar automaticamente...'
    });

    const atraso = Math.min(1000 * 2 ** tentativasReconexao, 8000);
    tentativasReconexao += 1;
    setTimeout(conectar, atraso);
  });

  socket.addEventListener('error', () => {
    atualizarStatus(false, 'Erro na conexão');
  });
}

nameForm.addEventListener('submit', event => {
  event.preventDefault();
  const nome = clientNameInput.value.trim();

  if (!nome) {
    return;
  }

  enviar({ tipo: 'identificacao', nome });
  clientIdElement.textContent = nome;
});

messageForm.addEventListener('submit', event => {
  event.preventDefault();
  const texto = messageText.value.trim();

  if (!texto) {
    return;
  }

  enviar({ tipo: 'notificacao', texto });
  messageText.value = '';
  messageText.focus();
});

quickActionButtons.forEach(button => {
  button.addEventListener('click', () => {
    messageText.value = button.dataset.message;
    messageForm.requestSubmit();
  });
});

clearLogButton.addEventListener('click', () => {
  messagesElement.innerHTML = '';
});

conectar();