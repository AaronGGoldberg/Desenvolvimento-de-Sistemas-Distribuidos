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


def enviar_soap(soap_action, body):
    xml = envelope(body)
    conexao = HTTPConnection(HOST, PORT, timeout=10)
    headers = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soap_action,
    }

    conexao.request('POST', ENDPOINT, body=xml.encode('utf-8'), headers=headers)
    resposta = conexao.getresponse()
    conteudo = resposta.read().decode('utf-8')
    conexao.close()

    print(f'\n=== {soap_action} ===')
    print(f'HTTP {resposta.status}')
    print(formatar_xml(conteudo))


def consultar_conta(conta_id):
    enviar_soap(
        'http://contasonline.soap/consultarConta',
        f'''    <con:consultarContaRequest>
      <con:contaId>{conta_id}</con:contaId>
    </con:consultarContaRequest>'''
    )


def simular_operacao(conta_id, tipo, valor):
    enviar_soap(
        'http://contasonline.soap/simularOperacao',
        f'''    <con:simularOperacaoRequest>
      <con:contaId>{conta_id}</con:contaId>
      <con:tipo>{tipo}</con:tipo>
      <con:valor>{valor}</con:valor>
    </con:simularOperacaoRequest>'''
    )


if __name__ == '__main__':
    print(f'Consumindo serviço SOAP pelo endpoint configurado: http://{HOST}:{PORT}{ENDPOINT}')
    print(f'WSDL localhost: http://{HOST}:{PORT}{ENDPOINT}?wsdl')
    print('No Codespaces, use a URL pública da porta 3003: https://<seu-codespace>-3003.app.github.dev/soap?wsdl')

    consultar_conta(1)
    simular_operacao(1, 'deposito', '150.00')
    simular_operacao(1, 'saque', '9999.00')