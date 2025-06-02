from django.urls import path
from accounts import views

urlpatterns = [
    path("login/", views.login_view, name="api_login"),
    path("logout/", views.logout_view, name="api_logout"),
    path("register/", views.register_view, name="api_register"),
]
