# naia-template-project

**naia 표준 프로젝트 템플릿 + AI self-trust 하네스 base.**

새 프로젝트는 이 repo 를 복제해 시작하고(`project-create`), 기존 프로젝트는 이 표준으로 정리한다(`project-migration`).
핵심은 **AI 가 규칙을 알고 지키도록 강제하는 하네스** — 루트 구조 화이트리스트(F12/F13), 헌장 불변,
SDLC 게이트, 문서 고립 방지, `.agents↔.users` 미러, 그리고 이 모든 걸 검증하는 self-trust 테스트.

## 이 repo 의 두 역할

| 역할 | 무엇 | 위치 |
|------|------|------|
| **payload (복제되는 것)** | 새 프로젝트가 받는 표준 자산 — 진입점·표준 문서·검증 스크립트·하네스 테스트 | `AGENTS.md`(+미러), `docs/`, `scripts/`, `src/test/`, `.github/`, `README.template.md` |
| **이 repo 자체 (복제 안 됨)** | 표준 자체에 대한 설명·설계·실험·검증 기록 | 이 `README.md`, `about-docs/` |

> `project-create`/`project-migration` 은 **`README.md` 와 `about-docs/` 를 복제하지 않는다.**
> 새 프로젝트의 README 는 `README.template.md`(placeholder skeleton)로 생성된다.

## 사용

- **새 프로젝트**: `project-create` 스킬 — 이 repo 를 복제 → placeholder 치환 → `README.template.md`→`README.md` → `about-docs/` 제거.
- **기존 프로젝트 정리**: `project-migration` 스킬(harden) — 표준 자산 도입 → 구조/문서/미러 정합 → 검증 0 violation → 주기 검증 활성화.

## payload 표준 문서 (새 프로젝트가 받음)

색인: [`docs/README.md`](./docs/README.md)
- [프로젝트 구조 표준 (F12/F13)](./docs/project-structure.md)
- [위협 모델 — 보안 경계·시크릿 격리](./docs/threat-model.md)
- [LLM 역할 분담 (작은 모델 ↔ 큰 모델)](./docs/llm-roles.md)

## 계약↔코드 conform 게이트 (payload — 새 프로젝트가 받음)

**무슨 기능**: 매 파일 편집 후 자동으로 도는 **결정론 드리프트 검문소**(LLM 없음, **0 토큰**).
선언된 계약(헤더)과 실제 코드가 어긋나면 즉시 알리고, 안 고치고 3번 더 편집하면 **차단**한다.

**무엇을 방지**: AI가 **드리프트된 채 몇 시간씩 루프**하는 것 — 커밋·리뷰도 안 하고 틀린
토대 위에 코드를 계속 쌓는(진짜 토큰 폭발) 상황. 신호가 AI 루프 *밖*에서 들이박아 삽질을
끊는다. 표면 게이트는 통과하는데 계약과 조용히 분기한 가짜 성공(naia-144 `daf35d0`류)을 잡는다.

**소스**: `scripts/conform/{oracle,check,manifest}.py/.json` + `.agents/hooks/conform-gate.js`
(PostToolUse, `.claude/settings.json` 등록). 상세: [`scripts/conform/README.md`](./scripts/conform/README.md).

**켜는 법**: `scripts/conform/manifest.json`에 계약(header)/코드(source) 영역을 적으면 켜짐.
**비어 있으면 무동작**(새 프로젝트 기본 = 오탐 0). 번들 추출기는 C — 다른 언어는 `extract()` 교체.

## 이 표준에 대한 문서 (about-docs/ — 복제 안 됨)

색인: [`about-docs/README.md`](./about-docs/README.md)
- [배운 교훈 — 규칙이 존재하는 이유](./about-docs/lessons.md)
- [마이그레이션 검증 기록 (누적 ledger)](./about-docs/migration-verification.md)
- [설계·실험·검토 기록](./about-docs/progress/)

## 검증

루트에서 `bash scripts/verify-watch.sh once` — 구조·문서·미러 이탈을 한 번에 검출(위반 0 이 정상).
하네스 self-trust 테스트: `for t in src/test/*.test.mjs; do node "$t"; done`.

## License

Apache License 2.0 (`LICENSE`).
