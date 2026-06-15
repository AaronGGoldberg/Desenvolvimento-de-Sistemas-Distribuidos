from xml.dom import minidom
from http.client import HTTPConnection

HOST = 'localhost'
PORT = 3003
ENDPOINT = '/soap'
NAMESPACE = 'http://contasonline.soap/'


def envelope(body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:con="{NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
{body}
  </soapenv:Body>
</soapenv:Envelope>'''


def formatar_xml(xml):
    try:
        return minidom.parseString(xml).toprettyxml(indent='  ')
    except Exception:
        return xml

def extrair_texto(xml, tag):
    try:
        documento = minidom.parseString(xml)
        elementos = documento.getElementsByTagName(f'tns:{tag}')

        if not elementos:
            elementos = documento.getElementsByTagName(tag)

        if not elementos or not elementos[0].firstChild:
            return ''

        return elementos[0].firstChild.nodeValue.strip()
    except Exception:
        return ''


def exibir_resumo_consulta(status, conteudo):
    fault = extrair_texto(conteudo, 'faultstring')

    if fault:
        print(f'HTTP {status} | Erro SOAP: {fault}')
        return

    print(f'HTTP {status} | Conta consultada com sucesso')
    print(f'ID: {extrair_texto(conteudo, "contaId")}')
    print(f'Nome: {extrair_texto(conteudo, "nome")}')
    print(f'Email: {extrair_texto(conteudo, "email")}')
    print(f'Saldo: R$ {extrair_texto(conteudo, "saldo")}')
    print(f'Status: {extrair_texto(conteudo, "status")}')


def exibir_resumo_operacao(status, conteudo):
    fault = extrair_texto(conteudo, 'faultstring')

    if fault:
        print(f'HTTP {status} | Erro SOAP: {fault}')
        return

    print(f'HTTP {status} | Simulação realizada com sucesso')
    print(f'Conta: {extrair_texto(conteudo, "contaId")}')
    print(f'Tipo: {extrair_texto(conteudo, "tipo")}')
    print(f'Valor: R$ {extrair_texto(conteudo, "valor")}')
    print(f'Saldo antes: R$ {extrair_texto(conteudo, "saldoAntes")}')
    print(f'Saldo depois: R$ {extrair_texto(conteudo, "saldoDepois")}')
    print(f'Mensagem: {extrair_texto(conteudo, "mensagem")}')


def perguntar_sim_nao(mensagem):
    resposta = input(mensagem).strip().lower()
    return resposta in ['s', 'sim', 'y', 'yes']


def ler_inteiro_positivo(mensagem):
    while True:
        valor = input(mensagem).strip()

        if valor.isdigit() and int(valor) > 0:
            return int(valor)

        print('Informe um número inteiro positivo.')


def ler_valor_positivo(mensagem):
    while True:
        valor = input(mensagem).strip().replace(',', '.')

        try:
            valor_numero = float(valor)
        except ValueError:
            valor_numero = 0

        if valor_numero > 0:
            return f'{valor_numero:.2f}'

        print('Informe um valor numérico maior que zero.')


def ler_tipo_operacao():
    while True:
        tipo = input('Tipo da operação (deposito/saque): ').strip().lower()

        if tipo in ['deposito', 'saque']:
            return tipo

        print('Tipo inválido. Use deposito ou saque.')

def exibir_erro_conexao(erro):
    print('\nNão foi possível conectar ao servidor SOAP.')
    print(f'Endpoint tentado: http://{HOST}:{PORT}{ENDPOINT}')
    print(f'Detalhe técnico: {erro}')
    print('\nAntes de usar este cliente, inicie o servidor SOAP em outro terminal:')
    print('cd SistemaContasOnline/REST_SOAP_WebSocket')
    print('node soap-service/server.js')
    print(f'\nDepois confirme se o WSDL abre em: http://{HOST}:{PORT}{ENDPOINT}?wsdl')

def enviar_soap(soap_action, body):
    xml = envelope(body)
    conexao = HTTPConnection(HOST, PORT, timeout=10)
    headers = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soap_action,
    }

    try:
        conexao.request('POST', ENDPOINT, body=xml.encode('utf-8'), headers=headers)
        resposta = conexao.getresponse()
        conteudo = resposta.read().decode('utf-8')
        return resposta.status, conteudo, None
    except OSError as erro:
        return None, '', erro
    finally:
        conexao.close()

def consultar_conta(conta_id, mostrar_xml=False):
    status, conteudo, erro = enviar_soap(
        'http://contasonline.soap/consultarConta',
        f'''    <con:consultarContaRequest>
      <con:contaId>{conta_id}</con:contaId>
    </con:consultarContaRequest>'''
    )

    if erro:
        exibir_erro_conexao(erro)
        return False    

    print('\n=== Resultado da consulta de conta ===')
    exibir_resumo_consulta(status, conteudo)

    if mostrar_xml:
        print('\n--- XML SOAP recebido ---')
        print(formatar_xml(conteudo))  

    return True          

def simular_operacao(conta_id, tipo, valor, mostrar_xml=False):
    status, conteudo, erro = enviar_soap(
        'http://contasonline.soap/simularOperacao',
        f'''    <con:simularOperacaoRequest>
      <con:contaId>{conta_id}</con:contaId>
      <con:tipo>{tipo}</con:tipo>
      <con:valor>{valor}</con:valor>
    </con:simularOperacaoRequest>'''
    )

    if erro:
        exibir_erro_conexao(erro)
        return False    

    print('\n=== Resultado da simulação de operação ===')
    exibir_resumo_operacao(status, conteudo)

    if mostrar_xml:
        print('\n--- XML SOAP recebido ---')
        print(formatar_xml(conteudo))

    return True 

def executar_demonstracao():
    print('\nExecutando demonstração padrão...')

    if not consultar_conta(1):
        return

    if not simular_operacao(1, 'deposito', '150.00'):
        return
    simular_operacao(1, 'saque', '9999.00')


def exibir_menu():
    print('\n=== Cliente SOAP - Sistema de Contas Online ===')
    print('1 - Consultar conta')
    print('2 - Simular depósito ou saque')
    print('3 - Executar demonstração padrão')
    print('0 - Sair')


def iniciar_menu():
    print(f'Consumindo serviço SOAP pelo endpoint configurado: http://{HOST}:{PORT}{ENDPOINT}')
    print(f'WSDL localhost: http://{HOST}:{PORT}{ENDPOINT}?wsdl')
    print('No Codespaces, use a URL pública da porta 3003: https://<seu-codespace>-3003.app.github.dev/soap?wsdl')

    while True:
        exibir_menu()
        opcao = input('Escolha uma opção: ').strip()

        if opcao == '1':
            conta_id = ler_inteiro_positivo('ID da conta: ')
            mostrar_xml = perguntar_sim_nao('Deseja exibir também o XML SOAP completo? (s/N): ')
            consultar_conta(conta_id, mostrar_xml)
        elif opcao == '2':
            conta_id = ler_inteiro_positivo('ID da conta: ')
            tipo = ler_tipo_operacao()
            valor = ler_valor_positivo('Valor: ')
            mostrar_xml = perguntar_sim_nao('Deseja exibir também o XML SOAP completo? (s/N): ')
            simular_operacao(conta_id, tipo, valor, mostrar_xml)
        elif opcao == '3':
            executar_demonstracao()
        elif opcao == '0':
            print('Encerrando cliente SOAP.')
            break
        else:
            print('Opção inválida. Escolha 1, 2, 3 ou 0.')


if __name__ == '__main__':
    iniciar_menu()