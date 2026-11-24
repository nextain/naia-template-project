[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | **简体中文** | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**为 AI 编程智能体预先整理好的工作空间脚手架。**

使用 Claude Code、Codex 等 AI 编程工具时，每种工具的规则文件位置各不相同，
“这份文档能否公开”“技能该放在哪里”之类的问题也只能临时处理。Naia ADK 把这副骨架
提前搭好：就像在新笔记本上先配好开发环境一样，先给 AI 智能体一张整洁的书桌。
它还附带一个仪表盘，让工作空间的状态一目了然。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## 5 分钟上手

需要 **Node 22+** 和 **pnpm 9+**。

```bash
pnpm install    # 安装工作空间依赖
pnpm dev        # 同时运行 API 服务器(:3141)与仪表盘(:3142)
```

在浏览器中打开 `http://localhost:3142` 即可看到仪表盘，以下三项一目了然：

- **工作空间** — 项目与子模块、文件树，以及每一项的披露等级。
- **技能目录** — 本工作空间已注册技能的列表与内容。
- **设置 / 监控** — 服务器配置、客户端状态、数据目录。

仪表盘会把 `/api/*` 请求转发到 3141 端口的 API 服务器。若只想运行其中一个，
可用 `pnpm dev:server`（→ 3141）或 `pnpm dev:dashboard`（→ 3142）。启动脚本
`./start.sh`（Linux/macOS）与 `start.bat`（Windows）最终都执行 `pnpm dev`。
服务器 CLI 接受 `--port`、`--host`、`--root` 参数，例如用
`pnpm serve -- --root /path/to/workspace` 指向另一个工作空间。

## 内含什么

### 工作空间脚手架

它为 AI 智能体提供一组位置固定的目录，开箱即可工作。AI 阅读的上下文放在
`.agents/`（英文，JSON/YAML），人类阅读的镜像放在 `.users/`（韩文，Markdown）。
这个镜像不是完整复制，而是只收录人类需要阅读的核心文档的部分镜像
（例如技能以 `.agents/skills/` 为准，`.users/skills/` 中只有一部分）。
技能、数据、项目都有固定位置，无论用哪种工具打开，看到的形状都一样。

### 仪表盘与 API

包含一个用眼睛管理 workspace 的 Next.js 仪表盘，以及背后支撑它的 Fastify API
服务器。API 对外提供 workspace 元数据（`/api/workspace`）、技能目录
（`/api/skills`）、文件读写（`/api/files`），以及实时推送文件变更的
WebSocket（`/api/ws`）。正因为有这个 API，仪表盘之外的程序也能访问工作空间。

### 技能系统

把重复性工作打包成可复用的技能。每个技能只用一个 `SKILL.md` 定义，
API 服务器扫描 `skills/` 构建目录。设计上即使只有一个技能违反规范，
整个目录也会直接报错（fail-closed）：不会悄悄跳过坏掉的技能只发布其余部分，
而是让运维当场修复。这是为了防止带着残缺目录上线而有意为之的选择。

### 规则与最小治理

即使是个人使用的工作空间，一旦有 AI 与自动化经手，就需要最起码的规则。
Naia ADK 把 `read`、`write`、`execute`、`publish` 拆成互不相同的关注点，
并给每份文档标注披露等级。生产变更、密钥处理、对外公开等难以撤销的操作，
与普通本地编辑分开，走审批门禁。

披露等级共四级。`public` 可直接发到公开网站或开源仓库；`controlled` 经评审后
可对外分享；`internal` 只在工作空间内使用；`confidential` 覆盖合同、凭据、
个人信息等敏感材料。凭据通常放在 git 之外，但按等级仍属 `confidential`。

> **本版本中会话契约强制保持关闭。** 仓库中提交了 `.claude/no-harness` 标记，
> 因此会话契约门禁不会拦截任何操作。若将其打开，没有契约的会话会被挡在包括
> `npm test` 在内的一切变更类 shell 命令之外，新克隆的人连测试都跑不起来。
> 文件编辑通道正是出于这个原因事先放开的，shell 通道还没有同等待遇。
> 强制推送、破坏性 git 操作、部署、对外发送守卫不受影响，照常运行。
> 进展在 [#34](https://github.com/nextain/naia-template-project/issues/34) 跟踪，
> 详情见 `.claude/no-harness`。`AGENTS.md` 中会话边界一节描述的是预期设计，
> 而非当前运行时行为。

### LLM 适配器 (naia-anyllm)

为需要联网调用 LLM 的功能内置了 `naia-anyllm` 适配器。它经由
[any-llm](https://github.com/nextain/any-llm) 网关连接，也可直连 OpenAI、
Anthropic、Google 等 provider。默认使用 Naia 账户：把在
[naia.nextain.io](https://naia.nextain.io) 签发的密钥放入 `NAIA_KEY` 环境变量，
即可直接使用账户额度。没有密钥时，会在任何付费调用之前报错。若要切换
provider 或模型，请复制
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example)
后使用，API 密钥放在环境变量或操作系统钥匙串中，不要写进配置文件。
`naia-settings/llm.json` 只记录 `apiKeyRef: "NAIA_KEY"`，不记录密钥本身。
个人 fork 若需长期备份，可使用 `data-private/key/` 下的 age 加密 vault
（参见 [`.env.example`](.env.example)）。

查询支持的模型与现行价格、翻译长 PDF，请使用 `translate-doc` 技能。
模型与价格查询无需密钥即可使用，翻译会先给出费用预估，并可从中断处续译。

## 为什么这样设计

### 格式即契约

Naia ADK 的核心不是某个具体工具，而是**格式**。目录布局（`.agents/`、`.users/`、
`skills/`、`data-*/`）与文件 schema（`agents-rules.json`、`SKILL.md`）是定死的约定，
任何能读懂这份约定的工具都能消费同一个工作空间。Claude Code、opencode、
Codex、naia-agent 无需内嵌彼此的代码，各自读取同一个工作空间。
因此无论换工具还是混用多种工具，工作空间都照常运转。

规则执行本身也不绑定工具。中立于宿主的核心（`.agents/hooks/core/`）与策略
（`.agents/hooks/policies/`）用同一套规则同时驱动 Claude Code 钩子与 pi 扩展。

### 成长为团队之前的个人底座

Naia ADK 严格地面向单人、个人使用。公司组织架构、租户规则、委派审批链属于
更高层的范畴。它给你的，是在工作空间长大到团队或公司规模之前，先把上下文纪律
写在何处落定的一个地方。

需要团队协作与共享知识时，可扩展到
[Naia Business ADK](https://nextain.io/adk)。该扩展把基线拓宽为资产、流程、
权限治理，并加入团队归属与委派审批。

### Fork 链

Naia ADK 生来就是要被 fork 成自己的东西。个人直接 fork `naia-adk`，
组织经由 `naia-business-adk` 生成公司与成员工作空间。

```
naia-adk                  ← 个人底座 (公开, Apache 2.0)
  └── {org}-adk           ← 组织 fork: 公司数据 + 业务子模块
        └── {user}-adk    ← 个人 fork: 个人数据 + 项目子模块
```

Nextain 实际运行的链条是 `naia-adk → naia-business-adk → nextain-adk → alpha-adk`。

## 结构

仓库分为运行时代码（`packages/`）、规则与上下文（`.agents/`、`.users/`）、
技能（`skills/`、`.agents/skills/`），以及每个 fork 各自填充的数据目录。

| 目录 | 用途 |
|-----------|---------|
| `.agents/` | AI 阅读的上下文（英文，JSON/YAML）——规则的唯一真实来源 |
| `.users/` | 人类阅读的镜像（韩文，Markdown） |
| `.claude/` | Claude Code 配置、钩子、技能软链接 |
| `skills/` | 运营/运行时技能（由仪表盘 API 提供） |
| `scripts/` | 实用脚本 |
| `templates/` | 文档模板 |
| `docs/` | 架构文档、设计规格 |
| `packages/` | 运行时包（pnpm workspace） |

### 运行时包 (packages/，共 10 个)

三个是真正运行的程序，其余是定义格式与规格的轻量包。

- `core` — 解析工作空间与技能的引擎。
- `server` — 基于 Fastify 的 REST/WebSocket API。
- `dashboard` — Next.js 仪表盘 UI。
- `skill-spec` — 与工具无关的技能格式契约（`SkillDescriptor`、`SkillLoader`）。
- `skills-builtin` — 通用技能目录。
- `openclaw-compat` — 把 OpenClaw 技能迁移为 naia 格式的迁移工具。
- `persona` — 系统提示词约定规格。
- `process` — 工作流模式规格（评审 → 决策 → 执行、议题驱动开发等）。
- `naia-anyllm` — any-llm 网关 / 直连 provider 的 LLM 适配器。
- `artifacts-spec` — 权限（RBAC）与开发生命周期（SDLC）产物的标准 schema。
  定义 15 种产物类型的 JSON Schema，并规定每种是 git 跟踪还是会话期有效。

### 数据目录（gitignore，每个 fork 自填）

这四个目录不进仓库，fork 的人填自己的数据。

| 目录 | 范围 | 内容 |
|-----------|-------|---------|
| `data-company/` | 公司 | 公司级文档、共享资源 |
| `data-teams/` | 团队 | 团队文档（战略、财务等） |
| `data-private/` | 个人 | 个人数据、env 文件、私密文档 |
| `projects/` | 个人 | 项目仓库（子模块） |

### 两棵技能树

技能分两处存放，消费者不同。

- `.agents/skills/` — AI 助手与工作流技能。Claude Code 经由 `.claude/skills/`
  软链接使用。包括评审（`review-pass`）、验证（`verify-implementation`）、
  工作树合并（`merge-worktree`）、文档抽取（`read-doc`）、专利/著作权/薪酬等
  业务技能，以及 `finetune-persona`、`secret-vault`、`youtube-upload` 等。
- `skills/` — 运营/运行时技能。API 服务器扫描 `skills/**/SKILL.md` 提供给
  仪表盘。包括邮件/短信/通知发送、频道管理、服务与 Web 监控、文档生成，
  `skills/business/` 中是组织级技能（如 `press-release`）。

最准确的清单是仪表盘中的技能目录。文字版表格也整理在
[AGENTS.en.md](AGENTS.en.md#skills)。

## 上手指南

### 个人使用

1. 把 `naia-adk` fork 到自己的账户（有条件请设为私有）。
2. 克隆：`git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. 添加 upstream：`git remote add upstream https://github.com/nextain/naia-template-project.git`
4. 创建数据目录：`mkdir -p data-private projects`
5. 添加项目、配置 `.agents/`，开始工作。
6. 若使用 Naia 账户资源，把 `NAIA_KEY` 设为环境变量。
7. 定期同步：`git fetch upstream && git merge upstream/main`

### 公司使用

1. 为获取 `naia-business-adk` 访问权限[联系我们](https://nextain.io/contact)。
2. 把 `naia-business-adk` 私有 fork 到组织账户后克隆。
3. 添加 upstream：`git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. 填写公司数据与项目子模块：`mkdir -p data-company projects`、
   `git submodule add <repo> projects/<name>`
5. 每位成员再把组织 ADK fork 一份作为个人工作空间。

### Naia Shell 集成（可选）

若使用 [Naia Shell](https://github.com/nextain/naia-shell) 桌面应用，把工作空间
路径指向你的 ADK 目录即可，技能与数据经由 API 提供。

## 参与贡献

议题、PR、讨论可用顺手的语言书写，AI 会居中沟通。只是 git 记录
（提交、上下文、共享产物）请用英文保留。完整流程与规则见
[CONTRIBUTING.md](CONTRIBUTING.md)。开发默认采用议题驱动开发，
详细流程在 [AGENTS.en.md](AGENTS.en.md) 与 [`.agents/workflows/`](.agents/workflows/)。

## 路线图

以下是计划，不是今天就能用的功能。

- **知识原子** — 现在的上下文以文件为单位，找一条信息也要把整个文件读进来，
  白白浪费 token。设想是把上下文打碎成最小有意义的知识单元，用标签链接起来，
  每次只精确取出需要的片段。经由 CLI 或 MCP 访问，保持工具中立。

## 许可证

Apache License 2.0，详情见 [LICENSE](LICENSE)。

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Naia 生态

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell)（桌面与 Web 终端客户端）
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent)（智能体运行时与工具编排）
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory)（智能体持久记忆层）
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler)（结构化知识库编译器）
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk)（AI 开发套件）
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
