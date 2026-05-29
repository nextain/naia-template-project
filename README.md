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
