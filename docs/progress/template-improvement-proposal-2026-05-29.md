# Template Project 개선 제안서

> 작성일: 2026-05-29
> 작성자: Claude Sonnet 4.6 (Luke Yang의 README 주석 + 세션 경험 기반)
> 목적: 이 문서를 다른 AI(Gemini, GPT-4o 등)에게 전달해 더 나은 개선안을 수렴하기 위함

---

## 1. 배경 — 우리가 실제로 부딪힌 문제들

이 템플릿은 naia 시리즈 프로젝트를 운영하면서 반복적으로 발생한 문제들의 답이다.
단순히 "좋은 구조"가 아니라 **실제 고통**에서 나왔다.

### 1-1. Compaction 이후 맥락 소실 (가장 심각)

AI는 대화 컨텍스트 한도에 도달하면 이전 내용을 압축(compaction)한다.
이 순간 다음이 사라진다:
- 현재 작업의 의도와 방향성
- 상위 지시사항 ("이렇게 하지 마라")
- 진행 중이던 SDLC 게이트 상태
- 사용자가 수차례 교정한 맥락

결과: AI가 처음부터 다시 시작하거나, 이미 거부된 방향으로 재진입한다.

### 1-2. 구조적 드리프트 (AI가 등록되지 않은 파일/폴더 생성)

세션마다 AI는 "더 나은 것 같아서" 루트에 `experiments/`, `vendor/`, `adapter-grpc/` 등을 만들었다.
누가 왜 만들었는지 추적이 안 되고, 루트가 오염됐다.

### 1-3. 프로세스 건너뜀

"빠르게 해볼게요" → 사용자 시나리오, 요구사항 없이 코드 먼저 작성 →
방향이 틀렸음을 나중에 발견 → 전부 다시 작성.

### 1-4. AI가 정책을 발명

README에 "Breaking changes require 4-week advance notice"를 AI가 추가했다.
사용자가 말한 적 없는 정책. 수개월 후 발견.

### 1-5. 요구사항·시나리오의 단일 MD 한계

`requirements.md` 하나로는 추적이 안 된다:
- 요구사항 ↔ 코드 ↔ 테스트 ↔ 이슈의 연결이 없다
- 여러 AI/개발자가 동시 작업 시 충돌
- 누가 언제 어떤 요구사항을 추가/변경했는지 모른다

### 1-6. 품질 측정의 실패

AI 프로젝트는 pass/fail 회귀 테스트만으로 품질을 알 수 없다:
- 테스트는 통과하는데 응답이 느려지거나 끊긴다
- 특정 도메인에서 성능이 떨어진다
- AI가 프로젝트 방향성을 벗어난 개발을 조용히 수행한다

---

## 2. Luke의 주석에서 도출한 개선 방향

### I01 — 헌장 변경 시 자동 동기화
> "크론이나 Hooks로 AI가 하나를 수정할 경우 자동 동기화 되어야 한다."

- `AGENTS.md` 변경 → `sync-harness-mirrors.sh` 자동 실행
- Hook: PostToolUse에 파일 변경 감지 → 동기화 트리거
- 현재: 수동 실행 의존 → 미러가 자주 diverge

### I02 — Compaction 복구 메커니즘
> "compaction 이후 맥락이나 상위 지시를 잃는 것이 가장 큰 문제로 이에 대한 고민이 필요함"

- `process-status.json`이 현재 유일한 복구 수단 — 부족하다
- 필요한 것: 세션 시작 시 자동으로 "현재 상태 브리핑"을 AI에게 주입하는 메커니즘
- Hook(PreSession/PostCompaction)으로 process-status + 상위 지시 요약을 강제 주입

### I03 — Progress 가시성 개선
> "docs의 progress에 작성하도록 할 것, 사용자가 알 수 있도록 한다."

- 현재: `.agents/progress/` — 숨김 폴더, 사용자가 보기 어렵다
- 변경: `docs/progress/` — git UI, IDE에서 바로 보인다
- `.agents/progress/`는 AI 내부용 상태만, 사람이 볼 산출물은 `docs/progress/`

