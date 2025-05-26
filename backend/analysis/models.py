from django.db import models

class AnalysisRecord(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    name = models.CharField(max_length=100, verbose_name="文件名称")
    size = models.IntegerField(verbose_name="文件大小(字节)")  # 或者使用 PositiveIntegerField
    file_type = models.CharField(max_length=100, verbose_name="文件类型")
    target_type = models.CharField(max_length=20, verbose_name="目标类型")
    frequency = models.JSONField(default=list, verbose_name="频率数据")
    transmission = models.JSONField(default=list, verbose_name="传输数据")
    methods = models.JSONField(default=dict, verbose_name="分析方法")
    reference_library = models.CharField(max_length=20, verbose_name="参考光谱库")

    class Meta:
        verbose_name = "分析记录"
        verbose_name_plural = "分析记录"
        ordering = ['-created_at']  # 默认按创建时间降序

    def __str__(self):
        return f"{self.name} ({self.target_type})"
