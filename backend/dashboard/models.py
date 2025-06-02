from django.db import models


class DetectionStats(models.Model):
    date = models.DateField(unique=True)
    total_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "检测统计"
        verbose_name_plural = "检测统计"

    def __str__(self):
        return f"{self.date} - 检测次数: {self.total_count}"


class OnlineDevice(models.Model):
    device_id = models.CharField(max_length=100, unique=True)
    last_seen = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "在线设备"
        verbose_name_plural = "在线设备"

    def __str__(self):
        return f"{self.device_id} ({self.ip_address})"
