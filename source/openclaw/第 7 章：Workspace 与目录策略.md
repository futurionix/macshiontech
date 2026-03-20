# 第 7 章：Workspace 与目录策略

> **这一章解决什么问题？**
> 你已经设计了 Agent 的分工（第 6 章）——采集员、整理员、巡检员、原型员各司其职。现在需要解决一个落地问题：**这些 Agent 在哪里工作？读哪些文件？写哪些目录？彼此的边界在哪里？**
> 目录策略听起来很基础，但它直接决定了两件事：**安全性**（Agent 能碰什么）和**可维护性**（你能找到什么）。一个混乱的目录结构会让你在三周后完全搞不清哪个文件是谁产生的、能不能删、删了会不会影响其他 Agent。
> 这一章会给你一套可直接使用的目录结构设计，以及"哪个 Agent 能碰哪个目录"的权限映射。

---

## 7.1 为什么要分目录

### 7.1.1 降低误操作范围

如果所有 Agent 的输入和输出都混在同一个目录里，一个 Agent 的写操作可能意外覆盖另一个 Agent 的产出。

**具体场景：** 你的采集员抓取了一批汉字数据，保存为 `data.json`。同时你的巡检员也生成了一份报告，恰好也命名为 `data.json`（或者模型推理时自作主张用了这个名字）。如果它们共享同一个目录——后写的覆盖先写的，你丢失了一批数据。

分目录之后，采集员写 `/workspace/kanji-staging/staging/`，巡检员写 `/workspace/news-watcher/reports/`，永远不会互相干扰。

### 7.1.2 方便审计

当出了问题——某个 JSON 文件的字段错误、某个报告内容不对——你需要追溯：是谁产生的？什么时候产生的？输入是什么？

如果所有输出都在同一个目录里，追溯等于大海捞针。如果按 Agent/项目分了目录，你只需要去对应的目录下看，结合日志就能快速定位。

### 7.1.3 方便版本控制

如果你想用 Git 来管理某个项目的产出（比如课程模块的 Markdown 文件），把它放在独立目录里就可以单独做 `git init`，独立管理提交历史。混在一起的话，Git 历史会非常杂乱。

### 7.1.4 方便做 staging

数据流的核心思路是：Agent 产出 → staging（暂存）→ 人工审核 → validated（已验证）→ production（生产）。这个流程需要每个阶段有独立的目录。如果所有东西都混在一起，"哪些是审核过的，哪些还没审核"根本分不清。

---

## 7.2 推荐目录结构

### 7.2.1 总体布局

```
/workspace/
├── news-watcher/              # 资讯巡检项目
│   ├── config/                # 配置文件（RSS 源列表、关键词等）
│   ├── staging/               # Agent 原始产出
│   ├── validated/             # 经过审核的产出
│   ├── reports/               # 最终报告
│   └── logs/                  # 项目级日志
│
├── kanji-staging/             # 汉字检定采集项目
│   ├── config/                # 采集源配置、字段 schema
│   ├── staging/               # 原始采集数据
│   ├── validated/             # 清洗后的数据
│   ├── samples/               # 抽检样本
│   └── logs/
│
├── course-builder/            # 课程模块化项目
│   ├── config/                # 课程设计规则、模板
│   ├── staging/               # 原始素材
│   ├── validated/             # 模块化后的课程草稿
│   ├── modules/               # 最终课程模块
│   └── logs/
│
├── prototype-lab/             # 原型验证项目
│   ├── requirements/          # 需求描述文件
│   ├── output/                # Agent 生成的代码
│   ├── preview/               # 可预览的 demo
│   └── logs/
│
└── importer/                  # 数据导入项目
    ├── config/                # 导入规则、数据库连接配置
    ├── queue/                 # 待导入的数据文件
    ├── done/                  # 已导入完成的文件
    ├── failed/                # 导入失败的文件
    └── logs/
```

### 7.2.2 每个子目录的职责

**config/ —— 配置中心**

存放该项目的所有配置文件：数据源列表、字段定义、模板、规则。这个目录是"只读"的——Agent 从这里读取配置，但不应该修改它。配置的修改应该由你（人类）来做。

**staging/ —— 暂存区**

Agent 的原始产出都先写到这里。staging 目录里的内容代表"还没有经过人工审核的原始数据"。你不应该直接把 staging 里的数据用于 production 用途。

**validated/ —— 已验证区**

你（人类）审核过 staging 中的数据后，确认质量合格的，移动到 validated 目录。或者你配置了自动化校验脚本，校验通过的自动移到 validated。

**reports/ / modules/ / output/ —— 最终产出区**

最终可用的产出。对于巡检项目是报告，对于课程项目是模块文件，对于原型项目是代码文件。

**logs/ —— 项目级日志**

除了 OpenClaw 系统级日志（通过 `claw logs` 查看），每个项目还可以有自己的操作日志。比如采集了多少条记录、跳过了多少个错误源、花了多少时间等。

