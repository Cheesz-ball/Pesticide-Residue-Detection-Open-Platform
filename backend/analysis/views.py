import pandas as pd
from django.core import serializers
from django.http import JsonResponse
import json
from analysis.models import AnalysisRecord
from datetime import datetime
import os


def read_spectrum(request):
	# 处理上传的文件
	spectrum_file = request.FILES.get('file')
	if spectrum_file is not None:
		spectrum_data = pd.read_excel(spectrum_file)
		if len(spectrum_data.columns) < 2:
			return JsonResponse({'error': 'Excel必须包含至少两列数据'}, status=400)
	else:
		spectrum_data = pd.DataFrame(columns=['f', 't'])
	record = AnalysisRecord.objects.create(
		created_at=datetime.now(),
		name = spectrum_file,
		size = spectrum_file.size / 1024,
		frequency = spectrum_data.iloc[:,0].to_json(),
		transmission = spectrum_data.iloc[:,1].to_json()
	)
	return JsonResponse({"ret": 0, "id": record.pk})

# Create your views here.
def dispatcher(request):
	if request.method == 'GET':
		request.params = request.GET
	elif request.method in ['POST']:
		# 判断是否为文件上传（multipart/form-data）
		if request.content_type.startswith('multipart/form-data'):
			request.params = request.POST  # 普通字段
		else:
			try:
				request.params = json.loads(request.body)
			except json.JSONDecodeError:
				return JsonResponse({'ret': 1, 'msg': '无效的JSON数据'})
	action = request.params.get('action')
	if action == 'upload_spectrum':
		return read_spectrum(request)

	else:
		return JsonResponse({'ret': 1, 'msg': '不支持的操作类型'})