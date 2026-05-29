# 마이그레이션 검증 기록 (누적 ledger)

> **목적**: `project-migration` 스킬이 "실제로 동작하는지"를 **정직하게 누적 기록**한다.
> 마이그레이션을 돌릴 때마다 한 행을 추가하고, 무엇이 검증됐고 무엇이 아직 공백인지 갱신한다.
> n=1 → n=2 → … 로 커버리지가 자라는 걸 한눈에 본다 (과적합·자가선언 경계).
>
> **위치 메모(논의중)**: 지금은 표준 repo(naia-template-project)의 `docs/` 에 둔다 — 검증 대상이
> "이 표준으로의 마이그레이션 능력"이라 표준 repo 가 안정 앵커. 스킬(naia-adk/alpha-adk `.agents/skills/`)
> 옆에 두는 안도 있음. 살아있는 매트릭스라 append-only `progress/` 가 아니라 `docs/` 큐레이트로 둠.
> (옮기는 건 쉬움 — 더 나은 위치 논의 환영.)

## 검증 범위 매트릭스 (modes × 축)

| 축 | Mode B (harden) | Mode A (extract→submodule) |
|---|:---:|:---:|
| 구조 강제 (F12/F13 + disposition 5분류) | ✅ n=1 | ❌ 미검증 |
| 하네스 self-trust 테스트 통과 | ✅ n=1 | ❌ |
| 문서 고립 검출·복구 (doc-graph + README 허브) | ✅ n=1 | ❌ |
| 미러 (.agents↔.users, charter JSON 제외) | ✅ n=1 | ❌ |
| 주기 검출 배선 (verify-watch, 2단계) | ✅ n=1 (동기 once/accept) | ❌ |
| 소실·유출 0 | ✅ n=1 (32 rename/0 삭제) | ❌ |
| **번역 "품질"** (의미 회색지대) | ⚠️ 부분 (거부·오염·구조붕괴만 차단, 의미왜곡 게이트 미구현) | ❌ |
| **지저분한 repo disposition** (cruft 많은 repo) | ❌ 미검증 (naia-memory B0 GATE 정지) | ❌ |
| **fresh end-to-end** (처음부터 B0→B5 완주) | ❌ (naia-cognitive 는 기존 harden 에 조각 보강) | ❌ |
| **재실행(idempotency)·실패 롤백** | ❌ | ❌ |

범례: ✅ 증거로 검증 / ⚠️ 부분·조건부 / ❌ 미검증.
⚠️ **n=1 순환 위험**: 스킬 결함을 naia-cognitive 로 발견해 naia-cognitive 로 고치고 통과 확인 — fresh 프로젝트 첫 적용 아님.

## 마이그레이션 실행 기록 (행 누적)

| # | 프로젝트 | 모드 | 날짜 | repo_type | 결과 | 증거(commit) | 비고 |
|---|---|---|---|---|---|---|---|
| 1 | naia-cognitive | B (harden) | 2026-05-30 | Python 연구 repo (깨끗) | ✅ 단계1 통과 (위반 0, 159 assert) | naia-cognitive `d6063c7` / template `017e4a3` / skill `9edabb8` | 이 과정서 스킬 결함(B3 문서/미러 누락) 발견·수정. doc 32개 progress/ 이동(소실0). active_phase=phase_1 유지(청취 게이트). |

> 기록 규칙: 마이그레이션 1건 = 1행. "결과"는 **객관 기준 2건+**(테스트 수치 + verify-watch 위반 0 등),
> AI 자가-선언 금지. 부분 통과·미완은 그대로 적는다(정직).

## 미검증 공백 (다음 검증 후보)

1. **Mode A (extract→submodule)** — 0 검증. 스킬 절반.
2. **지저분한 repo** — naia-memory(api-server·dist·coverage·.db 캐시) harden 을 **fresh 로 B0→B5 완주** = disposition 실력 + fresh 흐름 동시 시험. (현재 B0 GATE 정지.)
3. **번역 품질 게이트** — back-translation roundtrip / 핵심용어 보존 diff (cross-review 지적, 미구현).
4. **verify-watch 장기 거동** — `start` sleep-loop·재부팅·rotation 발동·중복방지 실시간 관찰 (현재 코드/테스트로만).
5. **재실행/롤백** — harden 두 번 돌리기, B2 충돌·disposition 오판 시 복구.
6. **"범용" 입증** — naia 외부·다른 구조 프로젝트.
