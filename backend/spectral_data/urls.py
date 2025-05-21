from django.urls import path
from spectral_data import views

urlpatterns = [
	path('spectral', views.dispatcher)
]
