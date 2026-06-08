const express = require('express');
const cors = require('cors');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Faz o gateway servir os arquivos da pasta cliente-web
app.use(express.static(path.join(__dirname, '../cliente-web')));

const CONTAS_API = 'http://localhost:3001';
const TRANSACOES_API = 'http://localhost:3002';

function buildBaseUrl(req) {
    const forwardedProtoHeader = req.get('x-forwarded-proto');
    const forwardedHostHeader = req.get('x-forwarded-host');

    const protocol = forwardedProtoHeader
        ? forwardedProtoHeader.split(',')[0].trim()
        : req.protocol;

    const host = forwardedHostHeader
        ? forwardedHostHeader.split(',')[0].trim()
        : req.get('host');

    return `${protocol}://${host}`;
}

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'API Gateway - Sistema de Contas Online',
        version: '1.0.0',
        description: 'Documentação do API Gateway do sistema de gerenciamento de contas online com suporte a HATEOAS.'
    },
    servers: [
        {
            url: '/',
            description: 'Servidor principal'
        }
    ],
    tags: [
        {
            name: 'Contas',
            description: 'Operações relacionadas às contas'
        },
        {
            name: 'Transações',
            description: 'Operações relacionadas a depósitos, saques, saldo e histórico'
        }
    ],
    components: {
        schemas: {
            ContaInput: {
                type: 'object',
                required: ['nome', 'email'],
                properties: {
                    nome: {
                        type: 'string',
                        example: 'Aaron Guerra Goldberg'
                    },
                    email: {
                        type: 'string',
                        example: 'aaron@email.com'
                    }
                }
            },
            Conta: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        example: 1
                    },
                    nome: {
                        type: 'string',
                        example: 'Aaron Guerra Goldberg'
                    },
                    email: {
                        type: 'string',
                        example: 'aaron@email.com'
                    }
                }
            },
            ValorInput: {
                type: 'object',
                required: ['valor'],
                properties: {
                    valor: {
                        type: 'number',
                        example: 500
                    }
                }
            },
            Transacao: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        example: 1
                    },
                    contaId: {
                        type: 'integer',
                        example: 1
                    },
                    tipo: {
                        type: 'string',
                        example: 'deposito'
                    },
                    valor: {
                        type: 'number',
                        example: 500
                    }
                }
            },
            Saldo: {
                type: 'object',
                properties: {
                    contaId: {
                        type: 'integer',
                        example: 1
                    },
                    saldo: {
                        type: 'number',
                        example: 400
                    }
                }
            },
            ContaComHateoas: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        example: 1
                    },
                    nome: {
                        type: 'string',
                        example: 'Aaron Guerra Goldberg'
                    },
                    email: {
                        type: 'string',
                        example: 'aaron@email.com'
                    },
                    saldo: {
                        type: 'number',
                        example: 400
                    },
                    _links: {
                        type: 'object',
                        example: {
                            self: { href: '/gateway/contas/1', method: 'GET' },
                            depositar: { href: '/gateway/contas/1/deposito', method: 'POST' },
                            sacar: { href: '/gateway/contas/1/saque', method: 'POST' },
                            transacoes: { href: '/gateway/contas/1/transacoes', method: 'GET' },
                            saldo: { href: '/gateway/contas/1/saldo', method: 'GET' },
                            listarContas: { href: '/gateway/contas', method: 'GET' },
                            home: { href: '/', method: 'GET' },
                            documentacao: { href: '/api-docs', method: 'GET' }
                        }
                    }
                }
            },
            Erro: {
                type: 'object',
                properties: {
                    mensagem: {
                        type: 'string',
                        example: 'Erro ao processar a requisição.'
                    }
                }
            }
        }
    },
    paths: {
        '/gateway/contas': {
            get: {
                tags: ['Contas'],
                summary: 'Listar contas',
                description: 'Retorna todas as contas cadastradas no sistema.',
                responses: {
                    200: {
                        description: 'Lista de contas retornada com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Conta'
                                    }
                                }
                            }
                        }
                    },
                    500: {
                        description: 'Erro interno.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Contas'],
                summary: 'Criar conta',
                description: 'Cria uma nova conta no sistema.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ContaInput'
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Conta criada com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Conta'
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Dados inválidos.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    },
                    409: {
                        description: 'Conta já existente.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/gateway/contas/{id}': {
            get: {
                tags: ['Contas'],
                summary: 'Consultar conta por ID',
                description: 'Busca os dados de uma conta específica e retorna também links HATEOAS.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'ID da conta',
                        schema: {
                            type: 'integer',
                            example: 1
                        }
                    }
                ],
                responses: {
                    200: {
                        description: 'Conta encontrada com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ContaComHateoas'
                                }
                            }
                        }
                    },
                    404: {
                        description: 'Conta não encontrada.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/gateway/contas/{id}/deposito': {
            post: {
                tags: ['Transações'],
                summary: 'Realizar depósito',
                description: 'Adiciona saldo à conta informada.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'ID da conta',
                        schema: {
                            type: 'integer',
                            example: 1
                        }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValorInput'
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Depósito realizado com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Transacao'
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Dados inválidos.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/gateway/contas/{id}/saque': {
            post: {
                tags: ['Transações'],
                summary: 'Realizar saque',
                description: 'Efetua um saque da conta informada, se houver saldo suficiente.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'ID da conta',
                        schema: {
                            type: 'integer',
                            example: 1
                        }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValorInput'
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Saque realizado com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Transacao'
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Saldo insuficiente ou dados inválidos.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Erro'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/gateway/contas/{id}/saldo': {
            get: {
                tags: ['Transações'],
                summary: 'Consultar saldo',
                description: 'Retorna o saldo atual da conta informada.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'ID da conta',
                        schema: {
                            type: 'integer',
                            example: 1
                        }
                    }
                ],
                responses: {
                    200: {
                        description: 'Saldo retornado com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Saldo'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/gateway/contas/{id}/transacoes': {
            get: {
                tags: ['Transações'],
                summary: 'Listar histórico de transações',
                description: 'Retorna todas as transações realizadas por uma conta específica.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'ID da conta',
                        schema: {
                            type: 'integer',
                            example: 1
                        }
                    }
                ],
                responses: {
                    200: {
                        description: 'Histórico retornado com sucesso.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Transacao'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota principal: abre o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente-web/index.html'));
});

// Criar conta
app.post('/gateway/contas', async (req, res) => {
    try {
        const resposta = await axios.post(`${CONTAS_API}/contas`, req.body);
        res.status(201).json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao criar conta.' });
    }
});

// Listar contas
app.get('/gateway/contas', async (req, res) => {
    try {
        const resposta = await axios.get(`${CONTAS_API}/contas`);
        res.json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao listar contas.' });
    }
});

// Buscar conta por ID com HATEOAS
app.get('/gateway/contas/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const contaResponse = await axios.get(`${CONTAS_API}/contas/${id}`);
        const saldoResponse = await axios.get(`${TRANSACOES_API}/transacoes/conta/${id}/saldo`);

        const conta = contaResponse.data;
        const saldo = saldoResponse.data.saldo;

        const baseUrl = buildBaseUrl(req);

        const resposta = {
            ...conta,
            saldo,
            _links: {
                self: { href: `${baseUrl}/gateway/contas/${id}`, method: 'GET' },
                depositar: { href: `${baseUrl}/gateway/contas/${id}/deposito`, method: 'POST' },
                sacar: { href: `${baseUrl}/gateway/contas/${id}/saque`, method: 'POST' },
                transacoes: { href: `${baseUrl}/gateway/contas/${id}/transacoes`, method: 'GET' },
                saldo: { href: `${baseUrl}/gateway/contas/${id}/saldo`, method: 'GET' },
                listarContas: { href: `${baseUrl}/gateway/contas`, method: 'GET' },
                home: { href: `${baseUrl}/`, method: 'GET' },
                documentacao: { href: `${baseUrl}/api-docs`, method: 'GET' }
            }
        };

        res.json(resposta);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao buscar conta.' });
    }
});

// Depositar
app.post('/gateway/contas/:id/deposito', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { valor } = req.body;

        const resposta = await axios.post(`${TRANSACOES_API}/transacoes/deposito`, {
            contaId: id,
            valor
        });

        res.status(201).json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao realizar depósito.' });
    }
});

// Sacar
app.post('/gateway/contas/:id/saque', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { valor } = req.body;

        const resposta = await axios.post(`${TRANSACOES_API}/transacoes/saque`, {
            contaId: id,
            valor
        });

        res.status(201).json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao realizar saque.' });
    }
});

// Consultar saldo
app.get('/gateway/contas/:id/saldo', async (req, res) => {
    try {
        const id = req.params.id;
        const resposta = await axios.get(`${TRANSACOES_API}/transacoes/conta/${id}/saldo`);
        res.json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao consultar saldo.' });
    }
});

// Listar transações
app.get('/gateway/contas/:id/transacoes', async (req, res) => {
    try {
        const id = req.params.id;
        const resposta = await axios.get(`${TRANSACOES_API}/transacoes/conta/${id}`);
        res.json(resposta.data);
    } catch (erro) {
        if (erro.response) {
            return res.status(erro.response.status).json(erro.response.data);
        }

        res.status(500).json({ mensagem: 'Erro ao listar transações.' });
    }
});

app.listen(PORT, () => {
    console.log(`Gateway rodando em http://localhost:${PORT}`);
});