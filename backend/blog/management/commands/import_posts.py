from datetime import date, datetime
from pathlib import Path

import frontmatter
from django.core.management.base import BaseCommand, CommandError

from blog.models import Post


class Command(BaseCommand):
    help = "导入 src/posts 下的 Markdown 文章"

    def add_arguments(self, parser):
        parser.add_argument("path", type=Path)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        root = options["path"].resolve()
        if not root.is_dir():
            raise CommandError(f"目录不存在：{root}")

        posts = []
        errors = []

        for file in sorted(root.glob("*.md")):
            try:
                item = frontmatter.load(file)
                raw_date = item.metadata.get("date")
                if isinstance(raw_date, str):
                    raw_date = date.fromisoformat(raw_date)
                if isinstance(raw_date, datetime):
                    raw_date = raw_date.date()
                if not isinstance(raw_date, date):
                    raise ValueError("date 缺失或格式不是 YYYY-MM-DD")

                posts.append(
                    Post(
                        slug=file.stem,
                        title=str(item.metadata.get("title") or file.stem),
                        date=raw_date,
                        tags=[str(tag) for tag in item.metadata.get("tags", [])],
                        category=str(item.metadata.get("category") or "未分类"),
                        summary=str(item.metadata.get("summary") or ""),
                        draft=item.metadata.get("draft") is True,
                        content=item.content.strip(),
                    )
                )
            except Exception as exc:
                errors.append(f"{file.name}: {exc}")

        if errors:
            raise CommandError("导入失败：\n" + "\n".join(errors))

        if options["dry_run"]:
            self.stdout.write(f"可导入 {len(posts)} 篇")
            return

        for post in posts:
            Post.objects.update_or_create(
                slug=post.slug,
                defaults={
                    "title": post.title,
                    "date": post.date,
                    "tags": post.tags,
                    "category": post.category,
                    "summary": post.summary,
                    "draft": post.draft,
                    "content": post.content,
                },
            )

        self.stdout.write(self.style.SUCCESS(f"已导入 {len(posts)} 篇"))
