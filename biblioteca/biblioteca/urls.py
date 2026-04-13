### Configurações do DRF Spectacular para documentação da API no HATEOAS:
from django.contrib import admin 
from django.urls import path, include 
from django.views.generic import RedirectView
from rest_framework import routers 
from livros.views import AutorViewSet, LivroViewSet 
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView 
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

router = routers.DefaultRouter() 
router.register(r'autores', AutorViewSet) 
router.register(r'livros', LivroViewSet) 
urlpatterns = [ 
    path('', RedirectView.as_view(url='/api/schema/swagger-ui/', permanent=False)),
    path('admin/', admin.site.urls), 
    path('api/', include(router.urls)), 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

### Configuração do Swagger UI para documentação da API no HATEOAS:
'''from django.contrib import admin 
from django.urls import path, include 
from rest_framework import routers 
from livros.views import AutorViewSet, LivroViewSet 
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView 
from drf_yasg.views import get_schema_view 
from drf_yasg import openapi 
from rest_framework import permissions 
from rest_framework.routers import DefaultRouter

router = routers.DefaultRouter() 
router.register(r'autores', AutorViewSet) 
router.register(r'livros', LivroViewSet) 
schema_view = get_schema_view(
    openapi.Info(
        title="API Biblioteca",
        default_version='v1',
        description="Documentação da API",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)
urlpatterns = [ 
    path('admin/', admin.site.urls), 
    path('api/', include(router.urls)), 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='swagger-ui'), 
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='redoc-ui'),
]'''