### 7.2.3 为什么不是一个大目录加子文件夹

你可能会想："为什么不直接用 `/workspace/data/` 这一个大目录，然后让每个 Agent 自己建子目录？"

因为权限不好控制。OpenClaw 的 Workspace 权限是按目录来分配的。如果所有 Agent 都工作在同一个 Workspace 下，很难做到"A Agent 只能读 staging、B Agent 只能写 validated"的精细控制。

独立的项目目录 = 独立的 Workspace = 独立的权限边界。

---

## 7.3 staging / validated / production 的概念

### 7.3.1 为什么中间层比自动直写更重要

假设没有 staging 层——Agent 采集到数据后直接写入最终使用的数据文件或数据库。会发生什么？

- Agent 可能抓到了错误的数据（源网站改版、字段变化）→ 错误数据直接进入 production
- Agent 可能重复抓取了已有的数据 → 重复记录直接进入 production
- Agent 可能抓取了格式不对的数据（编码错误、字段缺失）→ 脏数据直接进入 production
- Agent 的模型可能产出了幻觉内容 → 虚假信息直接进入 production

每一种情况在 staging 层都可以被拦截。staging 层的存在意义就是：**给你一个检查的机会，在数据真正"进入系统"之前。**

### 7.3.2 为什么 validated 是人工闸门的核心

数据从 staging 到 validated 的过程，就是"人工质量检查"的过程。这一步可以是：

- **手动检查**：你打开 staging 目录里的 JSON 文件，抽查几条记录，确认格式正确、内容合理，然后把文件移到 validated。
- **半自动检查**：你写一个校验脚本（检查 JSON 格式、必填字段、字段长度等），脚本通过的自动移到 validated，脚本不通过的标记为异常。
- **人工 + 自动**：脚本做初筛，你做最终确认。

无论哪种方式，关键是：**validated 目录里的数据代表"你确认过的、可以信赖的、可以用于下一步处理的数据"。**

### 7.3.3 三层数据流全景

```
Agent 产出
    │
    ↓
 staging/        ← "原始产出，未经审核"
    │
    ↓ [人工/自动校验]
    │
 validated/      ← "已验证，可用于下一步"
    │
    ↓ [importer / 手动部署]
    │
 production      ← "正式使用中的数据/系统"
```

**学习阶段你需要做到的最低要求：** 确保 Agent 的输出都写到 staging，不要让 Agent 直接写到 production 相关目录（如正式数据库、生产代码仓库、对外发布目录）。

---

## 7.4 目录权限映射

### 7.4.1 权限表

每个 Agent 应该被限制为只能访问与其职责相关的目录。以下是基于第 6 章角色设计的权限映射：

| Agent | 可读目录 | 可写目录 | 禁止访问 |
|:---|:---|:---|:---|
| news-watcher（巡检员） | news-watcher/config/ | news-watcher/staging/, reports/, logs/ | 其他项目的所有目录 |
| kanji-collector（采集员） | kanji-staging/config/ | kanji-staging/staging/, logs/ | validated/, 其他项目 |
| course-curator（整理员） | course-builder/config/, staging/ | course-builder/validated/, modules/, logs/ | 其他项目 |
| prototype-builder（原型员） | prototype-lab/requirements/ | prototype-lab/output/, preview/, logs/ | 其他项目 |
| importer（执行员） | importer/config/, queue/ | importer/done/, failed/, logs/ + 数据库 | 其他项目 |

### 7.4.2 权限设计原则

**原则一：读权限按需给。** Agent 只需要读它工作所需的配置文件和输入数据。采集员不需要读课程整理的模块文件，原型员不需要读巡检报告。

**原则二：写权限最小化。** Agent 只能写它自己的 staging/output 目录。绝对不能让一个 Agent 有权限写另一个 Agent 的目录。

**原则三：禁止跨项目访问。** 每个 Agent 只在自己的项目 Workspace 内工作。这是通过 Workspace 隔离来实现的。

**原则四：validated 和 production 目录不给 Agent 直接写权限。** 数据从 staging 到 validated 应该由你（或你的校验脚本）来控制，不是由 Agent 自己来判断"我的输出够好了，直接放到 validated 吧"。

### 7.4.3 权限违规时会发生什么

如果 Agent 试图访问它没有权限的目录——

- OpenClaw 会拒绝该操作（如果权限控制已正确配置）
- 操作会被记录到日志中
- Agent 的当前 Turn 可能因此失败

**这是好事。** 权限控制的目的就是让错误在发生之前被拦截，而不是在错误已经造成损害之后才发现。

---

## 7.5 你的项目怎么映射到 Workspace

### 7.5.1 汉字检定 → kanji-staging

**核心数据流：**

