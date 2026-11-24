[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | **Tiếng Việt**

# Naia ADK

**Khung giàn không gian làm việc đã được sắp xếp sẵn để các tác tử lập trình AI làm việc.**

Khi dùng các công cụ lập trình AI như Claude Code hay Codex, mỗi công cụ lại đặt file quy tắc ở
một nơi khác nhau, và những câu hỏi như “tài liệu này có được công bố không?” hay “skill để ở đâu?”
đều được trả lời tùy lúc. Naia ADK dựng sẵn bộ khung đó từ trước. Giống như chuẩn bị môi trường
phát triển trên laptop mới, nó trao cho tác tử AI một chiếc bàn gọn gàng để bắt đầu. Nó còn kèm
theo bảng điều khiển để nhìn tình trạng không gian làm việc trong nháy mắt.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Chạy được trong 5 phút

Bạn cần **Node 22+** và **pnpm 9+**.

```bash
pnpm install    # cài đặt phụ thuộc của không gian làm việc
pnpm dev        # chạy đồng thời máy chủ API (:3141) và bảng điều khiển (:3142)
```

Mở `http://localhost:3142` trong trình duyệt để xem bảng điều khiển. Ba thứ hiện ra ngay:

- **Không gian làm việc** — dự án và mô-đun con, cây file, và mức độ
  công bố của từng mục.
- **Danh mục skill** — danh sách skill đã đăng ký trong không gian làm việc này, và nội
  dung của chúng.
- **Cài đặt / giám sát** — cấu hình máy chủ, trạng thái máy khách, thư mục dữ liệu.

Bảng điều khiển chuyển tiếp các yêu cầu `/api/*` tới máy chủ API ở cổng 3141. Muốn chỉ chạy một
trong hai, dùng `pnpm dev:server` (→ 3141) hoặc `pnpm dev:dashboard` (→ 3142). Các script khởi
động `./start.sh` (Linux/macOS) và `start.bat` (Windows) đều chạy `pnpm dev`. CLI của máy chủ
nhận `--port`, `--host` và `--root`; ví dụ, để trỏ sang không gian làm việc khác:
`pnpm serve -- --root /path/to/workspace`.

## Bên trong có gì

### Khung giàn không gian làm việc

Nó trao cho tác tử AI một bộ thư mục với vị trí cố định cho mọi thứ, để bắt đầu làm việc ngay.
Ngữ cảnh cho AI nằm ở `.agents/` (tiếng Anh, JSON/YAML), còn bản gương cho người đọc nằm ở
`.users/` (tiếng Hàn, Markdown). Bản gương này chỉ là một phần, không phải bản sao đầy đủ — nó giữ
những tài liệu con người cần đọc (ví dụ skill lấy `.agents/skills/` làm chuẩn, và chỉ một số được
phản chiếu sang `.users/skills/`). Skill, dữ liệu và dự án đều có vị trí quy định, nên không gian
làm việc trông giống nhau bất kể mở bằng công cụ nào.

### Bảng điều khiển và API

Bảng điều khiển Next.js quản lý không gian làm việc bằng hình ảnh, được nâng đỡ bởi máy chủ API
Fastify. API công bố siêu dữ liệu không gian làm việc (`/api/workspace`), danh mục skill
(`/api/skills`), đọc/ghi file (`/api/files`), và WebSocket truyền trực tiếp sự kiện đổi file
(`/api/ws`). Nhờ API này, các chương trình khác ngoài bảng điều khiển cũng chạm tới được không
gian làm việc.

### Hệ thống skill

Các việc lặp đi lặp lại được gói thành skill tái dùng. Mỗi skill được định nghĩa bởi đúng một
`SKILL.md`, và máy chủ API quét `skills/` để dựng danh mục. Chỉ cần một skill vi phạm định dạng,
cả danh mục báo lỗi (fail-closed): thay vì lặng lẽ bỏ skill hỏng và phục vụ phần còn lại, người vận
hành bị buộc phải sửa ngay tại chỗ. Đó là lựa chọn có chủ ý để tránh vô tình phát hành danh mục
chưa đầy đủ.

### Quy tắc và quản trị tối thiểu

Ngay cả không gian làm việc dùng một mình cũng cần vài quy tắc tối thiểu một khi AI và tự động
hóa chạm vào. Naia ADK tách `read`, `write`, `execute` và `publish` thành các mối quan tâm riêng
biệt, và gắn mức độ công bố cho từng tài liệu. Những việc khó đảo ngược — đổi production, giữ bí
mật, phát ngôn công khai — được tách khỏi chỉnh sửa cục bộ thông thường và đi qua cổng phê duyệt.

Mức công bố có bốn bậc. `public` an toàn để đưa nguyên trạng lên trang công khai hay repo nguồn
mở; `controlled` chia sẻ ra ngoài được sau khi duyệt; `internal` ở trong không gian làm việc;
`confidential` bao các chất liệu nhạy cảm như hợp đồng, chứng thực và dữ liệu cá nhân. Chứng thực
thường nằm ngoài git, nhưng xét theo bậc thì vẫn là `confidential`.

> **Việc cưỡng chế hợp đồng phiên trong bản phát hành này bị tắt.** Dấu `.claude/no-harness`
> đã được commit, nên cổng hợp đồng phiên không chặn gì cả. Khi bật lên, phiên không có hợp đồng
> sẽ bị chặn khỏi mọi lệnh shell có tác dụng đổi — kể cả `npm test` — khiến bản clone mới thậm
> chí không chạy nổi bộ kiểm thử của chính mình. Đường sửa file đã được mở vì cùng lý do đó;
> đường shell thì chưa được đối xử như vậy. Các rào force-push, git phá hoại, triển khai và gửi
> tin ra ngoài không bị ảnh hưởng và vẫn chạy. Tiến độ được theo dõi tại
> [#34](https://github.com/nextain/naia-template-project/issues/34), chi tiết ở
> `.claude/no-harness`. Mục ranh giới phiên trong `AGENTS.md` mô tả thiết kế dự định, không phải
> hành vi runtime hiện tại.

### Bộ điều hợp LLM (naia-anyllm)

Cho các tính năng cần chạm tới LLM, bộ điều hợp `naia-anyllm` được tích hợp sẵn. Nó kết nối qua
cổng [any-llm](https://github.com/nextain/any-llm), hoặc trực tiếp tới các nhà cung cấp như
OpenAI, Anthropic và Google. Mặc định là tài khoản Naia: đặt khóa do
[naia.nextain.io](https://naia.nextain.io) cấp vào biến môi trường `NAIA_KEY` là dùng được ngay
tín dụng tài khoản. Không có khóa, nó báo lỗi trước mọi cuộc gọi trả phí. Muốn đổi nhà cung cấp
hay model, hãy sao chép [`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example),
và giữ khóa API trong biến môi trường hay kho khóa của hệ điều hành, không để trong file cấu hình.
`naia-settings/llm.json` chỉ ghi `apiKeyRef: "NAIA_KEY"`, không bao giờ ghi giá trị khóa. Nếu fork
cá nhân cần sao lưu dài hạn, dùng két mã hóa age trong `data-private/key/` (xem
[`.env.example`](.env.example)).

Để liệt kê model được hỗ trợ và giá hiện hành, và để dịch PDF dài, dùng skill `translate-doc`.
Tra cứu model và giá chạy được không cần khóa; bản dịch trình bày chi phí ước tính trước và có thể
tiếp tục từ chỗ dừng.

## Vì sao xây dựng như vậy

### Định dạng chính là hợp đồng

Trái tim của Naia ADK không phải công cụ cụ thể nào mà là **định dạng**. Bố cục thư mục
(`.agents/`, `.users/`, `skills/`, `data-*/`) và lược đồ file (`agents-rules.json`, `SKILL.md`) là
thỏa thuận cố định, và công cụ nào đọc được thỏa thuận đó đều dùng được cùng một không gian làm
việc. Claude Code, opencode, Codex và naia-agent mỗi bên đọc cùng một không gian làm việc mà không
nhúng code của nhau. Nhờ vậy đổi công cụ hay trộn nhiều công cụ, không gian làm việc vẫn chạy.

Bản thân việc cưỡng chế quy tắc cũng không gắn với công cụ. Lõi trung lập host
(`.agents/hooks/core/`) và chính sách (`.agents/hooks/policies/`) cùng một bộ quy tắc dẫn cả hook
Claude Code lẫn phần mở rộng pi.

### Nền tảng cá nhân trước khi lớn thành đội

Naia ADK hoàn toàn đơn người dùng, cho dùng cá nhân. Sơ đồ tổ chức công ty, quy tắc tenant và
chuỗi phê duyệt ủy quyền thuộc tầng cao hơn. Thứ nó trao cho bạn là một nơi duy nhất để viết kỷ luật
ngữ cảnh trước khi không gian làm việc lớn tới cỡ đội hay công ty.

Khi cần cộng tác đội và tri thức chung, hãy mở rộng sang
[Naia Business ADK](https://nextain.io/adk). Phần mở rộng này nới đường cơ sở sang quản trị tài
sản, quy trình và quyền, đồng thời thêm quyền sở hữu đội và phê duyệt ủy quyền.

### Chuỗi fork

Naia ADK sinh ra là để fork thành của riêng bạn. Cá nhân fork `naia-adk` trực tiếp; tổ chức đi qua
`naia-business-adk` để khởi tạo không gian làm việc của công ty và thành viên.

```
naia-adk                  ← nền tảng cá nhân (công khai, Apache 2.0)
  └── {org}-adk           ← fork tổ chức: dữ liệu công ty + mô-đun con nghiệp vụ
        └── {user}-adk    ← fork cá nhân: dữ liệu cá nhân + mô-đun con dự án
```

Chuỗi thực của Nextain chạy `naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Cấu trúc

Repo chia thành code runtime (`packages/`), quy tắc và ngữ cảnh (`.agents/`, `.users/`), skill
(`skills/`, `.agents/skills/`), và các thư mục dữ liệu mỗi fork tự điền.

| Thư mục | Mục đích |
|-----------|---------|
| `.agents/` | Ngữ cảnh cho AI (tiếng Anh, JSON/YAML) — nguồn sự thật duy nhất của quy tắc |
| `.users/` | Bản gương cho người đọc (tiếng Hàn, Markdown) |
| `.claude/` | Cấu hình Claude Code, hook, liên kết tượng trưng skill |
| `skills/` | Skill vận hành/runtime (do API bảng điều khiển phục vụ) |
| `scripts/` | Script tiện ích |
| `templates/` | Mẫu tài liệu |
| `docs/` | Tài liệu kiến trúc, đặc tả thiết kế |
| `packages/` | Gói runtime (workspace pnpm) |

### Gói runtime (packages/, tổng cộng 10)

Ba gói là chương trình thực sự chạy; còn lại là gói mỏng định nghĩa định dạng và đặc tả.

- `core` — cỗ máy phân tích không gian làm việc và skill.
- `server` — API REST/WebSocket Fastify.
- `dashboard` — giao diện bảng điều khiển Next.js.
- `skill-spec` — hợp đồng định dạng skill bất khả tri công cụ (`SkillDescriptor`, `SkillLoader`).
- `skills-builtin` — danh mục skill chung.
- `openclaw-compat` — công cụ chuyển skill OpenClaw sang định dạng naia.
- `persona` — đặc tả quy ước system-prompt.
- `process` — đặc tả mẫu quy trình (duyệt → quyết định → thực thi, phát triển dẫn dắt bằng
  issue, v.v.).
- `naia-anyllm` — bộ điều hợp LLM cổng any-llm / nhà cung cấp trực tiếp.
- `artifacts-spec` — lược đồ chuẩn cho cấu phẩm phân quyền (RBAC) và vòng đời phát triển
  (SDLC). Định nghĩa 15 loại cấu phẩm dưới dạng JSON Schema và quy định, cho từng loại, thể hiện
  được git theo dõi hay giới hạn trong phiên.

### Thư mục dữ liệu (gitignore, mỗi fork tự điền)

Cả bốn không bao giờ được commit. Ai fork repo thì tự điền dữ liệu của mình.

| Thư mục | Phạm vi | Nội dung |
|-----------|-------|---------|
| `data-company/` | Công ty | Tài liệu toàn công ty, tài nguyên chung |
| `data-teams/` | Đội | Tài liệu đội (chiến lược, kế toán, v.v.) |
| `data-private/` | Cá nhân | Dữ liệu cá nhân, file env, tài liệu riêng |
| `projects/` | Cá nhân | Repo dự án (mô-đun con) |

### Hai cây skill

Skill sống ở hai nơi, do hai phía khác nhau dùng.

- `.agents/skills/` — skill trợ giúp AI và quy trình. Claude Code dùng qua liên kết tượng trưng
  `.claude/skills/`. Gồm duyệt (`review-pass`), kiểm chứng (`verify-implementation`), hợp nhất
  worktree (`merge-worktree`), trích xuất tài liệu (`read-doc`), skill nghiệp vụ như bằng sáng
  chế/bản quyền/lương, và các skill khác như `finetune-persona`, `secret-vault` và
  `youtube-upload`.
- `skills/` — skill vận hành/runtime. Máy chủ API quét `skills/**/SKILL.md` và phục vụ cho bảng
  điều khiển. Gồm gửi email/SMS/thông báo, quản lý kênh, giám sát dịch vụ và web, và sinh tài
  liệu; `skills/business/` chứa skill tổ chức như `press-release`.

Danh sách chính xác nhất là danh mục skill trong bảng điều khiển. Bảng văn bản cũng được giữ tại
[AGENTS.en.md](AGENTS.en.md#skills).

## Bắt đầu

### Cá nhân

1. Fork `naia-adk` vào tài khoản của bạn (riêng tư nếu được).
2. Clone: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Thêm upstream: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Tạo thư mục dữ liệu: `mkdir -p data-private projects`
5. Thêm dự án, cấu hình `.agents/`, và bắt đầu làm việc.
6. Nếu dùng tài nguyên tài khoản Naia, đặt `NAIA_KEY` làm biến môi trường.
7. Đồng bộ định kỳ: `git fetch upstream && git merge upstream/main`

### Công ty

1. [Liên hệ chúng tôi](https://nextain.io/contact) để truy cập `naia-business-adk`.
2. Fork `naia-business-adk` riêng tư vào tài khoản tổ chức rồi clone.
3. Thêm upstream: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Điền dữ liệu công ty và mô-đun con dự án: `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Mỗi thành viên fork lại ADK tổ chức thành không gian làm việc cá nhân.

### Tích hợp Naia Shell (tùy chọn)

Nếu dùng ứng dụng desktop [Naia Shell](https://github.com/nextain/naia-shell), hãy trỏ đường dẫn
không gian làm việc của nó tới thư mục ADK của bạn. Skill và dữ liệu được phục vụ qua API.

## Đóng góp

Viết issue, PR và thảo luận bằng ngôn ngữ bạn thoải mái; AI làm trung gian giao tiếp. Chỉ giữ bản
ghi git (commit, ngữ cảnh, cấu phẩm chung) bằng tiếng Anh. Quy trình và quy tắc đầy đủ xem
[CONTRIBUTING.md](CONTRIBUTING.md). Phát triển mặc định dẫn dắt bằng issue; luồng chi tiết nằm ở
[AGENTS.en.md](AGENTS.en.md) và [`.agents/workflows/`](.agents/workflows/).

## Lộ trình

Dưới đây là kế hoạch, chưa phải tính năng chạy được hôm nay.

- **Nguyên tử tri thức** — ngữ cảnh hiện tại dựa trên file, nên tìm một mẩu thông tin cũng phải
  tải cả file và tốn token. Ý tưởng là chẻ ngữ cảnh thành các đơn vị có nghĩa nhỏ nhất, nối bằng
  thẻ, và chỉ rút đúng mảnh cần. Truy cập qua CLI hay MCP để giữ bất khả tri công cụ.

## Giấy phép

Apache License 2.0. Xem [LICENSE](LICENSE) để biết chi tiết.

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Hệ sinh thái Naia

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (máy khách shell desktop & web)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (runtime tác tử & điều phối công cụ)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (bộ nhớ lâu dài của tác tử)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (trình biên dịch cơ sở tri thức cho ngữ cảnh có cấu trúc)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (bộ phát triển AI)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
