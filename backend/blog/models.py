from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone


class Post(models.Model):
    slug = models.SlugField(max_length=80, unique=True, blank=True)
    title = models.CharField(max_length=200)
    date = models.DateField(default=timezone.localdate)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    category = models.CharField(max_length=80, default="未分类")
    summary = models.TextField(blank=True, default="")
    draft = models.BooleanField(default=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # 为空表示创建后从没改过，详情页据此显示“创建于”还是“更新于”
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date", "-id"]
        indexes = [models.Index(fields=["draft", "-date"])]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            self.edited_at = timezone.now()
        if not self.slug:
            base = timezone.localtime().strftime("%Y%m%d%H%M%S")
            slug = base
            index = 1
            while type(self).objects.filter(slug=slug).exists():
                index += 1
                slug = f"{base}-{index}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
