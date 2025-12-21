# 🌻 macshion's Blog

[![Hexo](https://img.shields.io/badge/Hexo-8.1.1-0E83C0?style=flat-square&logo=hexo)](https://hexo.io)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

个人博客，基于 Hexo 框架，融合深色主题、交互式粒子背景、宽屏布局设计。

## 🚀 快速开始

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/macshion/macshion.github.io.git
cd macshion.github.io

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run server
# 或使用 hexo
npx hexo server

# 4. 打开浏览器
# 访问 http://localhost:4000
```

### 生成静态网站

```bash
# 清除缓存并生成
npm run clean && npm run build

# 或使用 hexo
npx hexo clean && npx hexo generate
```

## 📁 项目结构

```
.
├── source/              # 源文件目录
│   ├── _posts/         # 博客文章
│   ├── _drafts/        # 草稿文章
│   ├── about/          # 关于页面
│   └── img/            # 图片资源
├── themes/
│   └── cactus/         # 自定义 Cactus 主题
│       ├── layout/     # EJS 模板
│       ├── source/
│       │   ├── css/   # Stylus 样式文件
│       │   └── js/    # JavaScript 脚本
│       └── _config.yml # 主题配置
├── _config.yml         # Hexo 主配置
├── package.json        # 项目依赖
└── public/            # 生成的静态网站（构建产物）
```

## 📝 写文章

### 创建新文章

```bash
npx hexo new post "文章标题"
```

这会在 `source/_posts/` 创建一个新的 Markdown 文件。

### 文章 Front Matter 示例

```markdown
---
title: 文章标题
date: 2025-12-21 10:00:00
categories: English
tags:
  - JavaScript
  - React
---

文章内容...
```

### Front Matter 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 文章标题 | Article Title |
| `date` | 发布日期 | 2025-12-21 10:00:00 |
| `categories` | 分类（English/中文） | English 或 中文 |
| `tags` | 标签（数组） | [React, JavaScript] |
| `description` | 文章描述 | 可选 |
| `photos` | 相册模式 | 可选 |

## 🔧 构建部署

```bash
# 清除缓存
npm run clean

# 构建网站
npm run build

# 清除并构建
npm run clean && npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 📚 相关资源

- [Hexo 官方文档](https://hexo.io/zh-cn/)
- [Cactus 主题](https://github.com/probberechts/hexo-theme-cactus)
- [Stylus 文档](https://stylus-lang.com/)

## 📧 联系方式

- GitHub: [@macshion](https://github.com/macshion)
- 博客: [macshion.github.io](https://macshion.github.io)
