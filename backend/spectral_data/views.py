import pandas as pd
from django.core import serializers
from django.http import JsonResponse
import json
from spectral_data.models import Spectrum
from django.core.files.storage import default_storage

# Create your views here.
def search_pesticide(request):
	query = request.GET.get('query', '').strip()
	data = Spectrum.objects.filter(pesticide_name_cn=query)
	serialized_data = serializers.serialize('python', data)
	return JsonResponse({"ret":0, "data":serialized_data})


def add_pesticide(request):
	# 处理普通字段
	pesticide_name_cn = request.POST.get('pesticide_name_cn')
	pesticide_name_en = request.POST.get('pesticide_name_en')
	pesticide_cas = request.POST.get('pesticide_cas')
	pesticide_molecular_formula = request.POST.get('pesticide_molecular_formula')
	pesticide_remark = request.POST.get('pesticide_remark')
	# 处理上传的文件
	spectrum_file = request.FILES.get('pesticide_thz_spectrum')
	if spectrum_file is not None:
		spectrum_data = pd.read_excel(spectrum_file)
		if len(spectrum_data.columns) < 2:
			return JsonResponse({'error': 'Excel必须包含至少两列数据'}, status=400)
	else:
		spectrum_data = pd.DataFrame(columns=['f', 'a'])
	# 创建记录
	record = Spectrum.objects.create(
		pesticide_name_cn=pesticide_name_cn,
		pesticide_name_en=pesticide_name_en,
		pesticide_cas=pesticide_cas,
		pesticide_molecular_formula=pesticide_molecular_formula,
		pesticide_remark=pesticide_remark,
		pesticide_frequency= spectrum_data.iloc[:, 0].to_json(),
		pesticide_absorption= spectrum_data.iloc[:, 1].to_json(),
	)
	return JsonResponse({"ret": 0, "id": record.id})

def modify_pesticide(request):
	current_pesticide_id = request.POST.get('id')
	record = Spectrum.objects.get(pk=current_pesticide_id)
	if 'pesticide_name_cn' in request.POST:
		record.pesticide_name_cn = request.POST.get('pesticide_name_cn')
	if 'pesticide_name_en' in request.POST:
		record.pesticide_name_en = request.POST.get('pesticide_name_en')
	if 'pesticide_cas' in request.POST:
		record.pesticide_cas = request.POST.get('pesticide_cas')
	if 'pesticide_molecular_formula' in request.POST:
		record.pesticide_molecular_formula = request.POST.get('pesticide_molecular_formula')
	if 'pesticide_remark' in request.POST:
		record.pesticide_remark = request.POST.get('pesticide_remark')
	if 'pesticide_thz_spectrum' in request.FILES:
		spectrum_file = request.FILES.get('pesticide_thz_spectrum')
		spectrum_data = pd.read_excel(spectrum_file)
		if len(spectrum_data.columns) < 2:
			return JsonResponse({'error': 'Excel必须包含至少两列数据'}, status=400)

		record.pesticide_frequency = spectrum_data.iloc[:, 0].to_json()
		record.pesticide_absorption = spectrum_data.iloc[:, 1].to_json()

	record.save()

	return JsonResponse({"ret": 0, "id": record.id})

def delete_pesticide(request):
	current_pesticide_id = request.POST.get('id')
	record = Spectrum.objects.get(pk=current_pesticide_id)
	delete_id = request.POST.get('id')
	record.delete()
	return JsonResponse({"ret": 0, "id": delete_id})

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
	if action == 'search_pesticide':
		return search_pesticide(request)
	elif action == 'add_pesticide':
		return add_pesticide(request)
	elif action == 'modify_pesticide':
		return modify_pesticide(request)
	elif action == 'delete_pesticide':
		return delete_pesticide(request)
	else:
		return JsonResponse({'ret': 1, 'msg': '不支持的操作类型'})
