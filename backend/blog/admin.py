from django.contrib import admin

from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "date", "category", "draft", "updated_at")
    list_filter = ("draft", "category")
    search_fields = ("title", "summary", "content")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-date",)