### I04 — Benchmark를 품질 게이트로
> "AI로 운용하는 프로젝트들은 회귀 테스트로 품질을 체크할 수 없음.
> fail/pass가 아닌 확인이 가능하게 하기 위함임"

- 벤치마크는 pass/fail이 아니라 **추세(trend)** 측정
- 각 모듈별 응답시간, 정확도, 비용을 시계열로 기록
- 기준치 대비 10% 이상 저하 시 Alert

### I05 — Enforce 히스토리 + Logs
> "삭제에 대한 히스토리를 남겨야 함. 프로젝트에 logs 디렉토리 하나 추가 필요"

- `logs/` 루트 디렉토리 추가 (gitignored)
- `enforce-root-structure.sh --fix` 실행 시 `logs/enforce-{date}.log` 기록
- 무엇이 왜 삭제됐는지 추적 가능

### I06 — Cron: AI 오동작 감지 + Alert
> "AI의 오동작(프로젝트의 방향성을 벗어난 개발을 수행)을 체크하고 조기에 Alert을 줄 수 있어야 함"

- 정기적으로 구조 검증 + process-status 정합성 체크
- 벤치마크 추세 이상 감지
- AGENTS.md 방향성과 실제 커밋 내용 비교 (LLM-as-judge)
- Slack/이메일/Discord Alert

### I07 — RBAC + SDLC를 문서가 아닌 스크립트로
> "RBAC과 SDLC는 단순히 문서의 규칙이 아니라 프로젝트의 스크립트와 하네스로 묶여야 함."

- 현재: agents-rules.json에 규칙 선언 → AI가 읽고 따르길 바람 (soft enforcement)
- 목표: pre-commit hook, CI gate, enforce 스크립트로 **hard enforcement**
- RBAC: AI tool별 허용 액션 다름 (Claude: T0/T1만, Gemini: T0만 등)

### I08 — 요구사항 추적의 SW공학화
> "SW공학 수준의 추적이 필요함, 요구사항은 git의 이슈와 대응될 수도 있음"

- 단일 `requirements.md` → 구조화된 요구사항 시스템으로
- 요구사항 ↔ GitHub Issue ↔ 테스트 ↔ 코드 양방향 추적
- 상태 머신: Draft → Review → Approved → Implementing → Done → Deprecated

---

## 3. 즉시 적용 가능한 개선 (template 레벨)

### A. 폴더 구조 추가

```
logs/                          ← NEW: enforce 히스토리, AI 감사 로그 (gitignored)
docs/progress/                 ← 이슈별 산출물 (이미 있음, 가시성 확보)
```

### B. `.users/` 언어 정책 변경

```
.users/                        ← 기본 언어 (한국어 우선)
    commands-list.md
    hooks-list.md
    skills-list.md
    context/
        process-status.md
    en/                        ← OSS/다국어 시 추가 (선택)
    {lang}/                    ← 필요 시 추가
```

### C. `scripts/cron/` 기본 스크립트

```
scripts/cron/
    check-structure.sh         ← enforce dry-run 정기 실행
    check-benchmark-trend.sh   ← 벤치마크 추세 이상 감지
    sync-translations.sh       ← (다국어 프로젝트) 번역 동기화
```

### D. Hook 자동화

```
.agents/hooks/
    post-charter-edit.sh       ← 헌장 파일 변경 감지 → mirror 자동 동기화
    post-compaction.sh         ← compaction 이후 context 재주입 (연구 필요)
    pre-commit.sh              ← 구조 검증 + process-status 업데이트 확인
```

---

## 4. 중기 개선 — 오픈소스 도구 연동 후보

### 4-1. Compaction/Memory 문제

| 도구 | 역할 | 적합성 |
|------|------|--------|
| **Mem0** | AI 세션 간 장기 메모리 | 높음 — 오픈소스, 자체 호스팅 가능 |
| **Zep** | 대화 메모리 그래프 | 높음 — 구조화된 메모리 |
| **LangMem** | LangChain 메모리 레이어 | 중간 — LangChain 의존 |

