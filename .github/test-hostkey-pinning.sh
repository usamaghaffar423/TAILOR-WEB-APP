#!/usr/bin/env bash
# Regression test for the host-key pinning logic in deploy-backend.yml.
#
# The workflow compares the SSH host keys a server offers against the
# KNOWN_HOSTS_FINGERPRINT allowlist. The test builds fixtures from real
# generated key pairs (not hand-written lines) so the parsing path is the
# same one that runs in production.
#
# Bug this guards against: `ssh-keygen -lf` prints "<bits> <fingerprint> ...",
# so reading the fingerprint from the first field compares bit counts (3072,
# 256) against fingerprints — which rejects every legitimate key.
set -uo pipefail

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

pass=0
fail=0

# Generate a real key pair and echo "pubkey_line<TAB>fingerprint".
genkey() {
  local name="$1" type="$2"
  ssh-keygen -q -t "$type" -N '' -C "$name" -f "$TMPDIR/$name"
  local fp
  fp="$(ssh-keygen -lf "$TMPDIR/$name.pub" | awk '{print $2}')"
  printf '%s\t%s\n' "$(cat "$TMPDIR/$name.pub")" "$fp"
}

IFS=$'\t' read -r RSA_PUB  RSA_FP  <<< "$(genkey host_rsa  rsa)"
IFS=$'\t' read -r EC_PUB   EC_FP   <<< "$(genkey host_ec   ecdsa)"
IFS=$'\t' read -r ED_PUB   ED_FP   <<< "$(genkey host_ed   ed25519)"
IFS=$'\t' read -r FAKE_PUB FAKE_FP <<< "$(genkey intruder   ed25519)"

ALL="$RSA_FP,$EC_FP,$ED_FP"

# Mirrors the workflow check verbatim.
would_reject() {
  local allowlist="$1" file="$2" bad=""
  while read -r _bits fp _rest; do
    [ -n "$fp" ] || continue
    if ! echo ",$allowlist," | grep -qF ",$fp,"; then
      bad="$bad $fp"
    fi
  done < <(ssh-keygen -lf "$file" 2>/dev/null)
  [ -n "$bad" ]
}

expect() {
  local label="$1" allowlist="$2" file="$3" want_reject="$4" rejected=0
  would_reject "$allowlist" "$file" && rejected=1
  if [ "$rejected" = "$want_reject" ]; then
    printf '  ok   %s\n' "$label"; pass=$((pass + 1))
  else
    printf '  FAIL %s — wanted %s, got %s\n' "$label" \
      "$([ "$want_reject" = 1 ] && echo reject || echo accept)" \
      "$([ "$rejected" = 1 ] && echo reject || echo accept)"
    fail=$((fail + 1))
  fi
}

# Fixture: the real key file plus a substituted/extra key.
{ printf '%s\n' "$RSA_PUB" "$EC_PUB" "$ED_PUB"; } > "$TMPDIR/real_hosts"
{ printf '%s\n' "$RSA_PUB" "$EC_PUB" "$ED_PUB" "$FAKE_PUB"; } > "$TMPDIR/spoofed_hosts"
{ printf '%s\n' "$FAKE_PUB"; } > "$TMPDIR/only_intruder"

echo "host key pinning"

# The logic above is a copy. Pin the workflow itself too, so a regression in
# the YAML is caught here rather than in production. The bug this exists to
# prevent is reading the fingerprint from the wrong `read` field.
WF="$(dirname "$0")/workflows/deploy-backend.yml"
if grep -qE 'while read -r _bits fp _rest' "$WF"; then
  echo "  ok   workflow parses the fingerprint from the 2nd field"; pass=$((pass + 1))
else
  echo "  FAIL workflow does not read the fingerprint from the 2nd field"
  echo "       (ssh-keygen -lf prints '<bits> <fingerprint> ...')"
  fail=$((fail + 1))
fi
if grep -qE 'while read -r fp ' "$WF"; then
  echo "  FAIL workflow still reads the fingerprint from the 1st field (bit count)"; fail=$((fail + 1))
else
  echo "  ok   workflow does not compare bit counts"; pass=$((pass + 1))
fi

# The regression itself: with fingerprints correctly parsed, a complete
# allowlist must ACCEPT. If someone reintroduces the field-order bug, the
# bit counts get compared instead and this flips to reject.
expect "all real host keys allowlisted" "$ALL"       "$TMPDIR/real_hosts" 0
expect "allowlist contains extra entry" "$ALL,$FAKE_FP" "$TMPDIR/real_hosts" 0

expect "only one of three allowlisted"  "$ED_FP"     "$TMPDIR/real_hosts" 1
expect "allowlist missing one key"     "$RSA_FP,$ED_FP" "$TMPDIR/real_hosts" 1
expect "allowlist set but empty string" ""           "$TMPDIR/real_hosts" 1
expect "unapproved key added to server" "$ALL"       "$TMPDIR/spoofed_hosts" 1
expect "server offers only a stranger"  "$ALL"       "$TMPDIR/only_intruder" 1

echo
echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
