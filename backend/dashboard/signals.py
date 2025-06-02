from django.dispatch import receiver
from django.utils import timezone
from django.db.models.signals import post_save
from analysis.models import AnalysisRecord
from dashboard.models import DetectionStats


@receiver(post_save, sender=AnalysisRecord)
def update_detection_stats(sender, instance, created, **kwargs):
    if created and not kwargs.get("raw", False):
        today = timezone.now().date()
        stats, created = DetectionStats.objects.get_or_create(date=today)
        stats.total_count += 1
        stats.save()
