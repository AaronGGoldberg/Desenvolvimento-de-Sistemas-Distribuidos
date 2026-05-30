const API = '/gateway';

const resultado = document.getElementById('resultado');
const statusBadge = document.getElementById('statusBadge');
const tabelaContas = document.getElementById('tabelaContas');
const tabelaTransacoes = document.getElementById('tabelaTransacoes');
const metricTotalContas = document.getElementById('metricTotalContas');
const metricTotalTransacoes = document.getElementById('metricTotalTransacoes');
const metricSaldo = document.getElementById('metricSaldo');
const hateoasActions = document.getElementById('hateoasActions');

function atualizarStatus(texto, tipo = '') {
    statusBadge.textContent = texto;
    statusBadge.className = 'status-badge';

    if (tipo) {
        statusBadge.classList.add(tipo);
    }
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function mostrarResultado(dados, tipo = 'info') {
    resultado.textContent = JSON.stringify(dados, null, 2);
    renderizarBotoesHateoas(dados);

    if (tipo === 'success') {
        atualizarStatus('Operação realizada com sucesso', 'success');
    } else if (tipo === 'error') {
        atualizarStatus('Ocorreu um erro na operação', 'error');
    } else {
        atualizarStatus('Resultado atualizado', 'info');
    }
}

function mostrarErro(mensagem, detalhe = '') {
    ocultarBotoesHateoas();    
    mostrarResultado(
        {
            sucesso: false,
            mensagem,
            detalhe
        },
        'error'
    );
}

function ocultarBotoesHateoas() {
    hateoasActions.innerHTML = '';
    hateoasActions.classList.add('hidden');
}

function obterRotuloHateoas(relacao, metodo) {
    const rotulos = {
        self: 'Abrir esta conta',
        depositar: 'Depositar via HATEOAS',
        sacar: 'Sacar via HATEOAS',
        transacoes: 'Ver transações',
        saldo: 'Consultar saldo',
        listarContas: 'Listar contas',
        home: 'Abrir início',
        documentacao: 'Abrir Swagger'
    };

    return rotulos[relacao] || `${metodo} ${relacao}`;
}

function renderizarBotoesHateoas(dados) {
    if (!dados || !dados._links || typeof dados._links !== 'object') {
        ocultarBotoesHateoas();
        return;
    }

    const botoes = Object.entries(dados._links)
        .filter(([, link]) => link && link.href)
        .map(([relacao, link]) => {
            const metodo = link.method || (['depositar', 'sacar'].includes(relacao) ? 'POST' : 'GET');
            const rotulo = obterRotuloHateoas(relacao, metodo);

            return `
                <button
                    type="button"
                    class="hateoas-button"
                    data-rel="${relacao}"
                    data-href="${link.href}"
                    data-method="${metodo}"
                    onclick="executarAcaoHateoas(this)"
                >
                    <span>${rotulo}</span>
                    <small>${metodo}</small>
                </button>
            `;
        })
        .join('');

    hateoasActions.innerHTML = `
        <div class="hateoas-header">
            <strong>Ações HATEOAS</strong>
            <span>Clique em um botão para seguir o endpoint relacionado.</span>
        </div>
        <div class="hateoas-buttons">
            ${botoes}
        </div>
    `;
    hateoasActions.classList.remove('hidden');
}

async function executarAcaoHateoas(botao) {
    const relacao = botao.dataset.rel;
    const href = botao.dataset.href;
    const metodo = botao.dataset.method || 'GET';

    try {
        if (relacao === 'home' || relacao === 'documentacao') {
            window.open(href, '_blank');
            atualizarStatus('Link HATEOAS aberto em nova aba', 'info');
            return;
        }

        let opcoes = { method: metodo };

        if (metodo === 'POST') {
            const valorDigitado = window.prompt(`Informe o valor para ${relacao}:`);

            if (valorDigitado === null) {
                atualizarStatus('Ação HATEOAS cancelada', 'info');
                return;
            }

            const valor = Number(valorDigitado.replace(',', '.'));

            if (!valor || valor <= 0) {
                return mostrarErro('Informe um valor maior que zero para executar esta ação HATEOAS.');
            }

            opcoes = {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor })
            };
        }

        atualizarStatus(`Executando ${metodo} ${relacao}...`, 'info');

        const resposta = await fetch(href, opcoes);
        const dados = await tratarResposta(resposta);

        mostrarResultado(dados, 'success');

        if (Array.isArray(dados) && relacao === 'listarContas') {
            renderizarTabelaContas(dados);
        }

        if (Array.isArray(dados) && relacao === 'transacoes') {
            renderizarTabelaTransacoes(dados);
        }

        if (typeof dados.saldo !== 'undefined') {
            metricSaldo.textContent = formatarMoeda(dados.saldo);
        }
    } catch (erro) {
        mostrarErro('Erro ao executar ação HATEOAS.', erro.message);
    }
}

