from django.test import TestCase

from blog.models import Post


class PostModelTests(TestCase):
    def test_slug_is_generated(self):
        post = Post.objects.create(title="测试文章", content="正文")
        self.assertTrue(post.slug)

    def test_defaults_match_frontend(self):
        post = Post.objects.create(title="测试文章", content="正文")
        self.assertEqual(post.category, "未分类")
        self.assertEqual(post.tags, [])
        self.assertFalse(post.draft)

    def test_order_is_date_desc(self):
        older = Post.objects.create(title="旧文章", date="2026-01-01", content="旧")
        newer = Post.objects.create(title="新文章", date="2026-02-01", content="新")
        self.assertEqual(list(Post.objects.all()), [newer, older])
