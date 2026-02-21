#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PRD_FILE="$PROJECT_ROOT/prd.json"
RESULTS_FILE="$(mktemp)"
trap 'rm -f "$RESULTS_FILE"' EXIT

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

all_pass=true

record_result() {
  echo "$1=$2" >> "$RESULTS_FILE"
}

pass_story() {
  record_result "$1" "pass"
  echo -e "  ${GREEN}PASS${NC} $1 - $2"
}

fail_story() {
  record_result "$1" "fail"
  all_pass=false
  echo -e "  ${RED}FAIL${NC} $1 - $2"
}

run_story_test() {
  local id="$1"
  local title="$2"
  shift 2
  if "$@" > /dev/null 2>&1; then
    pass_story "$id" "$title"
  else
    fail_story "$id" "$title"
  fi
}

echo "=== Terraform Town Test Runner ==="
echo ""

# ---------- Prerequisite checks ----------
echo "--- Prerequisites ---"

# US-001: Monorepo setup
if [[ -f "$PROJECT_ROOT/packages/aws-mock/package.json" ]] && \
   grep -q '"workspaces"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
  pass_story "US-001" "Monorepo setup complete"
else
  fail_story "US-001" "Monorepo setup complete"
fi

# US-002: Terraform CLI installed
if command -v terraform &>/dev/null; then
  pass_story "US-002" "Terraform CLI installed"
else
  fail_story "US-002" "Terraform CLI installed"
fi

# US-003: AWS provider schema dumped
run_story_test "US-003" "AWS provider schema dumped" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/schema.test.ts"

echo ""
echo "--- Unit Tests ---"

# US-004: Schema parser utility
run_story_test "US-004" "Schema parser utility" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/schema-parser.test.ts"

# US-005: Resource interface defined
run_story_test "US-005" "Resource interface defined" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/resource-handler.test.ts"

# US-006: State store implementation
run_story_test "US-006" "State store implementation" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/state-store.test.ts"

# US-007: Computed value generators
run_story_test "US-007" "Computed value generators" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/computed.test.ts"

# US-008: aws_s3_bucket resource handler
run_story_test "US-008" "aws_s3_bucket resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/s3-bucket.test.ts"

# US-009: aws_s3_bucket_policy resource handler
run_story_test "US-009" "aws_s3_bucket_policy resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/s3-bucket-policy.test.ts"

# US-010: Mock backend server
run_story_test "US-010" "Mock backend server" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/server.test.ts"

echo ""
echo "--- Go Provider ---"

# US-011: Terraform provider skeleton
if (cd "$PROJECT_ROOT/packages/terraform-provider-aws-mock" && go build -o terraform-provider-aws-mock) > /dev/null 2>&1; then
  pass_story "US-011" "Terraform provider skeleton"
else
  fail_story "US-011" "Terraform provider skeleton"
fi

# US-012 & US-013: Provider schema + CRUD wiring (Go tests cover both)
if (cd "$PROJECT_ROOT/packages/terraform-provider-aws-mock" && go test ./...) > /dev/null 2>&1; then
  pass_story "US-012" "Provider schema registration"
  pass_story "US-013" "Provider CRUD wired to mock backend"
else
  fail_story "US-012" "Provider schema registration"
  fail_story "US-013" "Provider CRUD wired to mock backend"
fi

echo ""
echo "--- Integration Tests ---"

# US-014: terraform init
run_story_test "US-014" "Integration: terraform init" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-init.test.ts"

# US-015: terraform plan
run_story_test "US-015" "Integration: terraform plan" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-plan.test.ts"

# US-016: terraform apply
run_story_test "US-016" "Integration: terraform apply" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-apply.test.ts"

# US-017: no drift on second plan
run_story_test "US-017" "Integration: no drift on second plan" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-no-drift.test.ts"

# US-018: terraform destroy
run_story_test "US-018" "Integration: terraform destroy" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-destroy.test.ts"

# US-019: resource references
run_story_test "US-019" "Integration: resource references" \
  bun test "$PROJECT_ROOT/tests/integration/terraform-references.test.ts"

echo ""
echo "--- Meta ---"

# US-020: Test runner (self-check: this script exists and is executable)
if [[ -x "$SCRIPT_DIR/run-tests.sh" ]]; then
  pass_story "US-020" "Test runner for Ralph"
else
  fail_story "US-020" "Test runner for Ralph"
fi

# ---------- Update prd.json ----------
echo ""
echo "--- Updating prd.json ---"

# Build JSON object from results file
results_json="{"
first=true
while IFS='=' read -r id status; do
  if [ "$first" = true ]; then first=false; else results_json+=","; fi
  results_json+="\"$id\":\"$status\""
done < "$RESULTS_FILE"
results_json+="}"

bun -e "
const prd = JSON.parse(await Bun.file('$PRD_FILE').text());
const results = $results_json;

for (const story of prd.userStories) {
  if (results[story.id] !== undefined) {
    story.passes = results[story.id] === 'pass';
  }
}

await Bun.write('$PRD_FILE', JSON.stringify(prd, null, 2) + '\n');
console.log('prd.json updated.');
"

# ---------- Summary ----------
echo ""
echo "=== Summary ==="
pass_count=$(grep -c '=pass$' "$RESULTS_FILE" || true)
fail_count=$(grep -c '=fail$' "$RESULTS_FILE" || true)
echo -e "  ${GREEN}Passed: $pass_count${NC}"
echo -e "  ${RED}Failed: $fail_count${NC}"
echo ""

if $all_pass; then
  echo -e "${GREEN}All stories pass!${NC}"
  exit 0
else
  echo -e "${RED}Some stories failed.${NC}"
  exit 1
fi
