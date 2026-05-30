# Sistema de Gerenciamento de Contas Online

## Descrição

Este projeto foi desenvolvido para a disciplina de **Sistemas Distribuídos** e tem como objetivo implementar uma arquitetura baseada em **microsserviços**, utilizando um **API Gateway** como ponto central de acesso.

O sistema permite realizar operações básicas de gerenciamento de contas, como:

* Criar contas
* Listar contas
* Consultar conta por ID
* Depositar valores
* Sacar valores
* Consultar saldo
* Visualizar histórico de transações

Além disso, o sistema implementa o conceito de **HATEOAS**, permitindo a navegação entre recursos da API de forma dinâmica.

---

## Arquitetura do Sistema

O sistema foi dividido em três partes principais:

### 🔹 1. Contas Service

Responsável pelo gerenciamento das contas:

* Criação de contas
* Listagem de contas
* Consulta por ID

### 🔹 2. Transações Service

Responsável pelas operações financeiras:

* Depósito
* Saque
* Consulta de saldo
* Histórico de transações

### 🔹 3. API Gateway

Responsável por:

* Centralizar o acesso às APIs
* Implementar HATEOAS
* Integrar os microsserviços
* Expor a documentação Swagger

### 🔹 4. Cliente Web

Interface desenvolvida com:

* HTML
* CSS
* JavaScript

O frontend consome **apenas o Gateway**, sem acessar diretamente os serviços internos.

---

## Tecnologias Utilizadas

* Node.js
* Express
* Axios
* Swagger (swagger-ui-express)
* HTML / CSS / JavaScript
* GitHub Codespaces

---

## API Gateway

O API Gateway roda na porta:

```
http://localhost:3000
```

Ou no Codespaces:

```
https://<seu-endereco>.app.github.dev
```

---

## Documentação da API (Swagger)

A documentação pode ser acessada em:

```
/api-docs
```

Exemplo:

```
http://localhost:3000/api-docs
```

---

## HATEOAS

O sistema implementa HATEOAS na rota:

```
GET /gateway/contas/{id}
```

Exemplo de resposta:

```json
{
  "id": 1,
  "nome": "Aaron",
  "email": "aaron@email.com",
  "saldo": 500,
  "_links": {
    "self": { "href": "/gateway/contas/1", "method": "GET" },
    "depositar": { "href": "/gateway/contas/1/deposito", "method": "POST" },
    "sacar": { "href": "/gateway/contas/1/saque", "method": "POST" },
    "transacoes": { "href": "/gateway/contas/1/transacoes", "method": "GET" },
    "saldo": { "href": "/gateway/contas/1/saldo", "method": "GET" }
  }
}
```

---

## Como executar o projeto

### 1. Instalar dependências:

OBS.: Não esquecer de usar os comandos para visualizar as versões do (node -v) e (npm -v) e para instalação (nvm install 18) (caso seja clonado para outro servidor) 

Em cada pasta:

```
contas-service
transacoes-service
gateway
```

Execute:

```bash
npm install
```

---

### 2. Rodar os serviços

Abra **3 terminais**:

#### Terminal 1:

```bash
cd contas-service
node server.js
```

#### Terminal 2:

```bash
cd transacoes-service
node server.js
```

#### Terminal 3:

```bash
cd gateway
node server.js
```

---

### 3. Acessar o sistema

Frontend:

```
http://localhost:3000
```

---

## Funcionalidades demonstradas

* ✔ Criação de conta
* ✔ Listagem de contas
* ✔ Consulta de conta
* ✔ Depósito
* ✔ Saque com validação de saldo
* ✔ Consulta de saldo
* ✔ Histórico de transações
* ✔ Navegação via HATEOAS
* ✔ Documentação Swagger

---

## Estrutura do Projeto

```
SistemaContasOnline/
│
├── contas-service/
├── transacoes-service/
├── gateway/
├── cliente-web/
└── README.md
```

---

## Objetivo acadêmico

Este projeto tem como finalidade demonstrar na prática:

* Arquitetura de microsserviços
* Uso de API Gateway
* Integração entre serviços
* Implementação de HATEOAS
* Documentação de APIs com Swagger

---

## Autor

Aaron Guerra Goldberg
IFRN - Análise e Desenvolvimento de Sistemas

---

## Conclusão

O projeto conseguiu simular um sistema distribuído funcional, aplicando conceitos importantes da disciplina de Sistemas Distribuídos, como separação de responsabilidades, comunicação entre serviços e centralização via API Gateway.

---

## Serviço SOAP acadêmico