```
日语教育网站 / 检定参考书数据源
            │
            ↓
kanji-collector（采集员）
            │
            ↓
kanji-staging/staging/raw-{source}-{date}.json
            │
            ↓ [你：抽查字段、确认格式]
            │
kanji-staging/validated/clean-{date}.json
            │
            ↓ [importer：第 12 章讲]
            │
测试数据库
```

**目录使用：**

| 子目录 | 内容 |
|:---|:---|
| config/ | 采集源 URL 列表、字段 schema 定义 |
| staging/ | 每次采集的原始 JSON 文件 |
| validated/ | 你审核过的清洗数据 |
| samples/ | 抽检样本（保留不删，方便回溯） |
| logs/ | 采集日志 |

### 7.5.2 外语课程 → course-builder

**核心数据流：**

```
已采集的学习资料（来自 kanji-staging/validated/ 或其他来源）
            │
            ↓
course-curator（整理员）
            │
            ↓
course-builder/validated/modules/
            │
            ↓ [你：审核课程结构和内容]
            │
course-builder/modules/{module-name}/
```

**目录使用：**

| 子目录 | 内容 |
|:---|:---|
| config/ | 课程模板、难度分级规则 |
| staging/ | 待整理的原始素材 |
| validated/ | 整理后的课程草稿 |
| modules/ | 最终版课程模块 |
| logs/ | 整理日志 |

### 7.5.3 资讯巡检 → news-watcher

**核心数据流：**

```
RSS 源 / 新闻网站
            │
            ↓
news-watcher（巡检员）
            │
            ↓
news-watcher/staging/daily-{date}.json
            │
            ↓ [你：确认摘要质量]
            │
news-watcher/reports/daily-{date}.md
```

**目录使用：**

| 子目录 | 内容 |
|:---|:---|
| config/ | RSS 源列表、关注关键词、摘要规则 |
| staging/ | 每日原始抓取数据 |
| validated/ | 审核通过的数据 |
| reports/ | 最终日报/周报 |
| logs/ | 巡检日志 |

### 7.5.4 原型实验 → prototype-lab

**核心数据流：**

```
你的需求描述
            │
            ↓
prototype-builder（原型员）
            │
            ↓
prototype-lab/output/{project-name}/
            │
            ↓ [你：审查代码、测试 demo]
            │
正式项目开发（第 13 章讲）
```

**目录使用：**

| 子目录 | 内容 |
|:---|:---|
| requirements/ | 功能需求描述文件 |
| output/ | Agent 生成的代码文件 |
| preview/ | 可运行的 demo 预览 |
| logs/ | 生成日志 |

---

## 7.6 如果这里失败，先检查什么

**"Agent 报错说无法访问某个目录"**
→ 检查 Workspace 配置中该 Agent 的权限设置。确认它有读/写该目录的权限。

**"Agent 写了文件但我找不到"**
→ 检查 Agent 的实际输出路径。在日志中搜索文件写入记录，确认文件保存在了哪里。可能是 Workspace 的根路径与你预期的不一致。

**"目录结构建好了但不确定对不对"**
→ 先创建 config/ 和 staging/ 两个最基本的子目录就够了。validated/ 和其他目录可以等用到的时候再创建。不要一开始就建一大堆空目录。

**"不同项目之间需要共享数据怎么办"**
→ 通过文件复制或符号链接来实现，而不是让多个 Agent 共享同一个目录。比如课程整理员需要使用汉字检定的 validated 数据——你可以把 kanji-staging/validated/ 下的文件复制到 course-builder/staging/ 中，让课程整理员从自己的 staging 读取。

---

## 7.7 本章检查清单

- [ ] 理解了为什么需要按项目分目录（降低误操作、方便审计、方便版本控制）
- [ ] 能画出推荐的目录结构
- [ ] 理解了 staging → validated → production 三层数据流
- [ ] 知道了 validated 是人工闸门的核心
- [ ] 能说出每个 Agent 的读/写权限范围
- [ ] 能把自己的四个核心项目映射到 Workspace 目录
- [ ] （可选）已经在本机上创建了初始目录结构

---

## 本章学完后你应该会什么

1. **有了一套目录策略**——每个项目有独立的 Workspace，每个 Workspace 有 config/staging/validated 等标准子目录。
2. **理解了数据流的三层设计**——Agent 写 staging，你审到 validated，importer 送到 production。
3. **能为每个 Agent 定义目录权限**——谁能读什么、写什么、不能碰什么。
4. **知道了跨项目数据共享的正确方式**——复制而不是共享目录。

---

## 下一章衔接

下一章（第 8 章：Sandbox 学习专题）将深入隔离面的核心概念。你在第 3 章知道了"高风险 Agent 应该放进 Sandbox"，在第 6 章知道了"采集员和原型员推荐使用 Sandbox"——第 8 章会告诉你 Sandbox 具体是怎么工作的、怎么配置、有哪些限制和坑，以及怎么验证隔离是否真的生效。
