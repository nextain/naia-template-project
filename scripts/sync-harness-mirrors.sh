#!/usr/bin/env bash
# Validate the canonical repository index, then synchronize byte-identical mirrors.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$REPO_ROOT/AGENTS.md"
MIRRORS=(CLAUDE.md GEMINI.md OPENCODE.md CODEX.md)
MODE="${1:-sync}"

validate_source() {
  [[ -f "$SOURCE" ]] || { echo "error: AGENTS.md not found" >&2; return 1; }
  local lines
  lines=$(wc -l < "$SOURCE")
  [[ "$lines" -le 120 ]] || { echo "error: entrypoint exceeds 120-line index budget" >&2; return 1; }
  awk '
    /^### / { print "error: detail heading is not index-only: " $0 > "/dev/stderr"; bad=1 }
    /^## / {
      heading=substr($0,4)
      if (heading !~ /^(Repository Index|저장소 인덱스|Mandatory Reads|필수 읽기|Context Routing|컨텍스트 라우팅|Session Boundaries|세션 경계|Safety Boundaries|안전 경계|Mirrors|미러)$/) {
        print "error: disallowed entrypoint section: " heading > "/dev/stderr"; bad=1
      }
    }
    END { exit bad }
  ' "$SOURCE"
  if grep -Eiq '^[[:space:]]*(issue|phase|status|deadline|current task|current goal|현재 작업|현재 목표|현재 단계|마감|완료 상태|구현 계획|제품 문구)[[:space:]]*:' "$SOURCE"; then
    echo "error: session-specific content in AGENTS.md" >&2
    return 1
  fi
  local body_hash
  local preamble_nonempty
  preamble_nonempty=$(awk '/^## Repository Index/{exit} NF{count++} END{print count+0}' "$SOURCE")
  [[ "$preamble_nonempty" -eq 2 ]] || {
    echo "error: entrypoint preamble must contain only the repository title and one-line description" >&2
    return 1
  }
  body_hash=$(awk '/^## Repository Index/{found=1} found{print}' "$SOURCE" | sha256sum | awk '{print $1}')
  [[ "$body_hash" == "8b262a4bda2ab80a564bbc19f174526458adf26c814ba484f008a9a50c63cfcd" ]] || {
    echo "error: shared entrypoint body digest is not approved: $body_hash" >&2
    return 1
  }
}

validate_source

if [[ "$MODE" == "--check" ]]; then
  failed=0
  for mirror in "${MIRRORS[@]}"; do
    if [[ ! -f "$REPO_ROOT/$mirror" ]] || ! cmp -s "$SOURCE" "$REPO_ROOT/$mirror"; then
      echo "diverged: $mirror" >&2
      failed=1
    fi
  done
  exit "$failed"
fi

for mirror in "${MIRRORS[@]}"; do
  cp "$SOURCE" "$REPO_ROOT/$mirror"
done
echo "ok: validated AGENTS.md and synchronized ${#MIRRORS[@]} byte-identical mirrors"
