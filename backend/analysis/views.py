import pandas as pd
from django.core import serializers
from django.http import JsonResponse
import json
from analysis.models import AnalysisRecord
from datetime import datetime
import os
import numpy as np
from scipy import signal
from scipy.ndimage import gaussian_filter1d
from sklearn.preprocessing import StandardScaler
import sys

sys.path.append("/home/ubuntu/Pesticide-Residue-Detection-Open-Platform/backend")
from analysis.detect_model import detect


def preprocess_data(data, sigma=1.0):
    frequency = data.iloc[:, 0]
    transmission = data.iloc[:, 1]
    num_points = 151
    resampled_frequency = np.linspace(frequency.min(), frequency.max(), num_points)
    resampled_transimssion = np.interp(resampled_frequency, frequency, transmission)
    smoothed_data = gaussian_filter1d(resampled_transimssion, sigma=sigma)
    scaler = StandardScaler()
    standardized_data = scaler.fit_transform(smoothed_data.reshape(-1, 1)).flatten()
    derivative_data = np.gradient(standardized_data, resampled_frequency)
    return (
        resampled_frequency,
        resampled_transimssion,
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
    record = AnalysisRecord.objects.create(
        created_at=datetime.now(),
        name=spectrum_file,
        size=spectrum_file.size / 1024,
        frequency=spectrum_data.iloc[:, 0].to_json(),
        transmission=spectrum_data.iloc[:, 1].to_json(),
    )
    (
        resampled_frequency,
        resampled_transimssion,
        smoothed_data,
        standardized_data,
        derivative_data,
    ) = preprocess_data(spectrum_data)
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
        json.loads(record.transmission),
        "backend/analysis/detect_model/step0_scaler.joblib",
        "backend/analysis/detect_model/step1_classifier.joblib",
        "backend/analysis/detect_model/step2_stacking_regressor.joblib",
        "backend/analysis/detect_model/train_ood_stats.joblib",
    )
    analysis_result_json = json.dumps(analysis_result)
    record.save()

    return JsonResponse({"ret": 0, "id": record.id, "data": analysis_result_json})


# Create your views here.
def dispatcher(request):
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

    else:
        return JsonResponse({"ret": 1, "msg": "不支持的操作类型"})
