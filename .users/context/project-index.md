<!-- src-sha: 73088700f6d76417 -->
<!-- 자동 번역 미러 (M13-mirror). 원본: .agents/context/project-index.yaml -->

# {{PROJECT_NAME}}

**버전:** 0.1.0  
**업데이트:** {{DATE}}

{{PROJECT_DESCRIPTION}}

---

## 세션 시작 시 반드시 읽는 파일 (순서 중요)

1. **`.agents/context/process-status.json`**  
   현재 이슈 + 개발 주기(SDLC) 게이트 상태. `last_updated` 갱신 필수.

2. **`.agents/context/agents-rules.json`**  
   규칙의 원본(SoT) — 금지사항과 필수사항 전체 명시.

3. **`docs/project-structure.md`**  
   허용된 루트 디렉터리 구조 명세.

---

## 진입점

- **`AGENTS.md`** — AI 도구 하네스 진입점(정식 원본)
- **`CLAUDE.md`** — AGENTS.md의 Claude Code 미러

---

## 필요할 때만 로드

### 프로세스

- **`docs/user-scenarios.md`**  
  사용자 사례(UC), 사용자 시나리오, 테스트 커버리지

- **`docs/requirements.md`**  
  기능 요구사항(FR), 비기능 요구사항(NFR)

- **`docs/glossary.md`**  
  용어, 명칭

### 아키텍처

- **`docs/ARCHITECTURE.md`**  
  아키텍처, 패키지 맵, 의존성

### 진행 중인 이슈

- **`.agents/progress/`**  
  이슈, 진행 상황, 개발 주기(SDLC)

---

## 컨텍스트 원본(SoT) 우선순위

1. `.agents/context/agents-rules.json`
2. `AGENTS.md`
3. `.agents/context/project-index.yaml`