**권장**: `process-status.json` + Mem0/Zep 조합. process-status는 구조적 상태, Mem0는 자연어 맥락.

### 4-2. AI 오동작 감지 / 관찰성

| 도구 | 역할 | 적합성 |
|------|------|--------|
| **LangSmith** | LLM 호출 추적·평가 | 높음 — LLM-as-judge 내장 |
| **Helicone** | LLM 프록시 + 로깅 | 높음 — 자체 호스팅 가능 |
| **Weights & Biases** | 실험 추적, 추세 시각화 | 높음 — 벤치마크 추세 최적 |
| **OpenTelemetry** | 표준 관찰성 | 중간 — 인프라 필요 |

**권장**: W&B(벤치마크 추세) + Helicone(LLM 감사 로그).

### 4-3. 구조 강제 / 아키텍처 거버넌스

| 도구 | 역할 | 적합성 |
|------|------|--------|
| **Semgrep** | 코드 정책 강제 (커스텀 규칙) | 높음 — 파일 구조 규칙도 가능 |
| **ArchGuard** | 아키텍처 의존성 분석 | 중간 — JVM 중심 |
| **Danger.js** | PR 규칙 자동화 | 높음 — GitHub 연동 간단 |
| **commitlint** | 커밋 메시지 강제 | 높음 — 이미 관례 있음 |

**권장**: Semgrep(구조 규칙) + Danger.js(PR 게이트) + commitlint.

### 4-4. 요구사항 추적

| 도구 | 역할 | 적합성 |
|------|------|--------|
| **GitHub Issues** | 이슈 ↔ PR ↔ 코드 연결 | 높음 — 이미 사용 중 |
| **Linear** | 구조화된 이슈 트래킹 | 높음 — 팀 협업 |
| **Doorstop** | 요구사항을 git으로 관리 | 높음 — 파일 기반, 추적 내장 |
| **StrictDoc** | SW공학 요구사항 표준 | 높음 — RST/SRS 수준 |

**권장**: 단독 개발 = GitHub Issues + 구조화된 MD. 팀/OSS = Doorstop 또는 StrictDoc.

### 4-5. 벤치마크 / 품질 측정

| 도구 | 역할 | 적합성 |
|------|------|--------|
| **SWE-bench** | AI 코딩 품질 표준 벤치 | 높음 — 업계 표준 |
| **RAGAS** | RAG 시스템 품질 측정 | 높음 — naia-memory 연동 |
| **promptfoo** | LLM 출력 regression 테스트 | 높음 — CLI, OSS |
| **Evals (OpenAI)** | 평가 프레임워크 | 중간 — OpenAI 의존 |

**권장**: promptfoo(회귀 방지) + W&B(추세) + SWE-bench subset(코딩 품질).

---

## 5. 장기 연구 과제

### R01 — Compaction 복구 표준 프로토콜

**문제**: compaction 후 AI가 "처음부터 다시" 상태가 된다.
**방향**:
- ADK 레벨 표준: 세션 시작 시 반드시 읽는 "상태 요약 파일" 스펙 정의
- AI 도구에 강제 주입 가능한 hook 메커니즘
- process-status.json을 세션 복구의 충분 조건으로 만들기

**연구 요청**: 다른 AI가 "compaction 복구를 위한 최소 컨텍스트 스펙"을 제안해줄 것.

### R02 — 다중 AI/개발자 RBAC

**문제**: 여러 AI + 여러 사람이 동시에 작업할 때 충돌, 역할 불명확.
**방향**:
- AI tool별 허용 tier 다름 (Claude Code: T0/T1, Gemini: T0만)
- 개발자별 영역 소유 (owner 필드)
- 락 메커니즘: 한 AI가 작업 중인 파일은 다른 AI가 수정 불가

**연구 요청**: "AI 에이전트를 위한 경량 RBAC 구현" 사례 및 표준 조사.

