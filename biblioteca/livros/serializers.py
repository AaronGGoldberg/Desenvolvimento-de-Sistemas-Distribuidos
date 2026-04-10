from rest_framework import serializers
from rest_framework.reverse import reverse
from .models import Autor, Livro


class AutorSerializer(serializers.ModelSerializer):
    _links = serializers.SerializerMethodField()

    class Meta:
        model = Autor
        fields = ['id', 'nome', 'nacionalidade', '_links']

    def get__links(self, obj):
        request = self.context.get('request')

        links = {
            "self": reverse('autor-detail', args=[obj.pk], request=request),
            "livros": reverse('livro-list', request=request) + f"?autor={obj.pk}"
        }

        user = request.user if request else None
        if user and user.is_authenticated and user.has_perm('livros.change_autor'):
            links['editar'] = reverse('autor-detail', args=[obj.pk], request=request)
            links['excluir'] = reverse('autor-detail', args=[obj.pk], request=request)

        return links


class LivroSerializer(serializers.ModelSerializer):
    _links = serializers.SerializerMethodField()

    # 🔥 ENTRADA (POST/PUT)
    autor_id = serializers.PrimaryKeyRelatedField(
        queryset=Autor.objects.all(),
        source='autor',
        write_only=True
    )

    # 🔥 SAÍDA (GET)
    autor = AutorSerializer(read_only=True)

    class Meta:
        model = Livro
        fields = [
            'id',
            'titulo',
            'ano_publicacao',
            'autor',
            'autor_id',
            '_links'
        ]

    def get__links(self, obj):
        request = self.context.get('request')

        return {
            "self": reverse('livro-detail', args=[obj.pk], request=request),
            "autor": reverse('autor-detail', args=[obj.autor.pk], request=request)
        }