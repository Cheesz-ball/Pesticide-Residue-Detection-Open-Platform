from django.urls import path
from dashboard import views

urlpatterns = [
path('get_all_analysis_sum/', views.get_all_analysis_sum),
path('get_recent_detection_time/', views.get_recent_detection_time),
path('get_current_testing_progress/', views.get_current_testing_progress),
path('chart-data/', views.get_chart_data),
path('get_cpu_mem_usage/', views.get_cpu_mem_usage),
	]