Além das APIs REST do Gateway, o projeto também possui um micro-serviço SOAP pequeno para demonstração de interoperabilidade.

A ideia desta parte da atividade é mostrar o mesmo tema do sistema de contas online, mas usando SOAP em vez de REST/JSON. Aqui a comunicação principal é feita com XML, Envelope SOAP, Body, namespaces e um contrato WSDL.

### O que foi implementado

Foi implementado um servidor SOAP em Node.js e um cliente consumidor em Python. Isso ajuda a demonstrar interoperabilidade, porque o provedor do serviço e o consumidor foram feitos em linguagens diferentes.

O servidor SOAP expõe:

1. `consultarConta`
   * Recebe: `contaId`
   * Retorna: `contaId`, `nome`, `email`, `saldo`, `status`

2. `simularOperacao`
   * Recebe: `contaId`, `tipo` (`deposito` ou `saque`) e `valor`
   * Retorna: `contaId`, `tipo`, `valor`, `saldoAntes`, `saldoDepois`, `mensagem`

Em caso de entrada inválida, conta inexistente, tipo de operação inválido ou saque sem saldo suficiente, o servidor retorna um `soapenv:Fault`.

### Estrutura SOAP no projeto

```text
soap-service/
├── server.js
├── contas-online.wsdl
└── requests/
    ├── consultar-conta.xml
    ├── simular-operacao.xml
    └── chamada-invalida.xml

soap-client/
└── client.py
```

Explicando cada parte:

* `soap-service/server.js`: servidor SOAP em Node.js. Ele publica o endpoint `/soap`, entrega o WSDL em `/soap?wsdl`, interpreta o XML recebido e devolve XML SOAP.
* `soap-service/contas-online.wsdl`: contrato WSDL do serviço. Ele descreve operações, mensagens, tipos de entrada/saída, binding SOAP e endereço do endpoint.
* `soap-service/requests/consultar-conta.xml`: exemplo de chamada SOAP válida para consultar uma conta.
* `soap-service/requests/simular-operacao.xml`: exemplo de chamada SOAP válida para simular depósito ou saque.
* `soap-service/requests/chamada-invalida.xml`: exemplo de chamada SOAP inválida, usada para demonstrar o retorno de erro `soapenv:Fault`.
* `soap-client/client.py`: cliente consumidor em Python. Ele monta Envelopes SOAP e chama o servidor Node.js.

### Endpoints do serviço SOAP

Quando estiver rodando localmente na própria máquina:

```text
Endpoint SOAP: http://localhost:3003/soap
WSDL:          http://localhost:3003/soap?wsdl
```

Quando estiver rodando no GitHub Codespaces, use a URL pública da porta `3003`. O formato normalmente fica assim:

```text
Endpoint SOAP: https://<seu-codespace>-3003.app.github.dev/soap
WSDL:          https://<seu-codespace>-3003.app.github.dev/soap?wsdl
```

O WSDL é servido com `soap:address` dinâmico. Isso significa que:

* se você abrir pelo `localhost`, o WSDL aponta para `http://localhost:3003/soap`;
* se você abrir pela URL pública do Codespaces, o WSDL aponta para `https://<seu-codespace>-3003.app.github.dev/soap`.
Isso foi feito para facilitar o uso no SoapUI, evitando ter que trocar manualmente o endpoint depois de importar o WSDL.

### Pré-requisitos

Para rodar a parte SOAP, você precisa ter:

* Node.js instalado, para executar o servidor SOAP;
* Python 3 instalado, para executar o cliente consumidor;
* SoapUI instalado, para validar o WSDL e testar chamadas SOAP pela interface gráfica.

No Codespaces, Node.js e Python normalmente já ficam disponíveis. O SoapUI geralmente é instalado no computador local do aluno.

### Como executar o servidor SOAP

Abra um terminal na pasta do projeto e execute:

```bash
cd SistemaContasOnline/REST_SOAP/soap-service
node server.js
```

A saída esperada será parecida com:

```text
SOAP Service iniciado na porta 3003.
Localhost: http://localhost:3003/soap
WSDL localhost: http://localhost:3003/soap?wsdl
Codespaces: use a URL pública da porta 3003 no formato https://<seu-codespace>-3003.app.github.dev/soap
WSDL Codespaces: https://<seu-codespace>-3003.app.github.dev/soap?wsdl
```

Esse terminal precisa ficar aberto enquanto você testa o serviço.

### Como testar rapidamente no navegador

Com o servidor rodando, abra no navegador:

```text
http://localhost:3003/soap?wsdl
```

