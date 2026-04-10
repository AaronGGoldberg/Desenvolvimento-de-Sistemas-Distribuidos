from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import Autor, Livro
from .serializers import AutorSerializer, LivroSerializer


class AutorViewSet(viewsets.ModelViewSet):
    queryset = Autor.objects.all()
    serializer_class = AutorSerializer

    # 🔥 leitura liberada, escrita protegida
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class LivroViewSet(viewsets.ModelViewSet):
    queryset = Livro.objects.all()
    serializer_class = LivroSerializer

    # 🔥 mesma estratégia do Autor (consistência)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # 🔎 filtro por query param (?autor=1)
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        queryset = Livro.objects.all()

        autor_id = self.request.query_params.get('autor')
        if autor_id:
            queryset = queryset.filter(autor_id=autor_id)

        return queryset