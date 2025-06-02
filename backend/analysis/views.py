import pandas as pd
from django.core import serializers
from django.http import JsonResponse, FileResponse, HttpResponse
import json
from analysis.models import AnalysisRecord, AnalysisSummary
from datetime import datetime
import os
import pytz
import numpy as np
from scipy import signal
from scipy.ndimage import gaussian_filter1d
from sklearn.preprocessing import StandardScaler
from django.utils import timezone
import sys


from analysis.detect_model import detect


def get_upload_example():
    file_path = "backend/analysis/detect_model/src/analysis_example.xlsx"
    if os.path.exists(file_path):
        file_handle = open(file_path, "rb")
        response = FileResponse(
            file_handle, as_attachment=True, filename=os.path.basename(file_path)
        )
        return response
    return HttpResponse("文件不存在", status=404)


def preprocess_data(data, sigma=1.0):
    frequency = data.iloc[:, 0]
    transmission = data.iloc[:, 1]
    if len(frequency) == 184:
        resampled_frequency = frequency.values
        resampled_transmission = transmission.values
    else:
        num_points = 184
        resampled_frequency = np.linspace(frequency.min(), frequency.max(), num_points)
        resampled_transmission = np.interp(resampled_frequency, frequency, transmission)

    smoothed_data = gaussian_filter1d(resampled_transmission, sigma=sigma)
    scaler = StandardScaler()
    standardized_data = scaler.fit_transform(smoothed_data.reshape(-1, 1)).flatten()
    derivative_data = np.gradient(standardized_data, resampled_frequency)

    return (
        resampled_frequency,
        resampled_transmission,
        smoothed_data,
        standardized_data,
        derivative_data,
    )


def read_spectrum(request):
    # 处理上传的文件
    spectrum_file = request.FILES.get("file")
    if spectrum_file is not None:
        spectrum_data = pd.read_excel(spectrum_file)
        if len(spectrum_data.columns) < 2:
            return JsonResponse({"error": "Excel必须包含至少两列数据"}, status=400)
    else:
        spectrum_data = pd.DataFrame(columns=["f", "t"])
    (
        resampled_frequency,
        resampled_transimssion,
        smoothed_data,
        standardized_data,
        derivative_data,
    ) = preprocess_data(spectrum_data)
    utc_time = timezone.now()
    created_at_local = utc_time.astimezone(timezone.get_current_timezone())
    record = AnalysisRecord.objects.create(
        created_at=created_at_local,
        name=spectrum_file.name,
        size=spectrum_file.size / 1024,
        frequency=resampled_frequency.tolist(),
        transmission=resampled_transimssion.tolist(),
    )
    preprocessed_data = pd.DataFrame(
        {
            "frequency": resampled_frequency,
            "transmission": resampled_transimssion,
            "smoothed": smoothed_data,
            "standardized": standardized_data,
            "derivative": derivative_data,
        }
    )
    data_json = preprocessed_data.to_dict(orient="list")
    return JsonResponse({"ret": 0, "id": record.id, "data": data_json})


def start_analysis(request):
    sample_type = request.POST.get("sample-type")
    analysis_id = request.POST.get("analysis-id")
    detection_method = request.POST.get("detection_method")
    ref_library = request.POST.get("reference-library")
    sample_info = request.POST.get("sample-info")
    record = AnalysisRecord.objects.get(pk=analysis_id)
    record.sample_type = sample_type
    record.methods = detection_method
    record.sample_info = sample_info
    record.reference_library = ref_library
    analysis_result = detect.predict_with_stacking(
        record.transmission,
        "backend/analysis/detect_model/step0_scaler.joblib",
        "backend/analysis/detect_model/step1_classifier.joblib",
        "backend/analysis/detect_model/step2_stacking_regressor.joblib",
        "backend/analysis/detect_model/train_ood_stats.joblib",
    )

    record.result = analysis_result
    local_time = timezone.localtime(record.created_at).strftime("%Y-%m-%d %H:%M:%S")
    analysis_result["time"] = local_time

    record_summary, created = AnalysisSummary.objects.get_or_create(
        name=analysis_result["classifier_prediction"][0],
    )
    if analysis_result["stacking_prediction"][0] > 50:
        record_summary.positive_value += 1
        record.result_brief = "positive"
    else:
        record_summary.negative_value += 1
        record.result_brief = "negative"
    record_summary.save()
    record.save()
    return JsonResponse({"ret": 0, "id": record.id, "data": analysis_result})


def dispatcher(request):
    print(f"正在创建记录，请求方法: {request.method}")
    if request.method == "GET":
        request.params = request.GET
    elif request.method in ["POST"]:
        # 判断是否为文件上传（multipart/form-data）
        if request.content_type.startswith("multipart/form-data"):
            request.params = request.POST  # 普通字段
        else:
            try:
                request.params = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"ret": 1, "msg": "无效的JSON数据"})
    action = request.params.get("action")
    if action == "upload_spectrum":
        return read_spectrum(request)
    elif action == "upload_setting":
        return start_analysis(request)
    elif action == "get_upload_example":
        return get_upload_example()

    else:
        return JsonResponse({"ret": 1, "msg": "不支持的操作类型"})