### R03 — LLM-as-Judge for Direction Drift

**문제**: AI가 프로젝트 방향성을 벗어나 조용히 개발한다.
**방향**:
- AGENTS.md의 "경계 원칙"과 실제 커밋 diff를 LLM이 비교
- "이 커밋이 헌장과 일치하는가?" 를 자동 평가
- 일치하지 않으면 PR 차단 + Alert

**연구 요청**: "AI 커밋 감사 LLM-as-judge" 구현 방법 및 기존 사례 조사.

### R04 — 요구사항을 코드와 연결하는 표준

**문제**: requirements.md가 코드와 분리돼 있다.
**방향**:
- 요구사항 ID(FR-01)를 코드 주석, 커밋 메시지, 테스트에 강제 삽입
- 자동으로 "FR-01이 어떤 파일/함수/테스트에 구현됐는가" 맵 생성
- 추적 매트릭스 자동 생성

**연구 요청**: "Traceability Matrix 자동화 도구" 조사. Doorstop, StrictDoc 실사용 경험 수렴.

---

## 6. 다른 AI에게 전달하는 조사 요청

이 문서를 다른 AI(Gemini, GPT-4o, Mistral 등)에게 전달할 때 아래 질문들을 주면 된다:

```
이 문서는 AI 도구(Claude, Gemini 등)가 코딩 프로젝트를 운영할 때
반복적으로 발생하는 문제들을 정리한 개선 제안서입니다.

다음 질문에 대해 조사하고 구체적인 방안을 제시해 주세요:

Q1. Section 5 R01 — AI 세션 compaction 이후 맥락 복구를 위한
    최소 컨텍스트 스펙은 무엇인가? 기존 메모리 시스템(Mem0, Zep 등)이
    이 문제를 어떻게 다루는가? 이 template-project 구조에 적용하는 방법을 제안하라.

Q2. Section 5 R02 — 여러 AI 에이전트가 동시에 하나의 코드베이스를
    작업할 때 충돌을 방지하는 RBAC 메커니즘의 경량 구현 방법은?
    파일 기반 lock, GitHub CODEOWNERS, 또는 다른 방법 중 무엇이 적합한가?

Q3. Section 4-2 — AI 오동작(방향성 이탈)을 자동 감지하는
    LLM-as-judge 파이프라인을 이 구조(scripts/cron/)에 구현하는
    구체적인 방법은? 비용과 정확도 트레이드오프 분석 포함.

Q4. Section 4-5 — AI 프로젝트에서 pass/fail 회귀 테스트를 대체하거나
    보완하는 trend-based 품질 측정 시스템을 benchmark/ 디렉토리에
    어떻게 구현할 것인가? promptfoo + W&B 조합의 구체적 설계를 제안하라.

Q5. Section 5 R04 — 요구사항(requirements.md)과 코드를 자동으로
    연결하는 추적 시스템의 최소 구현은? 단독 개발자 기준과
    팀(5인 이하) 기준 각각 제안하라.
```

---

## 7. 우선순위 요약

| 우선순위 | 항목 | 난이도 | 임팩트 |
|---------|------|--------|--------|
| P0 | I02 Compaction 복구 | 높음 | 매우 높음 |
| P0 | I05 Logs 디렉토리 + enforce 히스토리 | 낮음 | 높음 |
| P1 | I01 헌장 자동 동기화 hook | 중간 | 높음 |
| P1 | I03 Progress 가시성 (docs/progress/) | 낮음 | 중간 |
| P1 | I04 Benchmark trend 측정 | 중간 | 높음 |
| P2 | I06 AI 오동작 감지 cron | 높음 | 높음 |
| P2 | I07 RBAC hard enforcement | 높음 | 높음 |
| P2 | I08 요구사항 추적 구조화 | 높음 | 높음 |
| P3 | R02 다중 AI RBAC 표준 | 매우 높음 | 매우 높음 |
| P3 | R03 LLM-as-judge direction drift | 높음 | 높음 |