function limparResultado() {
    resultado.textContent = `{
  "mensagem": "Área de resultado limpa com sucesso."
}`;
    ocultarBotoesHateoas();
    atualizarStatus('Resultado limpo', 'info');
}

function limparTabelas() {
    tabelaContas.innerHTML = `
        <tr class="empty-row">
            <td colspan="3">Nenhuma conta exibida ainda.</td>
        </tr>
    `;

    tabelaTransacoes.innerHTML = `
        <tr class="empty-row">
            <td colspan="4">Nenhuma transação exibida ainda.</td>
        </tr>
    `;

    metricTotalContas.textContent = '0';
    metricTotalTransacoes.textContent = '0';
    metricSaldo.textContent = 'R$ 0,00';

    atualizarStatus('Tabelas limpas', 'info');
}

function preencherExemplo() {
    document.getElementById('nome').value = 'Aaron Guerra Goldberg';
    document.getElementById('email').value = 'aaron@email.com';
    document.getElementById('consultaContaId').value = '1';
    document.getElementById('depositoContaId').value = '1';
    document.getElementById('depositoValor').value = '500';
    document.getElementById('saqueContaId').value = '1';
    document.getElementById('saqueValor').value = '100';
    document.getElementById('saldoContaId').value = '1';
    document.getElementById('historicoContaId').value = '1';

    atualizarStatus('Campos preenchidos com exemplo', 'info');
}

function renderizarTabelaContas(contas) {
    if (!Array.isArray(contas) || contas.length === 0) {
        tabelaContas.innerHTML = `
            <tr class="empty-row">
                <td colspan="3">Nenhuma conta encontrada.</td>
            </tr>
        `;
        metricTotalContas.textContent = '0';
        return;
    }

    tabelaContas.innerHTML = contas.map(conta => `
        <tr>
            <td>${conta.id}</td>
            <td>${conta.nome}</td>
            <td>${conta.email}</td>
        </tr>
    `).join('');

    metricTotalContas.textContent = String(contas.length);
}

function renderizarTabelaTransacoes(transacoes) {
    if (!Array.isArray(transacoes) || transacoes.length === 0) {
        tabelaTransacoes.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">Nenhuma transação encontrada.</td>
            </tr>
        `;
        metricTotalTransacoes.textContent = '0';
        return;
    }

    tabelaTransacoes.innerHTML = transacoes.map(transacao => `
        <tr>
            <td>${transacao.id}</td>
            <td>${transacao.contaId}</td>
            <td>
                <span class="badge-tipo ${transacao.tipo}">
                    ${transacao.tipo}
                </span>
            </td>
            <td>${formatarMoeda(transacao.valor)}</td>
        </tr>
    `).join('');

    metricTotalTransacoes.textContent = String(transacoes.length);
}

async function tratarResposta(resposta) {
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro na requisição.');
    }

    return dados;
}

async function criarConta() {
    try {
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!nome || !email) {
            return mostrarErro('Preencha nome e email antes de criar a conta.');
        }

        atualizarStatus('Criando conta...', 'info');

        const resposta = await fetch(`${API}/contas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email })
        });

        const dados = await tratarResposta(resposta);
        mostrarResultado(dados, 'success');

        document.getElementById('nome').value = '';
        document.getElementById('email').value = '';

        await listarContas();
    } catch (erro) {
        mostrarErro('Erro ao criar conta.', erro.message);
    }
}

async function listarContas() {
    try {
        atualizarStatus('Listando contas...', 'info');

        const resposta = await fetch(`${API}/contas`);
        const dados = await tratarResposta(resposta);

        mostrarResultado(dados, 'success');
        renderizarTabelaContas(dados);
    } catch (erro) {
        mostrarErro('Erro ao listar contas.', erro.message);
    }
}

