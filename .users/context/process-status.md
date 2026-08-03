# 저장소 프로세스 상태

> **SoT**: `.agents/context/process-status.json`

이 문서는 저장소 전체 release/SDLC 상태의 사람용 미러다. 세션별 목표,
범위, 독자, 경로 소유권과 변경 권한은 `.agents/session-contracts/`에 둔다.

## 참조 링크

| 항목 | 위치 |
|------|------|
| 구조 명세 | [docs/project-structure.md](../../docs/project-structure.md) |
| 규칙 SoT | [.agents/context/agents-rules.json](../context/agents-rules.json) |
| 이슈 문서 | [docs/progress/99.dev-comm/](../../docs/progress/99.dev-comm/) |
| 세션 계약 스키마 | [schema.json](../session-contracts/schema.json) |
| 실행 증거 | [progress](../progress/) |

## Legacy Migration

`current_work`는 v1 데이터 유실 방지를 위해 원문 필드와 snapshot을
보존한다. 둘은 읽기 전용이며 세션 시작, 결박, 변경 승인에 사용하지 않는다.

## Repository Release Gates

P01~P05와 `resource_registry`는 저장소 전체 release cycle이 실제로 바뀔
때만 갱신한다. 일반 세션 시작/종료마다 공유 상태를 덮어쓰지 않는다.
