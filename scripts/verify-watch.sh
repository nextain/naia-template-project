#!/usr/bin/env bash
# 주기 검증 러너 — 마이그레이션 완료 후 백그라운드에서 구조·문서·미러 이탈을 주기적으로 검출한다.
#
# ⚠️ 검출·보고만 한다. 자동 수정은 절대 안 한다.
#    (작은 모델/자동 수정 = 맥락 소실로 정합성 붕괴. 수정은 사람/큰 모델이 cross-check 동반.)
#    enforce-root-structure 는 반드시 --fix 없이(읽기전용 dry-run)만 호출 — rm -rf 백그라운드 노출 차단.
#
# 보고 = baseline 대비 "신규 위반(delta)"만 가시화 (alert fatigue 방지). 같은 위반 반복 기록 안 함.
#
# 사용:
#   ./scripts/verify-watch.sh once     # 1회 검출, 결과 출력 (exit 0=신규위반 없음, 1=신규위반)
#   ./scripts/verify-watch.sh start     # 백그라운드 sleep-loop 시작 (flock 중복 방지)
#   ./scripts/verify-watch.sh stop      # 중지
#   ./scripts/verify-watch.sh status    # 최신 상태 + 실행 여부
#   ./scripts/verify-watch.sh accept    # 현재 위반 집합을 baseline 으로 승인(이후 delta 기준)
#   ./scripts/verify-watch.sh cron      # 재부팅에도 지속하려면 = crontab 한 줄 출력(권장 영속 옵션)
#
# env: VERIFY_WATCH_INTERVAL(기본 1800s) VERIFY_WATCH_LOG_MAX(기본 1MB)
#      VERIFY_DOCS_ENTRY(기본 README.md) VERIFY_DOCS_EXEMPT(기본 progress)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WORK_DIR="${VERIFY_WORK_DIR:-$ROOT_DIR/.agents/work}"   # F12 허용 + gitignore (테스트는 VERIFY_WORK_DIR 로 격리)
PID_FILE="$WORK_DIR/verify-watch.pid"
LOCK_FILE="$WORK_DIR/verify-watch.lock"
LOG_FILE="$WORK_DIR/verify-watch.log"
STATUS_FILE="$WORK_DIR/verify-status.txt"          # 최신 결과(덮어씀) = 사람/세션이 읽는 가시 채널
BASELINE_FILE="$WORK_DIR/verify-baseline.txt"      # 승인된 위반 집합 = delta 기준
INTERVAL="${VERIFY_WATCH_INTERVAL:-1800}"
LOG_MAX_BYTES="${VERIFY_WATCH_LOG_MAX:-1048576}"
DOCS_ENTRY="${VERIFY_DOCS_ENTRY:-README.md}"
DOCS_EXEMPT="${VERIFY_DOCS_EXEMPT:-progress}"

mkdir -p "$WORK_DIR"

# 모든 검출을 읽기 전용으로 실행하고, 위반 라인을 표준화해 정렬·중복제거한 집합으로 반환.
run_checks() {
  local out=""
  # 1) 루트 구조 — 인자 없음(dry-run). --fix 절대 안 붙인다.
  local sres
  sres="$(bash "$SCRIPT_DIR/enforce-root-structure.sh" 2>&1)" || true
  printf '%s\n' "$sres" | grep -E '\[(FAIL|위반)|위반:' | sed 's/^/[structure] /' >>"$WORK_DIR/.vw_tmp" 2>/dev/null || true

  # 2) 문서 그래프 — README entry + progress 면제
  if [ -d "$ROOT_DIR/docs" ]; then
    local dres
    dres="$(node "$SCRIPT_DIR/check-doc-graph.mjs" docs "$DOCS_ENTRY" --exempt "$DOCS_EXEMPT" 2>&1)" || true
    printf '%s\n' "$dres" | grep -E '^[[:space:]]+- ' | sed 's/^[[:space:]]*/[doc] /' >>"$WORK_DIR/.vw_tmp" 2>/dev/null || true
  fi

  # 3) 미러 stale — 큐레이트 context 의 yaml/yml/md 만 (json = charter, 번역 제외). --check 는 LLM 무.
  if [ -d "$ROOT_DIR/.agents/context" ]; then
    while IFS= read -r f; do
      local rel mres
      rel="${f#"$ROOT_DIR"/}"
      mres="$(node "$SCRIPT_DIR/mirror-translate.mjs" "$rel" --check 2>&1)" || true
      printf '%s' "$mres" | grep -qE 'stale|no-mirror' && echo "[mirror] $rel: $(printf '%s' "$mres" | tr -d '\n')" >>"$WORK_DIR/.vw_tmp"
    done < <(find "$ROOT_DIR/.agents/context" -type f \( -name '*.yaml' -o -name '*.yml' -o -name '*.md' \) 2>/dev/null)
  fi

  # 4) ci-verify-* (읽기전용) — 실패 시 위반으로 기록
  local v
  for v in charter completion sdlc structure; do
    [ -f "$SCRIPT_DIR/ci-verify-$v.mjs" ] || continue
    node "$SCRIPT_DIR/ci-verify-$v.mjs" >/dev/null 2>&1 || echo "[ci-verify-$v] 실패" >>"$WORK_DIR/.vw_tmp"
  done

  if [ -f "$WORK_DIR/.vw_tmp" ]; then
    sort -u "$WORK_DIR/.vw_tmp"
    rm -f "$WORK_DIR/.vw_tmp"
  fi
}

