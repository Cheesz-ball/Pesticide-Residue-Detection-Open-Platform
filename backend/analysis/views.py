import pandas as pd
from django.core import serializers
from django.http import JsonResponse
import json
from models import AnalysisRecord

def read_spectrum(request):
	# 处理上传的文件
	spectrum_file = request.FILES
	print(spectrum_file)
	return JsonResponse({"ret": 0, "id": spectrum_file})

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
	print(request.POST)
	action = request.params.get('action')
	print(action)
	if action == 'upload_spectrum':
		return read_spectrum(request)

	else:
		return JsonResponse({'ret': 1, 'msg': '不支持的操作类型'})