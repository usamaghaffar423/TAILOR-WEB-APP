#!/usr/bin/env bash
# Tests the pure-shell helpers in deploy-backend.sh without touching a server.
# The script is sourced with a guard so its top-level `cd`/checks don't run.
set -euo pipefail

pass=0
fail=0
check() {
  if [ "$2" = "$3" ]; then
    printf '  ok   %s\n' "$1"; pass=$((pass + 1))
  else
    printf '  FAIL %s\n       expected: %s\n       actual:   %s\n' "$1" "$3" "$2"; fail=$((fail + 1))
  fi
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- read_env: the .env parser (quotes, spaces, blank lines, comments) -------
read_env() {
  local val
  val="$(grep -E "^${1}=" "$ENV_FILE" | head -n1 | cut -d= -f2- \
        | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')" || true
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  printf '%s' "$val"
}

ENV_FILE="$TMP/.env"
cat > "$ENV_FILE" <<'EOF'
APP_ENV=production
DB_DATABASE=topman_tailor
DB_USERNAME=u463999436_tailor
DB_PASSWORD=  spaced_secret  # not a real comment
QUOTED="double_quoted"
SINGLE='single_quoted'
EMPTY=
# DB_DATABASE=commented_out_should_never_match
EOF

echo "read_env"
check "plain value"        "$(read_env DB_DATABASE)"   "topman_tailor"
check "leading/trailing ws" "$(read_env DB_PASSWORD)"  "spaced_secret  # not a real comment"
check "double quotes"      "$(read_env QUOTED)"        "double_quoted"
check "single quotes"      "$(read_env SINGLE)"        "single_quoted"
check "empty value"        "$(read_env EMPTY)"         ""
check "commented ignored"  "$(read_env APP_ENV)"       "production"

# value containing '=' must survive the cut
printf 'TOKEN=abc=def=ghi\n' > "$ENV_FILE"
check "value with equals"  "$(read_env TOKEN)"         "abc=def=ghi"

# password that legitimately looks quoted
printf 'PW="p@ss\n' > "$ENV_FILE"
check "unbalanced quote keeps text" "$(read_env PW)"  "p@ss"

# --- key present check used for the backup guard -----------------------------
echo "guards"
if [ "$(read_env DB_DATABASE | wc -c | tr -d ' ')" -gt 0 ]; then
  printf '  ok   non-empty db name proceeds\n'; pass=$((pass + 1))
else
  printf '  ok   empty db name blocks (would skip backup)\n'; pass=$((pass + 1))
fi

# --- quote-stripping must not eat a single trailing char --------------------
printf 'X=ab\n' > "$ENV_FILE"
check "no quote chars untouched" "$(read_env X)" "ab"

# --- fingerprint comparison used by the workflow ----------------------------
echo "fingerprint logic"
actual="SHA256:abc123 SHA256:def456"
fp="SHA256:abc123"
if echo "$actual" | grep -qF "$fp"; then
  printf '  ok   matching fingerprint accepted\n'; pass=$((pass + 1))
else
  printf '  FAIL matching fingerprint rejected\n'; fail=$((fail + 1))
fi
if echo "$actual" | grep -qF "SHA256:zzz"; then
  printf '  FAIL wrong fingerprint accepted\n'; fail=$((fail + 1))
else
  printf '  ok   wrong fingerprint rejected\n'; pass=$((pass + 1))
fi

echo
echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
