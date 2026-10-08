from django.test import TestCase

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
            {"slug", "title", "date", "tags", "category", "summary", "content"},
        )
