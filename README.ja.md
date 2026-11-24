[English](README.md) | [한국어](README.ko.md) | **日本語** | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**AIコーディングエージェントが働くための、あらかじめ整えられた作業空間。**

Claude CodeやCodexのようなAIコーディングツールを使うとき、ツールごとにルールファイルの置き場所が違い、
「この文書は公開できるか」「スキルはどこに置くのか」といった問いにも場当たり的に対応しがちです。Naia ADKはその骨組みを
あらかじめ整えたワークスペースです。新しいノートパソコンに開発環境をセットアップするように、AIエージェントにも整った
机を先に渡すのです。ワークスペースの状態を一目で確認できるダッシュボードも付属します。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## 5分で動かす

**Node 22以上**と**pnpm 9以上**が必要です。

```bash
pnpm install    # ワークスペースの依存関係をインストール
pnpm dev        # APIサーバー(:3141)とダッシュボード(:3142)を同時起動
```

ブラウザで`http://localhost:3142`を開くとダッシュボードが表示されます。次の3つがすぐ見えます。

- **ワークスペース** — プロジェクトとサブモジュール、ファイルツリー、各項目の公開区分。
- **スキルカタログ** — このワークスペースに登録されたスキルの一覧と内容。
- **設定 / モニタリング** — サーバー設定、クライアント状態、データディレクトリ。

ダッシュボードは`/api/*`へのリクエストをポート3141のAPIサーバーに転送します。片方だけ動かしたいときは、
`pnpm dev:server`(→ 3141)や`pnpm dev:dashboard`(→ 3142)を使います。ランチャースクリプト`./start.sh`(Linux/macOS)と
`start.bat`(Windows)はどちらも`pnpm dev`を実行します。サーバーCLIは`--port`、`--host`、`--root`を受け付けます。
たとえば別のワークスペースを指すには`pnpm serve -- --root /path/to/workspace`のように書きます。

## 中身

### ワークスペースの雛形

AIエージェントがすぐ作業できるよう、置き場所の決まったディレクトリ一式を用意しています。AIが読むコンテキストは
`.agents/`(英語、JSON/YAML)に置き、人が読むミラーは`.users/`(韓国語、Markdown)に置きます。
このミラーは完全な複製ではなく、人が読むべき文書だけを集めた部分ミラーです(たとえばスキルは`.agents/skills/`が正本で、
`.users/skills/`にあるのは一部だけです)。スキル、データ、プロジェクトにはそれぞれ決まった置き場所があり、
どのツールで開いても同じ形に見えます。

### ダッシュボードとAPI

ワークスペースを目で管理するNext.jsダッシュボードと、それを支えるFastify APIサーバーが含まれます。
APIはワークスペースのメタデータ(`/api/workspace`)、スキルカタログ(`/api/skills`)、ファイルの読み書き
(`/api/files`)、ファイル変更をリアルタイムに流すWebSocket(`/api/ws`)を公開します。このAPIのおかげで、
ダッシュボード以外のプログラムからもワークスペースにアクセスできます。

### スキルシステム

繰り返しの作業はスキルにまとめて再利用します。各スキルは`SKILL.md`1ファイルで定義され、APIサーバーが
`skills/`以下を走査してカタログを作ります。スキルが1つでも規格に違反すると、カタログ全体がエラーを出す設計です
(フェイルクローズド)。壊れたスキルを黙って除外して残りを出すのではなく、その場で直させるのです。
不完全な一覧のまま出荷する事故を防ぐための選択です。

### ルールと最小ガバナンス

一人で使うワークスペースでも、AIと自動化が触る以上は最小限のルールが必要です。Naia ADKは`read`、`write`、
`execute`、`publish`を別々の関心事として分け、文書ごとに公開区分を付けます。本番変更やシークレットの扱い、
対外公開のような取り消しの難しい作業は、通常のローカル編集から切り離して承認ゲートを通します。

公開区分は4段階です。`public`は公開サイトやオープンソースリポジトリにそのまま出せるもの、`controlled`はレビューを
経れば外部と共有できるもの、`internal`はワークスペース内だけで使うもの、`confidential`は契約書・認証情報・個人情報など
機微なものです。認証情報は通常gitの外に置きますが、区分上はやはり`confidential`です。

