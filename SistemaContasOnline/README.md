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
