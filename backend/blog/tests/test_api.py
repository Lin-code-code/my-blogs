import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from blog.models import Post


class PostApiTests(TestCase):
    def test_returns_only_published_posts(self):
        Post.objects.create(
            slug="published",
            title="已发布",
            date="2026-02-01",
            tags=["Vue"],
            category="技术",
            summary="摘要",
            content="正文",
            draft=False,
        )
        Post.objects.create(
            slug="draft",
            title="草稿",
            date="2026-03-01",
            content="草稿正文",
            draft=True,
        )

        response = self.client.get("/api/v1/posts/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.json()], ["published"])
        self.assertEqual(
            set(response.json()[0]),
            {
                "slug",
                "title",
                "date",
                "tags",
                "category",
                "summary",
                "content",
                "created_at",
                "edited_at",
            },
        )


class AuthPostApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.staff = get_user_model().objects.create_user(
            username="writer",
            password="correct-password",
            is_staff=True,
        )
        self.normal = get_user_model().objects.create_user(
            username="reader",
            password="correct-password",
            is_staff=False,
        )

    def csrf(self):
        self.client.get("/api/v1/auth/me/")
        return self.client.cookies["csrftoken"].value

    def login_staff(self):
        csrf = self.csrf()
        response = self.client.post(
            "/api/v1/auth/login/",
            data=json.dumps({"username": "writer", "password": "correct-password"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)

    def post_payload(self):
        return {
            "title": "新文章",
            "date": "2026-10-08",
            "tags": ["Django"],
            "category": "技术",
            "summary": "摘要",
            "draft": False,
            "content": "正文",
        }

    def test_guest_cannot_create_post(self):
        csrf = self.csrf()
        response = self.client.post(
            "/api/v1/admin/posts/",
            data=json.dumps(self.post_payload()),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Post.objects.filter(title="新文章").exists())

    def test_login_with_valid_account(self):
        self.login_staff()

        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["username"], "writer")

    def test_non_staff_cannot_create_post(self):
        self.client.force_login(self.normal)
        csrf = self.csrf()
        response = self.client.post(
            "/api/v1/admin/posts/",
            data=json.dumps(self.post_payload()),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_can_create_post(self):
        self.client.force_login(self.staff)
        csrf = self.csrf()
        response = self.client.post(
            "/api/v1/admin/posts/",
            data=json.dumps(self.post_payload()),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Post.objects.filter(title="新文章", slug=response.json()["slug"]).exists())
    def test_guest_cannot_read_draft(self):
        Post.objects.create(slug="secret", title="草稿", date="2026-10-01", content="正文", draft=True)

        response = self.client.get("/api/v1/admin/posts/secret/")

        self.assertEqual(response.status_code, 403)

    def test_staff_can_load_and_update_post(self):
        self.client.force_login(self.staff)
        post = Post.objects.create(
            slug="edit-me",
            title="旧标题",
            date="2026-10-01",
            tags=["旧标签"],
            category="技术",
            summary="旧摘要",
            content="旧正文",
            draft=True,
        )

        loaded = self.client.get("/api/v1/admin/posts/edit-me/")
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.json()["title"], "旧标题")
        self.assertEqual(loaded.json()["content"], "旧正文")

        response = self.client.put(
            "/api/v1/admin/posts/edit-me/",
            data=json.dumps({**self.post_payload(), "title": "新标题", "draft": True}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )

        self.assertEqual(response.status_code, 200)
        post.refresh_from_db()
        self.assertEqual(post.title, "新标题")
        self.assertEqual(post.content, "正文")
        self.assertEqual(post.tags, ["Django"])
        self.assertEqual(post.slug, "edit-me")

    def test_update_missing_post_returns_404(self):
        self.client.force_login(self.staff)

        response = self.client.put(
            "/api/v1/admin/posts/nope/",
            data=json.dumps(self.post_payload()),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )

        self.assertEqual(response.status_code, 404)

    def test_new_post_has_no_edited_at(self):
        self.client.force_login(self.staff)
        response = self.client.post(
            "/api/v1/admin/posts/",
            data=json.dumps(self.post_payload()),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(Post.objects.get(slug=response.json()["slug"]).edited_at)

    def test_update_marks_edited_at(self):
        self.client.force_login(self.staff)
        post = Post.objects.create(slug="edit-me", title="旧标题", date="2026-10-01", content="旧正文")

        response = self.client.put(
            "/api/v1/admin/posts/edit-me/",
            data=json.dumps({**self.post_payload(), "title": "新标题"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )

        self.assertEqual(response.status_code, 200)
        post.refresh_from_db()
        self.assertIsNotNone(post.edited_at)

    def test_guest_cannot_delete_post(self):
        Post.objects.create(slug="keep-me", title="保留", date="2026-10-01", content="正文")

        response = self.client.delete("/api/v1/admin/posts/keep-me/", HTTP_X_CSRFTOKEN=self.csrf())

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Post.objects.filter(slug="keep-me").exists())

    def test_staff_can_delete_post(self):
        self.client.force_login(self.staff)
        Post.objects.create(slug="drop-me", title="删除", date="2026-10-01", content="正文")

        response = self.client.delete("/api/v1/admin/posts/drop-me/", HTTP_X_CSRFTOKEN=self.csrf())

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Post.objects.filter(slug="drop-me").exists())


class AccountUpdateTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.user = get_user_model().objects.create_user(
            username="admin-old",
            password="old-password-123",
            is_staff=True,
        )

    def csrf(self):
        self.client.get("/api/v1/auth/me/")
        return self.client.cookies["csrftoken"].value

    def post_account(self, payload):
        return self.client.post(
            "/api/v1/auth/account/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )

    def test_guest_cannot_update_account(self):
        response = self.post_account(
            {
                "username": "new-name",
                "current_password": "old-password-123",
                "new_password": "",
                "confirm_password": "",
            }
        )

        self.assertEqual(response.status_code, 403)

    def test_requires_current_password(self):
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "new-name",
                "current_password": "wrong-password",
                "new_password": "",
                "confirm_password": "",
            }
        )

        self.assertEqual(response.status_code, 401)

    def test_updates_username(self):
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "new-name",
                "current_password": "old-password-123",
                "new_password": "",
                "confirm_password": "",
            }
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "new-name")

    def test_rejects_duplicate_username(self):
        get_user_model().objects.create_user(username="occupied", password="password-123")
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "occupied",
                "current_password": "old-password-123",
                "new_password": "",
                "confirm_password": "",
            }
        )

        self.assertEqual(response.status_code, 400)

    def test_rejects_password_mismatch(self):
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "admin-old",
                "current_password": "old-password-123",
                "new_password": "new-password-456",
                "confirm_password": "different-password-789",
            }
        )

        self.assertEqual(response.status_code, 400)

    def test_accepts_common_password_after_rule_removal(self):
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "admin-old",
                "current_password": "old-password-123",
                "new_password": "password",
                "confirm_password": "password",
            }
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("password"))

    def test_updates_password_and_keeps_session(self):
        self.client.force_login(self.user)
        response = self.post_account(
            {
                "username": "admin-new",
                "current_password": "old-password-123",
                "new_password": "new-password-456",
                "confirm_password": "new-password-456",
            }
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "admin-new")
        self.assertTrue(self.user.check_password("new-password-456"))

        me = self.client.get("/api/v1/auth/me/")
        self.assertTrue(me.json()["authenticated"])
class DraftApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = get_user_model().objects.create_user(
            username="draft-writer",
            password="password-123",
            is_staff=True,
        )
        Post.objects.create(
            slug="draft-one",
            title="草稿一",
            date="2026-10-01",
            tags=["Django"],
            category="技术",
            summary="草稿摘要",
            content="草稿正文",
            draft=True,
        )
        Post.objects.create(
            slug="published-one",
            title="已发布",
            date="2026-10-02",
            content="公开正文",
            draft=False,
        )

    def test_guest_cannot_view_drafts(self):
        response = self.client.get("/api/v1/admin/drafts/")
        self.assertEqual(response.status_code, 403)

    def test_staff_only_sees_drafts(self):
        self.client.force_login(self.staff)
        response = self.client.get("/api/v1/admin/drafts/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.json()], ["draft-one"])
        self.assertEqual(
            set(response.json()[0]),
            {"id", "slug", "title", "date", "category", "summary", "updated_at"},
        )

