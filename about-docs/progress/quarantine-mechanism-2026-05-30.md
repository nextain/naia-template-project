# 보류 격리(Quarantine) 메커니즘 — 설계 기록 (2026-05-30)

> about-docs = 이 표준 repo 자체에 대한 메타 문서(payload 아님, 복제 제외).
> 이 글은 처분 6번째 방식 "보류 격리"를 왜·어떻게 넣었는지 기록한다.

## 계기

naia-memory harden(B0) 중 `api-server/`·`memory-service/`·`memory-sillytavern-stable/` 세 디렉터리를
만났다. 객관 측정 결과:
- 셋 다 **한 커밋**(`8bc554cc`, 2026-04-21)에서 태어났고, 그 커밋 주제는 벤치마크였다 ("API server +
  memory service scaffolding"이 11개 불릿 중 마지막 줄로 곁다리).
- `api-server/`: 총 1커밋, `MemoryServicePlaceholder("will be replaced…")` + `__pycache__/*.pyc` 추적
  (gitignore 없이 통째 add 한 AI 자국). `memory-service/`: 2커밋(2번째는 순수 rename). 빌드 미연결
  (workspaces 없음, 루트 참조 0). core(`src/`)는 118커밋 활발.

→ **과거 AI 가 A/B 서빙 아키텍처를 짜다 골격만 떨구고 방치된 잔재**. 전형적 "AI 누적 entropy"
([[project_naia_adk_context_maintenance_vision]]).

## 문제: 5분류가 회색 자산을 못 받는다

기존 처분 5분류(채움/정렬/고유등록/추적제외/보안격리)는 전부 **"지금 결정"**을 강요한다.
방치 의심 자산은 "지금 지우자니 (안 만든 걸 못 지움 + 재개 가능성), 유지하자니 (죽은 골격이 표준
구조를 흐림)" 사이 회색지대다. 강제 양자택일이 오판을 부른다.

## 해법: 6번째 방식 "보류 격리"

자산을 `quarantine/<name>/` 로 옮기고(이력·디스크 보존), **정책(보관기간·압축)을 기록**한 뒤
**사용자가 처분**하게 둔다. 라이프사이클을 cron 의 비파괴 자동 처리 + 사람 게이트로 나눴다.

```
add → active ──(cron check: review_by 경과)──> 자동 tar.gz 압축(비파괴) → archived+pending_notice
                                                       │
                              (SessionStart hook: 첫 세션에 surface "이런 게 바뀌었다")
                                                       ▼
                                   권한 유저 질의 → purge(삭제) / extend(연장) / restore(복원)
```

### 확정된 정책 (사용자 결정, 2026-05-30)

| 항목 | 값 | 근거 |
|------|-----|------|
| 기본 보관기간 | **3개월** | 방치 스캐폴드가 분기 내 재개 안 되면 사실상 폐기 |
| 만료 시 동작 | **자동 압축만** (삭제 아님) | 비파괴 자동 = 디스크 절약. 삭제는 사람 게이트 |
| 삭제(purge) | **사용자 의도 호출만** | 백그라운드 자동 삭제 절대 금지 — 보존 우선 directive |
| 컨텍스트 인지 | `MANIFEST.json` **force-추적** | 세션이 "백업 자산이 있었다"를 항상 앎 |
| 만료 알림 | **첫 세션 진입 시** 권한 유저 질의 | "n개월 후 자동삭제"가 아니라 사람이 그때 결정 |

### 불변 원칙과의 정합

- 백그라운드(cron/verify-watch)는 **검출·압축·보고만** — 자동 수정/삭제 금지(verify-watch 원칙 동일).
- 파괴는 사람 루프 진입점(`quarantine-notice.js` SessionStart hook)을 거친다.
- `git rm --cached` 격리라 **이력은 git history 에 잔존** — purge 후에도 복구 가능.

## 구현 자산 (payload)

| 파일 | 역할 |
|------|------|
| `scripts/quarantine.mjs` | add/check/list/restore/extend/purge. 순수 코어(날짜·상태전이) + 얇은 fs/git 래퍼 |
| `src/test/quarantine.test.mjs` | 순수 코어 28 assert (날짜 주입, 말일·윤년·연롤오버, 상태전이) |
| `quarantine/MANIFEST.json` | 격리 정책 기록 (force-추적) |
| `quarantine/README.md` | 메커니즘 설명 (force-추적) |
| `.agents/hooks/quarantine-notice.js` | SessionStart — pending 항목 surface → 유저 질의 |
| `scripts/verify-watch.sh` (수정) | run_checks 에 `quarantine.mjs check` 배선 (cron 자동 압축+보고) |
| `scripts/enforce-root-structure.sh` (수정) | gitignore 된 루트 항목 스킵 — 구조 표준은 *추적 트리*만 관할 (로컬 데이터 오삭제 방지) |
| `agents-rules.json` (수정) | F12 += `quarantine`, `quarantine_policy` 섹션 |

## 검증

- `quarantine.test.mjs` 28/28 + 전체 하네스 17파일 PASS.
- CLI end-to-end 스모크(add→untrack+이동 / check→자동압축+pending+exit1 / list / restore→복원 /
  purge --expired→삭제 / 무인자 purge→거부 exit2) 전부 통과.
- SessionStart hook: pending 만 surface, 빈/없는 manifest = 세션 안 막음(fail-open).
- enforce gitignore-skip: 템플릿 clean PASS 유지.
