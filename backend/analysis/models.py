from django.db import models


class AnalysisRecord(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    name = models.CharField(max_length=100, verbose_name="文件名称")
    size = models.IntegerField(verbose_name="文件大小(k)")
    sample_type = models.CharField(max_length=20, verbose_name="目标类型")
    frequency = models.JSONField(default=list, verbose_name="频率数据")
    transmission = models.JSONField(default=list, verbose_name="透射率数据")
    methods = models.JSONField(default=list, verbose_name="分析方法")
    sample_info = models.CharField(max_length=100, verbose_name="样品信息")
    reference_library = models.CharField(max_length=20, verbose_name="参考光谱库")
    result = models.JSONField(default=dict, verbose_name="检测结果")
    result_brief = models.CharField(max_length=20, verbose_name="阳性/阴性")

    class Meta:
        verbose_name = "分析记录"
        verbose_name_plural = "分析记录"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.sample_type})"


class AnalysisSummary(models.Model):
    name = models.CharField(max_length=50, verbose_name="农药名称")
    positive_value = models.PositiveIntegerField(default=0, verbose_name="阳性总数")
    negative_value = models.PositiveIntegerField(default=0, verbose_name="阴性总数")

    class Meta:
        verbose_name = "总检测情况"
        verbose_name_plural = "总检测情况"

    def __str__(self):
        return f"{self.name} 阳性总数({self.positive_value}) 阴性总数({self.negative_value})"