Ou, no Codespaces:

```text
https://<seu-codespace>-3003.app.github.dev/soap?wsdl
```

Se aparecer um XML começando com `<definitions>`, o WSDL está funcionando.

Atenção: abrir apenas `/soap` no navegador não executa uma operação SOAP. O endpoint `/soap` espera uma requisição `POST` com XML SOAP no corpo. Por isso o navegador deve ser usado principalmente para conferir o WSDL em `/soap?wsdl`.

### Como executar o cliente consumidor Python

Com o servidor SOAP ainda rodando em um terminal, abra outro terminal e execute:

```bash
cd SistemaContasOnline/REST_SOAP/soap-client
python3 client.py
```

O cliente Python executa três chamadas:

1. consulta válida da conta `1`;
2. simulação válida de depósito;
3. simulação inválida de saque acima do saldo, para gerar `soapenv:Fault`.

Isso ajuda a demonstrar que um serviço feito em Node.js pode ser consumido por um cliente feito em Python.

### Como testar com curl, se quiser

Consulta válida:

```bash
curl -X POST http://localhost:3003/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  --data-binary @soap-service/requests/consultar-conta.xml
```

Simulação válida:

```bash
curl -X POST http://localhost:3003/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  --data-binary @soap-service/requests/simular-operacao.xml
```

Chamada inválida para testar `soapenv:Fault`:

```bash
curl -X POST http://localhost:3003/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  --data-binary @soap-service/requests/chamada-invalida.xml
```

No Codespaces, troque `http://localhost:3003/soap` pela URL pública da porta `3003`:

```text
https://<seu-codespace>-3003.app.github.dev/soap
```

### Como testar no SoapUI

O SoapUI é a ferramenta pedida na atividade para validar o serviço SOAP visualmente.

Passo a passo:

1. Baixe e instale o SoapUI Open Source no seu computador.
2. Inicie o servidor SOAP com `node soap-service/server.js`.
3. Se estiver usando Codespaces, vá na aba `Ports` e deixe a porta `3003` como `Public`.
4. No navegador, confirme que o WSDL abre:
   * local: `http://localhost:3003/soap?wsdl`
   * Codespaces: `https://<seu-codespace>-3003.app.github.dev/soap?wsdl`
5. Abra o SoapUI.
6. Clique em `File > New SOAP Project`.
7. Em `Project Name`, use um nome como `ContasOnlineSOAP`.
8. Em `Initial WSDL`, informe:
   * local: `http://localhost:3003/soap?wsdl`; ou
   * Codespaces: `https://<seu-codespace>-3003.app.github.dev/soap?wsdl`.
9. Deixe marcada a opção de criar requisições de exemplo para todas as operações.
10. Clique em `OK`.
11. O SoapUI deverá criar as operações `consultarConta` e `simularOperacao`.
12. Abra `consultarConta > Request 1`, confira o XML e clique no botão verde para executar.
13. Abra `simularOperacao > Request 1`, informe `contaId`, `tipo` e `valor`, e execute.
14. Para testar erro, use `tipo` como `saque` e `valor` como `9999.00`. A resposta esperada é um `soapenv:Fault`.

Os XMLs prontos para copiar e colar no SoapUI estão em `soap-service/requests/`.

### Prints recomendados para a entrega

Para mostrar evidências, tirei prints de:

1. servidor SOAP rodando no terminal;
2. WSDL aberto no navegador;
3. cliente Python executando `python3 client.py`;
4. SoapUI executando uma chamada válida;
5. SoapUI executando uma chamada inválida com `soapenv:Fault`;
6. documentação gerada pelo SoapUI.

[cd](/SistemaContasOnline/REST_SOAP/evidencias_soap/)

### Como gerar documentação no SoapUI

Depois que o projeto SOAP for criado no SoapUI:

1. clique com o botão direito na interface/binding do serviço;
2. procure a opção `Generate Documentation`;
3. escolha uma pasta para salvar;
4. abra o HTML gerado;

Essa parte atende ao requisito de exportação da documentação do serviço via SoapUI.

### Justificativa técnica

SOAP foi adequado ao cenário porque permite descrever formalmente as operações do serviço por meio de um contrato WSDL. Isso facilita a validação em ferramentas como SoapUI e demonstra interoperabilidade entre tecnologias diferentes, já que o servidor foi feito em Node.js e o cliente consumidor em Python. A principal dificuldade técnica foi tratar manualmente XML, Envelope, Body, namespaces e `soapenv:Fault`, sem depender de um framework que escondesse totalmente o funcionamento do protocolo.