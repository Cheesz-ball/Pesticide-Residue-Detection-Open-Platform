from django.test import TestCase
from django.utils import timezone
from datetime import date
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dashboard.models import DetectionStats
from analysis.models import AnalysisRecord
import sys


sys.path.append("/home/ubuntu/Pesticide-Residue-Detection-Open-Platform/backend")
latest_records = AnalysisRecord.objects.order_by("-created_at")[:3]
data = {}
for k, v in enumerate(latest_records):
    item = {}
    item["name"] = v.sample_type + "检测"
    now_time = v.created_at
    local_time = timezone.localtime(now_time).strftime("%Y-%m-%d %H:%M:%S")
    item["time"] = local_time
    item["result"] = v.result["classifier_prediction"][0]
    item["result_brief"] = v.result_brief
    data[k] = item
print(data)
