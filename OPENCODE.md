# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Repository Index

- Stable project rules: `.agents/context/agents-rules.json`
- Context and document routing: `.agents/context/project-index.yaml`
- Root structure contract: `docs/project-structure.md`
- Session-contract schema: `.agents/session-contracts/schema.json`
- Workflow and verification details are linked from the context index.

## Mandatory Reads

Read these before acting:

1. `.agents/context/agents-rules.json`
2. `.agents/context/project-index.yaml`
3. `docs/project-structure.md`

## Context Routing

Load durable rules and design documents through
`.agents/context/project-index.yaml`. Per-work execution evidence and handoff
state belong in `.agents/progress/`; repository-wide release state may be read
from `.agents/context/process-status.json`.

## Session Boundaries

These shared files are repository indexes, not work contracts. Mutation requires
one explicit local contract under `.agents/session-contracts/` whose registry
pointer, digest, `session_bindings`, and progress reference agree. Legacy
`process-status.current_work` and progress `session_id` fields are read-only
migration evidence and never authorize mutation.

Background or reference context is not code, UI, or public-document content
unless an output unit declares its audience and explicit `derive`, `quote`,
or `require` source authority.

## Safety Boundaries

Follow `.agents/context/agents-rules.json` for structure, authorization,
destructive actions, external communication, secrets, SDLC, and verification.
Concurrent contracts must declare non-overlapping `target_ownership` paths.

## Mirrors

`AGENTS.md` is canonical. `CLAUDE.md`, `GEMINI.md`, `OPENCODE.md`, and
`CODEX.md` are byte-identical mirrors. Validate before synchronization with
`scripts/sync-harness-mirrors.sh --check`.
