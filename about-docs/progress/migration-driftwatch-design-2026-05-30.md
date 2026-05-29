# 설계 proposal — 마이그레이션 2단계 + drift 자동감시 + 미러/doc 정책 (2026-05-30)

> 적대 cross-review 대상. 사용자 지시: "마이그레이션 할때 스크립트 설정 수동 돌려서 잡은 후,
> 다 잡고나면 cron형식으로 스크립트를 돌려 놓으라고. background에서 sleep하다 돌게.
> 마이그레이션 가이드도 보강하고 스크립트도 그에 맞춰."

## 동기 (검출된 체계적 gap)

검증 도구(check-doc-graph, mirror-translate --check, ci-verify-*, enforce-root-structure)는
존재하나 **어디에도 wired 안 됨** → 마이그레이션 후 drift 방치 (naia-cognitive: 45 doc 고립,
context 미러 누락, active_phase 괴리). 템플릿 자신도 doc-graph 6 고립 = naia-cognitive 만의 문제 아님.

## A. 미러 scope (M13-mirror)

- 미러 대상 = 큐레이트 context 만: `.agents/context/**`
- 제외: `.agents/reviews/**`, `.agents/progress/**` (transient AI 작업 산출물 — 사람용 SoT 아님)
- `agents-rules.json` 에 `m13_mirror: { include, exclude }` glob 정의. 트리거가 이 scope 만 순회.
- 현재 버그: `find .agents -type f` 가 review 출력까지 미러하려 함.

## B. doc-graph orphan 정책

- entry = `docs/README.md` (docs 허브). 큐레이트 docs(날짜 없는 .md)는 여기서 도달 가능해야 함(orphan 0).
- dated ledger (`*-YYYY-MM-DD.md`) = orphan 검사 **면제** (append-only 연대기 — phase-summary +
  project-index.phases 가 인덱스 역할). broken/abs 링크 검사는 그대로 유지.
- check-doc-graph 에 dated 면제 옵션 + README entry.

## C. active_phase 진실

- `project-index.yaml active_phase` + AGENTS.md phase 표 = 단일 SoT 로 일치.
- ⚠️ phase 진입 게이트 = 사용자 청취 → formal active_phase 변경은 작업 진행만으로 자율 판정 금지,
  사용자 확인. (drift-watch 는 "문서 phase vs active_phase 불일치"를 **지적**만.)

## D. 마이그레이션 2단계 (SKILL.md 보강)

- **단계1 (수동, 마이그레이션 중)**: 검출 스크립트 수동 실행 → drift 전부 surface →
  큰 모델 cross-check 수정. 0 violation 될 때까지 반복.
- **단계2 (완료 후)**: 백그라운드 drift-watch 러너 활성화. **검출+보고만 자동**,
  자동수정 금지(작은모델·자동수정=맥락소실로 정합성 붕괴). 새 drift = 사람/큰모델 세션이 수정.

## E. 백그라운드 drift-watch 러너 (`scripts/drift-watch.sh`)

- sleep-loop: `while true; do run_checks; sleep $INTERVAL; done` (기본 30분, env 조정).
- 매 주기: enforce-root-structure + check-doc-graph(README entry, dated 면제) +
  mirror --check(scope glob) + ci-verify-*. **읽기 전용 검출만**.
- 결과 → `.agents/work/drift-watch.log` (gitignored) append. 위반 시 비제로/리포트.
- ⚠️ mirror 는 `--check`(LLM 무, 검출)만. 실제 번역(쓰기·LLM 호출)은 게이트(사람 트리거).
- 제어: `drift-watch.sh start|stop|status|once`. PID 파일로 중복 실행 방지. nohup.

## Cross-review 질문 (적대적으로 답하라)

1. dated-ledger orphan 면제가 **진짜 orphan 을 숨기나**? (반론: phase-summary + project-index.phases 인덱스)
2. 미러 scope 를 context 로 좁히면 사람이 봐야 할 `.agents` 산출물을 놓치나?
3. sleep-loop 백그라운드가 cron 대비 취약점(죽으면 안 돎, 중복실행, 리소스, 재부팅 후 미기동)?
4. "검출만 자동 / 수정은 게이트" 분리가 실효 있나, 알림 피로(alert fatigue)로 무시되나?
5. drift-watch 가 git 상태·네트워크를 건드릴 위험? (--check 는 LLM 무 → OK 주장 검증)
6. 이 설계가 [[feedback_neologism_no_external_exposure]] / [[feedback_training_stop_is_user_gated]] /
   역할분담(작은모델=지적, 큰모델=수정+cross-check) 과 모순되는 지점?
