#!/usr/bin/env bash
# enforce-root-structure.sh
# F12/F13 화이트리스트 기반 루트 구조 강제 실행 스크립트.
#
# 사용법:
#   ./scripts/enforce-root-structure.sh          # dry-run: 위반 목록 출력
#   ./scripts/enforce-root-structure.sh --fix    # 미등록 항목 삭제 + 로그 기록
#
# 종료 코드:
#   0 — 위반 없음 (PASS)
#   1 — 위반 발견 또는 오류

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RULES_FILE="$ROOT_DIR/.agents/context/agents-rules.json"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/enforce-$(date '+%Y%m%d-%H%M%S').log"

FIX_MODE=false
if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
fi

# ── 의존성 확인 ──────────────────────────────────────────────────────────────

if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3가 필요합니다." >&2
  exit 1
fi

if [[ ! -f "$RULES_FILE" ]]; then
  echo "[ERROR] agents-rules.json 없음: $RULES_FILE" >&2
  exit 1
fi

# ── 화이트리스트 추출 (python3) ───────────────────────────────────────────────

ALLOWED_DIRS=$(python3 - "$RULES_FILE" <<'PYEOF'
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    rules = json.load(f)
dirs = rules.get("F12", {}).get("allowed_root_dirs", [])
print("\n".join(dirs))
PYEOF
)

ALLOWED_FILES=$(python3 - "$RULES_FILE" <<'PYEOF'
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    rules = json.load(f)
files = rules.get("F13", {}).get("allowed_root_files", [])
print("\n".join(files))
PYEOF
)

# ── 위반 탐지 ─────────────────────────────────────────────────────────────────

VIOLATIONS=()

# 루트 디렉토리 스캔
while IFS= read -r -d '' item; do
  name="$(basename "$item")"
  # VCS 메타데이터(.git)는 항상 스킵 — 화이트리스트 무관, 절대 삭제 대상 아님.
  # (standalone repo면 .git=디렉토리, submodule이면 .git=gitfile이라 양쪽 스캔에 처리)
  if [[ "$name" == ".git" ]]; then continue; fi
  # 화이트리스트에 있으면 통과
  if echo "$ALLOWED_DIRS" | grep -qx "$name"; then
    continue
  fi
  VIOLATIONS+=("DIR  $item")
done < <(find "$ROOT_DIR" -mindepth 1 -maxdepth 1 -type d -print0)

# 루트 파일 스캔 (심링크 포함)
while IFS= read -r -d '' item; do
  name="$(basename "$item")"
  if [[ "$name" == ".git" ]]; then continue; fi   # VCS 메타데이터 스킵 (submodule gitfile)
  if echo "$ALLOWED_FILES" | grep -qx "$name"; then
    continue
  fi
  VIOLATIONS+=("FILE $item")
done < <(find "$ROOT_DIR" -mindepth 1 -maxdepth 1 \( -type f -o -type l \) -print0)

# ── 결과 출력 ─────────────────────────────────────────────────────────────────

TIMESTAMP="$(date '+%Y-%m-%dT%H:%M:%S%z')"

if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  echo "[PASS] 위반 없음 — 루트 구조가 F12/F13 화이트리스트와 일치합니다."
  echo "       검사 경로: $ROOT_DIR"
  echo "       검사 시각: $TIMESTAMP"
  exit 0
fi

echo "[FAIL] 미등록 항목 ${#VIOLATIONS[@]}개 발견:"
for v in "${VIOLATIONS[@]}"; do
  echo "  - $v"
done

# ── --fix 모드: 삭제 + 로그 ──────────────────────────────────────────────────

if [[ "$FIX_MODE" == true ]]; then
  mkdir -p "$LOG_DIR"
  {
    echo "enforce-root-structure --fix"
    echo "timestamp: $TIMESTAMP"
    echo "violations_found: ${#VIOLATIONS[@]}"
    echo "---"
  } > "$LOG_FILE"

  for v in "${VIOLATIONS[@]}"; do
    type_label="${v:0:4}"   # "DIR " or "FILE"
    path="${v:5}"
    echo "  [DELETE] $path"
    echo "deleted: $path" >> "$LOG_FILE"

    if [[ "$type_label" == "DIR " ]]; then
      rm -rf "$path"
    else
      rm -f "$path"
    fi
  done

  echo ""
  echo "[FIX] 삭제 완료. 로그: $LOG_FILE"
  exit 1  # 위반이 있었으므로 exit 1 (삭제 후에도 위반 사실 기록)
else
  echo ""
  echo "  dry-run 모드 — 실제 삭제 없음."
  echo "  삭제하려면: ./scripts/enforce-root-structure.sh --fix"
  exit 1
fi
