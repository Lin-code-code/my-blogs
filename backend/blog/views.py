import json
from datetime import date, datetime

from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from .models import Post

MAX_BODY = 200 * 1024


def _read_json(request):
    if len(request.body) > MAX_BODY:
        raise ValueError("正文过长（上限 200KB）")
    payload = json.loads(request.body or b"{}")
    if not isinstance(payload, dict):
        raise ValueError("请求体必须是 JSON 对象")
    return payload


def _user_payload(user):
    return {
        "authenticated": user.is_authenticated,
        "username": user.username if user.is_authenticated else "",
        "is_staff": bool(user.is_authenticated and user.is_staff),
    }


@require_GET
def post_list(request):
    posts = list(
        Post.objects.filter(draft=False)
        .order_by("-date", "-id")
        .values("slug", "title", "date", "tags", "category", "summary", "content")
    )
    return JsonResponse(posts, safe=False, json_dumps_params={"ensure_ascii": False})


@require_GET
@ensure_csrf_cookie
def auth_me(request):
    return JsonResponse(_user_payload(request.user))


@require_POST
def auth_login(request):
    try:
        payload = _read_json(request)
    except (ValueError, json.JSONDecodeError) as exc:
        return JsonResponse({"message": str(exc)}, status=400)

    user = authenticate(
        request,
        username=str(payload.get("username") or ""),
        password=str(payload.get("password") or ""),
    )
    if user is None or not user.is_active or not user.is_staff:
        return JsonResponse({"message": "用户名或密码错误，或账号无写权限"}, status=401)

    login(request, user)
    return JsonResponse(_user_payload(user))


@require_POST
def auth_logout(request):
    logout(request)
    return JsonResponse({"authenticated": False, "username": "", "is_staff": False})


def _post_fields(payload):
    """校验并归一化文章字段，数据非法时抛 ValueError，消息直接回给前端。"""
    title = str(payload.get("title") or "").strip()
    if not title:
        raise ValueError("标题不能为空")

    content = str(payload.get("content") or "")
    if not content.strip():
        raise ValueError("正文不能为空")

    raw_date = payload.get("date")
    if isinstance(raw_date, str):
        try:
            raw_date = date.fromisoformat(raw_date)
        except ValueError:
            raise ValueError("日期格式必须是 YYYY-MM-DD") from None
    if isinstance(raw_date, datetime):
        raw_date = raw_date.date()
    if not isinstance(raw_date, date):
        raise ValueError("日期不能为空")

    tags = payload.get("tags", [])
    if not isinstance(tags, list):
        raise ValueError("标签必须是数组")

    return {
        "title": title,
        "date": raw_date,
        "tags": [str(tag).strip() for tag in tags if str(tag).strip()],
        "category": str(payload.get("category") or "未分类"),
        "summary": str(payload.get("summary") or ""),
        "draft": bool(payload.get("draft", False)),
        "content": content,
    }


def _read_post_fields(request):
    """解析请求体并校验文章字段，返回 (fields, error_response)，二者必有一个为 None。"""
    try:
        return _post_fields(_read_json(request)), None
    except (ValueError, json.JSONDecodeError) as exc:
        status = 413 if "过长" in str(exc) else 400
        return None, JsonResponse({"message": str(exc)}, status=status)


@require_POST
def post_create(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"message": "请先登录管理员账号"}, status=403)

    fields, error = _read_post_fields(request)
    if error:
        return error

    post = Post.objects.create(**fields)
    return JsonResponse({"slug": post.slug}, status=201)


@require_http_methods(["GET", "PUT"])
def post_detail(request, slug):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"message": "请先登录管理员账号"}, status=403)

    try:
        post = Post.objects.get(slug=slug)
    except Post.DoesNotExist:
        return JsonResponse({"message": "文章不存在"}, status=404)

    if request.method == "GET":
        return JsonResponse(
            {
                "slug": post.slug,
                "title": post.title,
                "date": post.date.isoformat(),
                "tags": post.tags,
                "category": post.category,
                "summary": post.summary,
                "draft": post.draft,
                "content": post.content,
            },
            json_dumps_params={"ensure_ascii": False},
        )

    fields, error = _read_post_fields(request)
    if error:
        return error

    for name, value in fields.items():
        setattr(post, name, value)
    post.save()
    return JsonResponse({"slug": post.slug})


@require_POST
def account_update(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"message": "请先登录管理员账号"}, status=403)

    try:
        payload = _read_json(request)
    except (ValueError, json.JSONDecodeError) as exc:
        return JsonResponse({"message": str(exc)}, status=400)

    current_password = str(payload.get("current_password") or "")
    if not request.user.check_password(current_password):
        return JsonResponse({"message": "当前密码错误"}, status=401)

    username = str(payload.get("username") or "").strip()
    if not username:
        return JsonResponse({"message": "用户名不能为空"}, status=400)

    User = get_user_model()
    if User.objects.exclude(pk=request.user.pk).filter(username__iexact=username).exists():
        return JsonResponse({"message": "用户名已存在"}, status=400)

    new_password = str(payload.get("new_password") or "")
    confirm_password = str(payload.get("confirm_password") or "")
    if new_password:
        if new_password != confirm_password:
            return JsonResponse({"message": "两次输入的新密码不一致"}, status=400)
        try:
            validate_password(new_password, request.user)
        except ValidationError as exc:
            return JsonResponse({"message": " ".join(exc.messages)}, status=400)

    request.user.username = username
    if new_password:
        request.user.set_password(new_password)
    else:
        try:
            request.user.full_clean(exclude=["password"])
        except ValidationError as exc:
            return JsonResponse({"message": " ".join(exc.messages)}, status=400)

    request.user.save()
    update_session_auth_hash(request, request.user)
    return JsonResponse(_user_payload(request.user))


@require_GET
def draft_list(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"message": "请先登录管理员账号"}, status=403)

    posts = list(
        Post.objects.filter(draft=True)
        .order_by("-updated_at", "-id")
        .values("id", "slug", "title", "date", "category", "summary", "updated_at")
    )
    return JsonResponse(posts, safe=False, json_dumps_params={"ensure_ascii": False})
