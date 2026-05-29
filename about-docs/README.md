# about-docs — 이 표준(naia-template-project)에 대한 문서

> ⚠️ **이 디렉터리는 payload 가 아니다.** `project-create`/`project-migration` 이 새 프로젝트로
> **복제하지 않는다.** 여기 있는 건 naia 표준/하네스 *그 자체*를 설명·설계·검증·기록하는 메타 문서다.
> (새 프로젝트가 받는 표준 문서는 `../docs/` 에 있다.)

## 표준의 이유·역사

- [배운 교훈 (Lessons Learned)](./lessons.md) — 규칙이 *왜* 존재하는지. 이 템플릿이 나온 배경.

## 검증 기록

- [마이그레이션 검증 기록 (누적 ledger)](./migration-verification.md) — `project-migration` 스킬이
  실제로 동작하는지 정직하게 누적 추적(과적합·자가선언 경계).

## 설계·실험·검토 기록 (progress/)

`progress/` = 이 표준을 만들며 남긴 날짜별 설계·실험·적대 검토 메모(append-only).
- [주기 검증 러너 설계 + cross-review](./progress/migration-driftwatch-design-2026-05-30.md)
- [LLM 역할분담 cross-review (Gemini)](./progress/llm-roles-crossreview-gemini-2026-05-30.md)
- [템플릿 개선 제안](./progress/template-improvement-proposal-2026-05-29.md)
