# Copilot / AI Agent Instructions (Short)

## 项目
- 这是一个 **Hexo** 静态博客仓库；文章主要在 `source/_posts/`（发布）与 `source/_drafts/`（草稿）。
- 你的任务：辅助作者完成**博文创作/润色/排版/发布准备**。

## 你应该做
- 产出可发布的 Markdown：标题/摘要/大纲/正文段落/结论。
- 优化结构与可读性：背景 → 问题 → 方案 → 代码 → 结果 → 总结。
- 修正文案与排版：列表、引用、代码块、表格、链接；保持风格一致。
- 维护 Hexo Front-matter（YAML，`---` 包裹），字段以仓库现有文章为准。

## 你不应该做
- 未经明确要求，不要大改站点架构/主题/构建流程/依赖（如 `themes/`、`package.json`、Hexo 配置）。
- 不要编造事实、数据、引用；不确定就提出需要作者确认的清单。

## 写作约定
- 博客主题为软件技术：行文必须客观、可验证；不确定的数据/结论要标注待确认。
- 文章头部信息（Front-matter）约定：
	- `category` 仅分两类：`English`、`中文`。
	- 文章名与文件名一致（标题与文件语义保持一致）。
	- `permalink` 统一使用英文 slug（例如：`permalink: ffmpeg-ultimate-guide/`）。
	- `date` 一般为当前时间；如果是将既有文档“改写为博文”，且可以获取到写作时间，则优先使用该文档的最后编辑时间作为写作日期（可优先参考 Git 提交时间，其次参考文件系统修改时间）。
- 常用的 Front-matter 习惯（title/permalink/date/category/tags + <!-- more --> 摘要截断）。
- 代码块用三反引号并标注语言（`js`/`ts`/`bash`/`python`）。
- 中英文混排时中英文之间加空格。
