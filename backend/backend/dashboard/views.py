from datetime import date

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Category  # 替换为你的实际模型
import psutil

@csrf_exempt
def get_all_analysis_sum(request):
    data = {
        'message': '总检测数量',
        'value': 42
    }
    return JsonResponse(data)

def get_recent_detection_time(request):
    now_time = date.today()
    data = {
        'message':f'{now_time}'
    }
    return JsonResponse(data)
def get_current_testing_progress(request):
    data = {
        'message': '当前检测进度',
        'value': '65/70'
    }
    return JsonResponse(data)

def get_chart_data(request):
    # 模拟数据（实际可从数据库获取）
    data = {
        "title": "超标率统计",
        "categories": ["农药1", "农药2", "农药3", "农药4", "农药5"],
        "series": [
            {
                "name": "超标次数",
                "type": "bar",
                "data": [15, 22, 18, 9, 12]
            },
            {
                "name": "正常次数",
                "type": "bar",
                "data": [30, 25, 32, 40, 35]
            }
        ]
    }
    return JsonResponse(data)

def get_cpu_mem_usage(request):
    cpu_percent = psutil.cpu_percent(interval=1)  # interval 参数表示采样间隔（秒）
    memory = psutil.virtual_memory()
    data={
        "title":"CPU/内存使用情况",
        "series":[{
            "name":"CPU/内存使用情况",
            "type":"pie",
            "data": [
                {"value": 1048, "name": 'Search Engine'},
                {"value": 735, "name": 'Direct'},
                {"value": 580, "name": 'Email'},
                {"value": 484, "name": 'Union Ads'},
                {"value": 300, "name": 'Video Ads'}
            ]
        }

        ]


    }
    return JsonResponse(data)
