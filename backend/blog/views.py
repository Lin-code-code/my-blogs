from django.http import JsonResponse

from .models import Post


def post_list(request):
    posts = list(
        Post.objects.filter(draft=False)
        .order_by("-date", "-id")
        .values("slug", "title", "date", "tags", "category", "summary", "content")
    )
    return JsonResponse(posts, safe=False, json_dumps_params={"ensure_ascii": False})
