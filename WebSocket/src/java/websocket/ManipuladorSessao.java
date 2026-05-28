package websocket;

import java.io.IOException;
import java.util.LinkedList;
import javax.enterprise.context.ApplicationScoped;
import javax.json.JsonObject;
import javax.json.spi.JsonProvider;
import javax.websocket.Session;
import modelos.Comentario;

@ApplicationScoped
public class ManipuladorSessao {
    private final LinkedList<Session> sessoes = new LinkedList<Session>();
    private final LinkedList<Comentario> comentarios = new LinkedList<Comentario>();

    /*manipulacao das sessoes*/
    public void adicionarSessao(Session s){
        System.out.println("Adicionar Sessao");
        sessoes.add(s);
        /*sempre na sessao que envia some (o texto pisca mais apaga) - parece criar uma nova sessao, seria para o final do exemplo*/
        int x = 0;
        for(int i = 0; i < comentarios.size();i++){
            JsonProvider jp  = JsonProvider.provider();
            JsonObject jo = jp.createObjectBuilder().add("acao", "comentarioAdicionado").add("descricao", comentarios.get(i).getDescricao()).build();
            try {
                s.getBasicRemote().sendText(jo.toString());//enivar para todas as seções não ficou bom, enviando apenas para a nova
            } catch (IOException ex) {
                ex.printStackTrace();
            }        
        }
    }
    public void removerSessao(Session s){sessoes.remove(s);}

    /*manipulacao dos modelos*/
    public void adicionarComentario(Comentario c){
        System.out.println("Adicionar Comentario");
        //Comentario recebido, retornando a informacao
        comentarios.add(c);
        
        //enviando para todas as sessões ativas
        JsonProvider jp  = JsonProvider.provider();
        JsonObject jo = jp.createObjectBuilder().add("acao", "comentarioAdicionado").add("descricao", c.getDescricao()).build();

        for(int i = 0;i < sessoes.size();i++){
        System.out.println("Sessao: "+i+", novo comentario: "+c.getDescricao());

            try {
                sessoes.get(i).getBasicRemote().sendText(jo.toString());
            } catch (IOException ex) {
                sessoes.remove(sessoes.get(i));
                ex.printStackTrace();
            }        
        }
    }
    public void removerComentario(String descricao){}
}