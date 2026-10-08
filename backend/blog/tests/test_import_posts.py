import tempfile
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase

from blog.models import Post


class ImportPostsTests(TestCase):
    def test_imports_frontmatter_and_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "hello-world.md"
            file.write_text(
                "---\n"
                "title: 欢迎\n"
                "date: 2026-09-10\n"
                "tags: [随笔, 开始]\n"
                "category: 随笔\n"
                "summary: 摘要\n"
                "draft: false\n"
                "---\n"
                "\n"
                "正文内容\n",
                encoding="utf-8",
            )

            call_command("import_posts", tmp)

        post = Post.objects.get(slug="hello-world")
        self.assertEqual(post.title, "欢迎")
        self.assertEqual(post.tags, ["随笔", "开始"])
        self.assertEqual(post.category, "随笔")
        self.assertEqual(post.summary, "摘要")
        self.assertEqual(post.content, "正文内容")
        self.assertFalse(post.draft)
