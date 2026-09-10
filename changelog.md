# Changelog

## 2026-09-10

- 初始化 Vue3 个人静态博客项目：Vite + Vue 3（JS + 组合式 API `<script setup>`）+ Element Plus + Vue Router（hash 模式）
- 新增博客核心模块 `src/utils/blog.js`：构建期通过 `import.meta.glob` 扫描 `posts/*.md`，gray-matter 解析 frontmatter，markdown-it + highlight.js 渲染高亮
- 新增深色模式 `src/utils/useDarkMode.js`：localStorage 持久化，默认跟随系统偏好
- 新增页面：首页（最新文章）、文章列表（搜索/标签/分类筛选）、文章详情（上一篇/下一篇）、关于页
- 新增布局 `src/layout/AppLayout.vue`：顶栏导航 + 深色模式切换 + 页脚
- 新增 3 篇示例文章与 GitHub Pages 部署工作流
- 优化：highlight.js 改为按需引入常用语言，产物显著减小；补充深色模式下的代码高亮配色
- 优化：路由切换后自动回到页面顶部，补齐 GitHub Pages 工作流的 configure-pages 步骤
- 修复：gray-matter 依赖 Node 的 Buffer，浏览器运行时报 `Buffer is not defined` 导致文章页空白；改为使用浏览器可用的 js-yaml 解析 frontmatter
- 修复：移动端出现 32px 横向溢出，统一使用 `box-sizing: border-box`
- 新增 README：说明本地开发、写文章格式、目录结构与 GitHub Pages 部署步骤
- 界面美化：改为青 -> 翠 -> 黄绿的三色渐变主题，新增品牌色变量并同步 Element Plus 主题色，深浅两套配色
- 界面美化：首页新增通栏渐变横幅；顶栏改为毛玻璃加渐变底线；页脚增加渐变标线
- 界面美化：文章卡片增加渐变描边、悬停浮起与左侧渐变竖线，标签/分类使用渐变底色
- 界面美化：列表页新增页面标题与渐变工具条，筛选标签选中态使用渐变；详情页标题、上下篇导航改用渐变样式
- 界面美化：Markdown 正文的二级标题、行内代码、引用、表格表头、分割线统一使用渐变元素
- 重构：主内容区改为通栏，由各页面自行套用 `.blog-container` 与 `.page` 容器
- 优化：窄屏下文章上下篇导航改为竖排，标题不再被省略号截断
- 界面美化：主题由青绿色改为暖色系，采用珊瑚玫瑰 -> 橙 -> 琥珀渐变，同步调整深浅两套品牌色、Element Plus 主色和正文氛围底色
