from datetime import date
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dashboard.models import DetectionStats, OnlineDevice
from analysis.models import AnalysisRecord, AnalysisSummary
from django.views.decorators.http import require_GET
from django.utils import timezone
from datetime import timedelta
from spectral_data.models import Spectrum
from django.db.models import Count
from django.db.models.functions import TruncDate
import os
from django.http import FileResponse, Http404


@require_GET
def online_devices_count(request):
    # 更新或创建当前设备记录
    device_id = request.session.session_key or request.META.get("REMOTE_ADDR")

    OnlineDevice.objects.update_or_create(
        device_id=device_id,
        defaults={
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        },
    )

    # 删除超过5分钟不活跃的设备
    threshold = timezone.now() - timedelta(minutes=5)
    OnlineDevice.objects.filter(last_seen__lt=threshold).delete()

    # 获取当前在线设备数
    count = OnlineDevice.objects.count()

    return JsonResponse({"status": "success", "count": count})


def get_analysis_today(request):
    try:
        today_date = timezone.localtime(timezone.now()).date()

        daily_data = (
            AnalysisRecord.objects.filter(
                created_at__date=today_date,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        return JsonResponse({"value": daily_data[0]["count"]})

    except:
        data = {"value": f"0"}
        return JsonResponse(data)


def get_recent_analysis_time(request):
    now_time = AnalysisRecord.objects.order_by("created_at").last().created_at
    local_time = timezone.localtime(now_time).strftime("%Y-%m-%d %H:%M:%S")
    data = {"message": f"{local_time}"}
    return JsonResponse(data)


def get_all_analysis_count(request):
    analysis_count = AnalysisRecord.objects.count()
    data = {"message": "检测总数", "value": f"{analysis_count}"}
    return JsonResponse(data)


def get_analysis_summary(request):
    cate = [result.name for result in AnalysisSummary.objects.all()]
    positive_value = [result.positive_value for result in AnalysisSummary.objects.all()]
    negative_value = [result.negative_value for result in AnalysisSummary.objects.all()]
    data = {
        "title": "",
        "categories": cate,
        "series": {"positive": positive_value, "negative": negative_value},
    }
    return JsonResponse(data)


def get_analysis_summary_week(request):
    end_date = timezone.localtime(timezone.now()).date()
    start_date = end_date - timedelta(days=6)

    date_range = [start_date + timedelta(days=i) for i in range(7)]

    daily_data_positive = (
        AnalysisRecord.objects.filter(
            created_at__date__range=(start_date, end_date), result_brief="positive"
        )
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
    )
    daily_data_negative = (
        AnalysisRecord.objects.filter(
            created_at__date__range=(start_date, end_date), result_brief="negative"
        )
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
    )

    pos_dict = {item["day"]: item["count"] for item in daily_data_positive}
    neg_dict = {item["day"]: item["count"] for item in daily_data_negative}

    xAxis = [str(single_date) for single_date in date_range]
    pos_series = [pos_dict.get(single_date, 0) for single_date in date_range]
    neg_series = [neg_dict.get(single_date, 0) for single_date in date_range]

    return JsonResponse(
        {
            "xAxis": xAxis,
            "series": [
                {"name": "正向", "data": pos_series},
                {"name": "负向", "data": neg_series},
            ],
        }
    )


def get_recent_3info(request):
    latest_records = AnalysisRecord.objects.order_by("-created_at")[:3]
    data = {}
    for k, v in enumerate(latest_records):
        item = {}
        item["name"] = "对于" + v.sample_type + "检测"
        now_time = v.created_at
        local_time = timezone.localtime(now_time).strftime("%Y-%m-%d %H:%M:%S")
        item["time"] = local_time
        item["result"] = v.result["classifier_prediction"][0]
        item["result_brief"] = v.result_brief
        data["recent" + str(k)] = item
    return JsonResponse(data)


def send_wechat(request):
    if request.method == "GET":
        file_path = "backend/dashboard/src/db0821249e2359a391c853146c6c7345.jpg"
        if os.path.exists(file_path):
            return FileResponse(open(file_path, "rb"), content_type="image/jpeg")
        else:
            raise Http404("Image not found.")
