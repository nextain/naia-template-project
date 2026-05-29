<!-- src-sha: 420e859601920586 -->
<!-- 자동 번역 미러 (M13-mirror). 원본: .agents/context/project-index.yaml -->

# {{PROJECT_NAME}}

**버전**: 0.1.0  
**마지막 갱신**: {{DATE}}

{{PROJECT_DESCRIPTION}}

---

## 세션 시작 시 반드시 읽는 파일 (순서 중요)

| 파일 | 목적 |
|------|------|
| `.agents/context/process-status.json` | 현재 이슈 + 소프트웨어 개발 생명주기(SDLC) 게이트 상태. `last_updated` 갱신 필수 |
| `.agents/context/agents-rules.json` | 규칙 정보의 원천(SoT) — 금지/필수 전체 |
| `docs/project-structure.md` | 허용된 루트 구조 명세 |

---

## 진입점

| 파일 | 목적 |
|------|------|
| `AGENTS.md` | AI 도구 하네스 진입점 (정식 정보의 원천) |
| `CLAUDE.md` | `AGENTS.md`의 Claude Code 미러 |

---

## 필요할 때 로드하는 섹션

### 프로세스

- **파일**: `docs/lessons.md`  
  **다루는 주제**: 교훈, 배운 점, 규칙의 배경

- **파일**: `docs/user-scenarios.md`  
  **다루는 주제**: 사용 사례(UC), 사용자 시나리오, 테스트 범위

- **파일**: `docs/requirements.md`  
  **다루는 주제**: 기능 요구사항(FR), 비기능 요구사항(NFR), 요구사항 전체

- **파일**: `docs/glossary.md`  
  **다루는 주제**: 용어, 명칭, 정의

### 아키텍처

- **파일**: `docs/ARCHITECTURE.md`  
  **다루는 주제**: 아키텍처, 패키지 지도, 의존성

### 진행 중인 이슈

- **파일**: `.agents/progress/`  
  **다루는 주제**: 이슈, 진행 중인 작업, 소프트웨어 개발 생명주기

---

## 컨텍스트 정보의 원천(SoT) 우선순위

1. `.agents/context/agents-rules.json`
2. `AGENTS.md`
3. `.agents/context/project-index.yaml`