> **今回のリリースではセッション契約の強制は無効です。** `.claude/no-harness`マーカーがコミットされているため、
> セッション契約ゲートは何もブロックしません。有効にすると、契約のないセッションは`npm test`を含むあらゆる変更系
> シェルコマンドをブロックされるため、新規クローンではテストすら実行できません。ファイル編集パスは同じ理由で
> すでに開かれていますが、シェルパスはまだその扱いになっていません。強制プッシュ、破壊的git操作、デプロイ、
> 外部送信ガードはこれと無関係に動き続けます。進捗は[#34](https://github.com/nextain/naia-template-project/issues/34)で追跡し、
> 詳細は`.claude/no-harness`にあります。`AGENTS.md`のセッション境界の節は意図した設計を述べたもので、
> 現在のランタイム動作とは異なります。

### LLMアダプター (naia-anyllm)

LLMにつなぐ必要がある機能のために、`naia-anyllm`アダプターを内蔵します。[any-llm](https://github.com/nextain/any-llm)
ゲートウェイを経由するか、OpenAI・Anthropic・Googleなどのプロバイダーに直接つなぎます。既定はNaiaアカウントで、
[naia.nextain.io](https://naia.nextain.io)で発行したキーを`NAIA_KEY`環境変数に入れれば、アカウントのクレジットを
すぐ使えます。キーがなければ有料呼び出しの前にエラーを出します。プロバイダーやモデルを変えたいときは
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example)をコピーして使い、
APIキーは設定ファイルではなく環境変数やOSのキーストアに置きます。`naia-settings/llm.json`にはキー値ではなく
`apiKeyRef: "NAIA_KEY"`だけを記録します。個人フォークで長期保管が必要なら、`data-private/key/`の
age暗号化ボルトを使います([`.env.example`](.env.example)参照)。

対応モデルと現在価格の照会、長いPDFの翻訳には`translate-doc`スキルを使います。モデル・価格の照会はキーなしで
可能で、翻訳は見積り費用を先に示して中断箇所から再開できます。

## なぜこう作ったのか

### フォーマットこそが契約

Naia ADKの核心は特定のツールではなく**フォーマット**です。ディレクトリ配置(`.agents/`、`.users/`、`skills/`、
`data-*/`)とファイルスキーマ(`agents-rules.json`、`SKILL.md`)が定められた約束であり、この約束を読めるツールなら
どれでも同じワークスペースを消費できます。Claude Code、opencode、Codex、naia-agentは互いのコードを内包せずに
同じワークスペースを読みます。だからツールを変えたり混ぜたりしても、ワークスペースは動き続けます。

ルール強制そのものもツールに依存しません。ホスト中立コア(`.agents/hooks/core/`)とポリシー
(`.agents/hooks/policies/`)が、Claude Codeフックとpi拡張を同じルールで駆動します。

### チームに育つ前の個人ベース

Naia ADKはあくまで一人用、個人用です。会社の組織図やテナントルール、委任承認チェーンは上位レイヤーの仕事です。
その代わり、ワークスペースがチームや会社規模に育つ前に、コンテキストの扱いをどこに書くかという規律を
一か所に書いておく場所を渡します。

チーム協業と共有知識が必要になれば、[Naia Business ADK](https://nextain.io/adk)に拡張します。
この拡張はベースラインを資産・プロセス・権限ガバナンスに広げ、チーム所有権と委任承認を加えます。

### フォークチェーン

Naia ADKはフォークして自分のものにする前提です。個人は`naia-adk`を直接フォークし、組織は`naia-business-adk`を
経て会社・メンバーのワークスペースを作ります。

```
naia-adk                  ← 個人用ベース (公開、Apache 2.0)
  └── {org}-adk           ← 組織フォーク: 会社データ + ビジネスサブモジュール
        └── {user}-adk    ← 個人フォーク: 個人データ + プロジェクトサブモジュール
```

Nextainの実際のチェーンは`naia-adk → naia-business-adk → nextain-adk → alpha-adk`です。

## 構成

リポジトリはランタイムコード(`packages/`)、ルールとコンテキスト(`.agents/`、`.users/`)、スキル(`skills/`、
`.agents/skills/`)、フォークごとに埋めるデータディレクトリに分かれます。

| ディレクトリ | 用途 |
|-----------|---------|
| `.agents/` | AI向けコンテキスト (英語、JSON/YAML) — ルールの唯一の信頼源 |
| `.users/` | 人が読むミラー (韓国語、Markdown) |
| `.claude/` | Claude Code設定、フック、スキルシンボリックリンク |
| `skills/` | 運用/ランタイムスキル (ダッシュボードAPIが提供) |
| `scripts/` | ユーティリティスクリプト |
| `templates/` | 文書テンプレート |
| `docs/` | アーキテクチャ文書、設計仕様 |
| `packages/` | ランタイムパッケージ (pnpmワークスペース) |

### ランタイムパッケージ (packages/、10個)

3つは実際に動くプログラムで、残りはフォーマットと規格を定める薄いパッケージです。

- `core` — ワークスペースとスキルを解析するエンジン。
- `server` — FastifyベースのREST/WebSocket API。
- `dashboard` — Next.jsダッシュボードUI。
- `skill-spec` — ツール非依存のスキルフォーマット契約(`SkillDescriptor`、`SkillLoader`)。
- `skills-builtin` — 汎用スキルカタログ。
- `openclaw-compat` — OpenClawスキルをnaia形式に移す移行ツール。
- `persona` — システムプロンプト規約スペック。
- `process` — ワークフローパターンスペック(レビュー → 決定 → 実行、課題駆動開発など)。
- `naia-anyllm` — any-llmゲートウェイ / 直接プロバイダーのLLMアダプター。
- `artifacts-spec` — 権限(RBAC)と開発ライフサイクル(SDLC)成果物の標準スキーマ。15種の成果物タイプを
  JSON Schemaで定義し、種別ごとにgit追跡かセッション限定かを定めます。

### データディレクトリ (gitignore対象、フォークごとに用意)

この4つはリポジトリに載りません。フォークした人が自分のデータを入れます。

| ディレクトリ | 範囲 | 内容 |
|-----------|-------|---------|
| `data-company/` | 会社 | 会社全体の文書、共有リソース |
| `data-teams/` | チーム | チーム別文書 (戦略、会計など) |
| `data-private/` | 個人 | 個人データ、envファイル、非公開文書 |
| `projects/` | 個人 | プロジェクトリポジトリ (サブモジュール) |

### 2つのスキルツリー

スキルは2か所に分かれ、消費者が異なります。

- `.agents/skills/` — AI補助とワークフローのスキル。Claude Codeは`.claude/skills/`シンボリックリンク経由で
  使います。レビュー(`review-pass`)、検証(`verify-implementation`)、ワークツリーマージ(`merge-worktree`)、文書
  抽出(`read-doc`)、特許・著作権・給与などの業務スキル、`finetune-persona`、`secret-vault`、`youtube-upload`
  などが入っています。
- `skills/` — 運用/ランタイムスキル。APIサーバーが`skills/**/SKILL.md`を走査してダッシュボードに提供します。
  メール・SMS・通知送信、チャンネル管理、サービス・Web監視、文書生成などがあり、`skills/business/`には
  組織用スキル(例: `press-release`)が入ります。

いちばん正確な一覧はダッシュボードのスキルカタログです。テキストの表は[AGENTS.en.md](AGENTS.en.md#skills)にもあります。

## はじめ方

### 個人用

1. `naia-adk`を自分のアカウントにフォークします(できれば非公開で)。
2. クローンします: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. upstreamを追加します: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. データディレクトリを作ります: `mkdir -p data-private projects`
5. プロジェクトを追加し、`.agents/`を設定して作業を始めます。
6. Naiaアカウントのリソースを使うなら、`NAIA_KEY`を環境変数に設定します。
7. 定期的に同期します: `git fetch upstream && git merge upstream/main`

### 会社用

1. `naia-business-adk`へのアクセスのため[問い合わせ](https://nextain.io/contact)ます。
2. `naia-business-adk`を組織アカウントに非公開フォークしてクローンします。
3. upstreamを追加します: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. 会社データとプロジェクトサブモジュールを埋めます: `mkdir -p data-company projects`、
   `git submodule add <repo> projects/<name>`
5. 各メンバーは組織ADKをさらにフォークして個人ワークスペースにします。

### Naia Shell連携 (任意)

[Naia Shell](https://github.com/nextain/naia-shell)デスクトップアプリを使うなら、ワークスペースパスを自分の
ADKディレクトリに指定してください。スキルとデータはAPI経由で提供されます。

## 貢献

課題、PR、議論は使い慣れた言語で書いてください。AIがコミュニケーションを仲介します。ただgitの記録
(コミット、コンテキスト、共有成果物)は英語で残します。手順とルールの全体は[CONTRIBUTING.md](CONTRIBUTING.md)を
参照してください。開発は課題駆動開発を基本とし、詳細フローは[AGENTS.en.md](AGENTS.en.md)と
[`.agents/workflows/`](.agents/workflows/)にあります。

## ロードマップ

以下は計画であり、今日動く機能ではありません。

- **ナレッジアトム** — 今のコンテキストはファイル単位なので、1つの情報を探すにもファイル全体を読み込んで
  トークンを浪費します。コンテキストを最小の意味単位に砕き、タグでつないで、必要な断片だけ抜き出す構想です。
  アクセスはCLIやMCP経由にしてツール非依存に保ちます。

## ライセンス

Apache License 2.0。詳細は[LICENSE](LICENSE)参照。

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Naiaエコシステム

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (デスクトップ・Webシェルクライアント)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (エージェントランタイム・ツール編成)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (永続エージェントメモリ)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (構造化コンテキスト用ナレッジベースコンパイラ)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (AI開発キット)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
