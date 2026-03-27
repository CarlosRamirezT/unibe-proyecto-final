#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

html_files=(src/html/*.html)
if [[ ${#html_files[@]} -eq 0 ]]; then
  echo "[FAIL] No HTML views found under src/html"
  exit 1
fi

fail_count=0
check_count=0

fail() {
  echo "[FAIL] $1"
  fail_count=$((fail_count + 1))
}

pass() {
  echo "[PASS] $1"
}

check_file_ref() {
  local source_file="$1"
  local ref="$2"
  local kind="$3"
  local cleaned="$ref"

  cleaned="${cleaned%%#*}"
  cleaned="${cleaned%%\?*}"

  if [[ -z "$cleaned" || "$cleaned" == "#" ]]; then
    return 0
  fi

  if [[ "$cleaned" =~ ^(https?:|mailto:|tel:|data:|javascript:) ]]; then
    return 0
  fi

  if [[ "$cleaned" == //* ]]; then
    return 0
  fi

  check_count=$((check_count + 1))
  local source_dir
  source_dir="$(cd "$(dirname "$source_file")" && pwd)"

  if ! (cd "$source_dir" && [[ -f "$cleaned" ]]); then
    fail "$kind target missing: $ref in $source_file"
  fi
}

for file in "${html_files[@]}"; do
  if grep -q '../css/main.css' "$file"; then
    pass "Shared CSS linked in $file"
  else
    fail "Missing ../css/main.css in $file"
  fi

  if grep -q '../js/navigation.js' "$file"; then
    pass "Shared navigation JS linked in $file"
  else
    fail "Missing ../js/navigation.js in $file"
  fi

  while IFS= read -r href; do
    check_file_ref "$file" "$href" "href"
  done < <(grep -oE 'href="[^"]+"' "$file" | sed -E 's/^href="([^"]+)"$/\1/')

  while IFS= read -r src; do
    check_file_ref "$file" "$src" "src"
  done < <(grep -oE 'src="[^"]+"' "$file" | sed -E 's/^src="([^"]+)"$/\1/')
done

remote_img_count=$( (grep -Rho '<img[^>]*src="https://[^"]*"' src/html || true) | wc -l | tr -d ' ' )
if [[ "$remote_img_count" == "0" ]]; then
  pass "No remote image URLs remain in src/html"
else
  fail "Remote image URLs still present: $remote_img_count"
fi

echo "Checks evaluated: $check_count"
if [[ $fail_count -gt 0 ]]; then
  echo "Smoke test finished with $fail_count failure(s)."
  exit 1
fi

echo "Smoke test passed with no failures."