async function consultarConta() {
    try {
        const id = document.getElementById('consultaContaId').value;

        if (!id) {
            return mostrarErro('Informe o ID da conta que deseja consultar.');
        }

        atualizarStatus('Consultando conta...', 'info');

        const resposta = await fetch(`${API}/contas/${id}`);
        const dados = await tratarResposta(resposta);

        mostrarResultado(dados, 'success');

        if (typeof dados.saldo !== 'undefined') {
            metricSaldo.textContent = formatarMoeda(dados.saldo);
        }
    } catch (erro) {
        mostrarErro('Erro ao consultar conta.', erro.message);
    }
}

async function depositar() {
    try {
        const id = document.getElementById('depositoContaId').value;
        const valor = Number(document.getElementById('depositoValor').value);

        if (!id || !valor || valor <= 0) {
            return mostrarErro('Informe um ID válido e um valor maior que zero para depósito.');
        }

        atualizarStatus('Realizando depósito...', 'info');

        const resposta = await fetch(`${API}/contas/${id}/deposito`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor })
        });

        const dados = await tratarResposta(resposta);
        mostrarResultado(dados, 'success');

        document.getElementById('depositoValor').value = '';
        document.getElementById('saldoContaId').value = id;
        document.getElementById('historicoContaId').value = id;
        document.getElementById('consultaContaId').value = id;

        await consultarSaldoSilencioso(id);
        await listarTransacoesSilencioso(id);
    } catch (erro) {
        mostrarErro('Erro ao depositar.', erro.message);
    }
}

async function sacar() {
    try {
        const id = document.getElementById('saqueContaId').value;
        const valor = Number(document.getElementById('saqueValor').value);

        if (!id || !valor || valor <= 0) {
            return mostrarErro('Informe um ID válido e um valor maior que zero para saque.');
        }

        atualizarStatus('Realizando saque...', 'info');

        const resposta = await fetch(`${API}/contas/${id}/saque`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor })
        });

        const dados = await tratarResposta(resposta);
        mostrarResultado(dados, 'success');

        document.getElementById('saqueValor').value = '';
        document.getElementById('saldoContaId').value = id;
        document.getElementById('historicoContaId').value = id;
        document.getElementById('consultaContaId').value = id;

        await consultarSaldoSilencioso(id);
        await listarTransacoesSilencioso(id);
    } catch (erro) {
        mostrarErro('Erro ao sacar.', erro.message);
    }
}

async function consultarSaldo() {
    try {
        const id = document.getElementById('saldoContaId').value;

        if (!id) {
            return mostrarErro('Informe o ID da conta para consultar o saldo.');
        }

        atualizarStatus('Consultando saldo...', 'info');

        const resposta = await fetch(`${API}/contas/${id}/saldo`);
        const dados = await tratarResposta(resposta);

        mostrarResultado(dados, 'success');
        metricSaldo.textContent = formatarMoeda(dados.saldo);
    } catch (erro) {
        mostrarErro('Erro ao consultar saldo.', erro.message);
    }
}

async function listarTransacoes() {
    try {
        const id = document.getElementById('historicoContaId').value;

        if (!id) {
            return mostrarErro('Informe o ID da conta para visualizar o histórico.');
        }

        atualizarStatus('Consultando histórico...', 'info');

        const resposta = await fetch(`${API}/contas/${id}/transacoes`);
        const dados = await tratarResposta(resposta);

        mostrarResultado(dados, 'success');
        renderizarTabelaTransacoes(dados);
    } catch (erro) {
        mostrarErro('Erro ao listar transações.', erro.message);
    }
}

async function consultarSaldoSilencioso(id) {
    try {
        const resposta = await fetch(`${API}/contas/${id}/saldo`);
        const dados = await tratarResposta(resposta);
        metricSaldo.textContent = formatarMoeda(dados.saldo);
    } catch (erro) {
        console.error('Erro ao atualizar saldo automaticamente:', erro.message);
    }
}

async function listarTransacoesSilencioso(id) {
    try {
        const resposta = await fetch(`${API}/contas/${id}/transacoes`);
        const dados = await tratarResposta(resposta);
        renderizarTabelaTransacoes(dados);
    } catch (erro) {
        console.error('Erro ao atualizar transações automaticamente:', erro.message);
    }
}