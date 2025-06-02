from django.urls import path
from dashboard import views

urlpatterns = [
    path("get_analysis_today/", views.get_analysis_today),
    path("get_recent_analysis_time/", views.get_recent_analysis_time),
    path("get_all_count/", views.get_all_analysis_count),
    path("analysis_summary/", views.get_analysis_summary),
    path("week_summary/", views.get_analysis_summary_week),
    path("online_devices/", views.online_devices_count),
    path("recent_3info/", views.get_recent_3info),
    path("get_wechat/", views.send_wechat),
]
