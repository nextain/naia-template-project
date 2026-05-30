# 마이그레이션 검증 기록 (누적 ledger)

> **목적**: `project-migration` 스킬이 "실제로 동작하는지"를 **정직하게 누적 기록**한다.
> 마이그레이션을 돌릴 때마다 한 행을 추가하고, 무엇이 검증됐고 무엇이 아직 공백인지 갱신한다.
> n=1 → n=2 → … 로 커버리지가 자라는 걸 한눈에 본다 (과적합·자가선언 경계).
>
> **위치(확정)**: `about-docs/` — 이 표준 repo *자체*에 대한 메타 문서(payload 아님, 복제 제외).
> 검증 대상이 "이 표준으로의 마이그레이션 능력"이라 표준 repo 가 안정 앵커이고, 새 프로젝트로
> 복제돼선 안 되므로 payload 인 `docs/` 가 아니라 `about-docs/` 에 둔다.

## 검증 범위 매트릭스 (modes × 축)

| 축 | Mode B (harden) | Mode A (extract→submodule) |
|---|:---:|:---:|
| 구조 강제 (F12/F13 + disposition 6분류) | ✅ n=2 | ❌ 미검증 |
| 하네스 self-trust 테스트 통과 | ✅ n=2 | ❌ |
| 문서 고립 검출·복구 (doc-graph + README 허브) | ✅ n=2 (다중 면제 dir 포함) | ❌ |
| 미러 (.agents↔.users, charter JSON 제외) | ✅ n=2 | ❌ |
| 주기 검출 배선 (verify-watch, 2단계) | ✅ n=2 (동기 once/accept) | ❌ |
| 소실·유출 0 | ✅ n=2 (naia-cognitive 32 rename / naia-memory 추적제외 20+격리 2, 코어 삭제 0) | ❌ |
| **union merge (배열 병합 보존)** | ✅ n=1 (naia-memory F-MEM-01..09 + locked + phase 100% 보존) | ❌ |
| **보류 격리 (quarantine, 처분 6번째)** | ✅ n=1 (naia-memory 방치 스캐폴드 2건 → quarantine 3개월) | ❌ |
| **지저분한 repo disposition** (cruft 많은 repo) | ✅ n=1 (naia-memory: 스캐폴드·89MB 덤프·캐시·cruft 혼재 정리) | ❌ |
| **fresh end-to-end** (처음부터 B0→B5 완주) | ✅ n=1 (naia-memory B0→B5 완주) | ❌ |
| **번역 "품질"** (의미 회색지대) | ⚠️ 부분 (거부·오염·구조붕괴만 차단, 의미왜곡 게이트 미구현) | ❌ |
| **재실행(idempotency)·실패 롤백** | ❌ | ❌ |

범례: ✅ 증거로 검증 / ⚠️ 부분·조건부 / ❌ 미검증.
✅ **n=1 순환 위험 해소**: naia-cognitive(조각 보강)와 달리 naia-memory 는 **fresh B0→B5 완주** —
스킬을 처음 보는 messy repo 에 처음부터 적용. Mode A(extract)만 여전히 0 검증.

## 마이그레이션 실행 기록 (행 누적)

| # | 프로젝트 | 모드 | 날짜 | repo_type | 결과 | 증거(commit) | 비고 |
|---|---|---|---|---|---|---|---|
| 1 | naia-cognitive | B (harden) | 2026-05-30 | Python 연구 repo (깨끗) | ✅ 단계1 통과 (위반 0, 159 assert) | naia-cognitive `d6063c7` / template `017e4a3` / skill `9edabb8` | 이 과정서 스킬 결함(B3 문서/미러 누락) 발견·수정. doc 32개 progress/ 이동(소실0). active_phase=phase_1 유지(청취 게이트). |
| 2 | naia-memory | B (harden) | 2026-05-30 | TS 라이브러리 repo (**지저분 — 스캐폴드·89MB 덤프·캐시 혼재**) | ✅ **fresh B0→B5 완주** (위반 0, 17/17 테스트, 코어 삭제 0) | naia-memory `aaebdc0` / template `e94ec40`+`21e70e8` / skill `8a298c2` | 이 과정서 **보류 격리(처분 6번째)** 신설. 방치 스캐폴드 api-server/memory-service → quarantine(3개월). 추적제외 20(89MB sillytavern+cruft, 디스크보존). union merge 로 F-MEM 9 + phase R2 보존. mem0 .db 개인기억 = 이미 gitignore 확인. |

> 기록 규칙: 마이그레이션 1건 = 1행. "결과"는 **객관 기준 2건+**(테스트 수치 + verify-watch 위반 0 등),
> AI 자가-선언 금지. 부분 통과·미완은 그대로 적는다(정직).

## 미검증 공백 (다음 검증 후보)

1. **Mode A (extract→submodule)** — 0 검증. 스킬 절반.
2. **번역 품질 게이트** — back-translation roundtrip / 핵심용어 보존 diff (cross-review 지적, 미구현).
3. **verify-watch 장기 거동** — `start` sleep-loop·재부팅·rotation 발동·중복방지 실시간 관찰 (현재 코드/테스트로만).
4. **보류 격리 만료 라이프사이클** — quarantine 만료(review_by) 후 cron 자동 압축 + SessionStart 질의 실시간 관찰 (현재 단위 테스트 28 + e2e 스모크로만; 실제 3개월 경과 미관찰).
5. **재실행/롤백** — harden 두 번 돌리기, B2 충돌·disposition 오판 시 복구.
6. **"범용" 입증** — naia 외부·다른 구조 프로젝트.

> ✅ **2026-05-30 갱신**: 행 #2(naia-memory)로 "지저분한 repo disposition" + "fresh end-to-end" + "union merge 배열보존" + "보류 격리" 공백 메움. n=1 순환 위험(naia-cognitive 조각보강) 해소. 남은 큰 공백 = Mode A.