rotate_log() {
  [ -f "$LOG_FILE" ] || return 0
  local sz
  sz=$(wc -c <"$LOG_FILE" 2>/dev/null || echo 0)
  if [ "$sz" -gt "$LOG_MAX_BYTES" ]; then mv -f "$LOG_FILE" "$LOG_FILE.1"; fi
}

# 1회 실행: 현재 위반 집합 산출 → baseline 대비 delta → status/log 기록. delta 있으면 비제로.
do_once() {
  local ts cur delta n_cur n_base n_delta
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  rm -f "$WORK_DIR/.vw_tmp"
  cur="$(run_checks)"
  [ -f "$BASELINE_FILE" ] || : >"$BASELINE_FILE"
  # delta = 현재에 있으나 baseline 에 없는 위반(신규)
  delta="$(comm -23 <(printf '%s\n' "$cur" | sed '/^$/d' | sort -u) <(sort -u "$BASELINE_FILE") 2>/dev/null || true)"
  n_cur=$(printf '%s\n' "$cur" | sed '/^$/d' | grep -c . || true)
  n_base=$(sed '/^$/d' "$BASELINE_FILE" | grep -c . || true)
  n_delta=$(printf '%s\n' "$delta" | sed '/^$/d' | grep -c . || true)

  {
    echo "검증 시각: $ts"
    echo "현재 위반: $n_cur (승인 baseline: $n_base, 신규 delta: $n_delta)"
    if [ "$n_delta" -gt 0 ]; then
      echo "── 신규 위반(수정 필요 — 사람/큰 모델 게이트) ──"
      printf '%s\n' "$delta" | sed '/^$/d'
    elif [ "$n_cur" -gt 0 ]; then
      echo "(신규 없음 — 기존 위반 $n_cur 건은 baseline 으로 승인됨. accept 한 상태)"
    else
      echo "깨끗함 — 위반 0."
    fi
  } >"$STATUS_FILE"

  rotate_log
  echo "[$ts] cur=$n_cur base=$n_base delta=$n_delta" >>"$LOG_FILE"
  [ "$n_delta" -gt 0 ] && printf '%s\n' "$delta" | sed '/^$/d' | sed 's/^/  /' >>"$LOG_FILE"

  cat "$STATUS_FILE"
  [ "$n_delta" -gt 0 ] && return 1 || return 0
}

is_running() {
  [ -f "$PID_FILE" ] || return 1
  local p; p="$(cat "$PID_FILE" 2>/dev/null || echo)"
  [ -n "$p" ] && kill -0 "$p" 2>/dev/null || return 1
  # PID 재활용 방어: cmdline 에 verify-watch 포함 확인
  grep -qa "verify-watch" "/proc/$p/cmdline" 2>/dev/null
}

loop() {
  echo $$ >"$PID_FILE"
  trap 'rm -f "$PID_FILE"; exit 0' TERM INT
  while true; do
    do_once || true     # 개별 검사 실패가 loop 를 죽이지 않게(침묵사 방지)
    sleep "$INTERVAL" || true
  done
}

cmd="${1:-status}"
case "$cmd" in
  once) do_once ;;
  accept)
    rm -f "$WORK_DIR/.vw_tmp"; run_checks | sed '/^$/d' | sort -u >"$BASELINE_FILE"
    echo "현재 위반 $(grep -c . "$BASELINE_FILE" || echo 0) 건을 baseline 으로 승인. 이후 신규(delta)만 보고."
    ;;
  start)
    # flock 으로 동시 start race 차단
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then echo "이미 다른 인스턴스가 start 중(lock)."; exit 1; fi
    if is_running; then echo "이미 실행 중 (PID $(cat "$PID_FILE"))."; exit 0; fi
    nohup bash -c "exec -a verify-watch-loop bash '$0' __loop" >>"$LOG_FILE" 2>&1 &
    sleep 0.3
    echo "주기 검증 시작 (PID 파일 $PID_FILE, interval ${INTERVAL}s). 상태=status, 중지=stop."
    echo "⚠️ sleep-loop 은 재부팅에 지속 안 됨 — 영속하려면 'verify-watch.sh cron' 의 crontab 사용."
    ;;
  __loop) loop ;;   # 내부용(start 가 호출)
  stop)
    if is_running; then kill "$(cat "$PID_FILE")" 2>/dev/null && echo "중지함."; else echo "실행 중 아님."; fi
    rm -f "$PID_FILE"
    ;;
  status)
    if is_running; then echo "● 실행 중 (PID $(cat "$PID_FILE"))"; else echo "○ 실행 중 아님"; fi
    echo "---"
    [ -f "$STATUS_FILE" ] && cat "$STATUS_FILE" || echo "(아직 검증 기록 없음 — 'once' 또는 'start')"
    ;;
  cron)
    echo "# 재부팅에도 지속되는 주기 검증(권장). crontab -e 에 추가:"
    echo "*/30 * * * * cd '$ROOT_DIR' && ./scripts/verify-watch.sh once >/dev/null 2>&1"
    echo "# (신규 위반 시 .agents/work/verify-status.txt 갱신 + verify-watch.log 기록)"
    ;;
  *) echo "사용: $0 {once|start|stop|status|accept|cron}"; exit 2 ;;
esac
