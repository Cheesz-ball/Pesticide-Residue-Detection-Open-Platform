from django.db import models

# Create your models here.
class Spectrum(models.Model):
	# 农药中文名称
	pesticide_name_cn = models.CharField('Pesticide Name Chinese', max_length=50)
	# 农药英文名称
	pesticide_name_en = models.CharField('Pesticide Name English', max_length=50)
	# 农药CAS号
	pesticide_cas = models.CharField('Pesticide Cas', max_length=20)
	# 农药分子式
	pesticide_molecular_formula = models.CharField('Pesticide Molecular Formula', max_length=50)
	# 农药备注
	pesticide_remark = models.CharField('Pesticide Remark', max_length=50)
	# 吸收频率
	pesticide_frequency = models.JSONField(default=list)
	# 吸收数据
	pesticide_absorption = models.JSONField(default=list)
