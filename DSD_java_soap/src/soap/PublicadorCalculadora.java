package soap;

import soap.ServicoCalculadora;
import jakarta.xml.ws.Endpoint;

public class PublicadorCalculadora {
    public static void main(String args[]){
        Endpoint.publish(
            "http://10.24.21.49:9876/calcsoap", 
            new ServicoCalculadora()
        );
        System.out.println("Servico Calculadora em execucao...");
    }
}
