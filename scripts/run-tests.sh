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

# ========== Phase 2: EC2 Stack ==========
PRD2_FILE="$PROJECT_ROOT/prd-phase2.json"

echo ""
echo "=== Phase 2: EC2 Stack ==="
echo ""

echo "--- EC2 Resource Handlers ---"

# US-021: aws_vpc resource handler
run_story_test "US-021" "aws_vpc resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/vpc.test.ts"

# US-022: aws_subnet resource handler
run_story_test "US-022" "aws_subnet resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/subnet.test.ts"

# US-023: aws_security_group resource handler
run_story_test "US-023" "aws_security_group resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/security-group.test.ts"

# US-024: aws_instance resource handler
run_story_test "US-024" "aws_instance resource handler" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/instance.test.ts"

echo ""
echo "--- EC2 Go Provider ---"

# US-025 & US-026: Go provider schema + CRUD wiring (Go tests cover both)
if (cd "$PROJECT_ROOT/packages/terraform-provider-aws-mock" && go test ./...) > /dev/null 2>&1; then
  pass_story "US-025" "Go provider: Register EC2 stack schemas"
  pass_story "US-026" "Go provider: Wire EC2 stack CRUD to backend"
else
  fail_story "US-025" "Go provider: Register EC2 stack schemas"
  fail_story "US-026" "Go provider: Wire EC2 stack CRUD to backend"
fi

echo ""
echo "--- Semantic Validation ---"

# US-027: Bucket naming validation
run_story_test "US-027" "Bucket naming validation" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/bucket-name-validation.test.ts"

# US-028: IAM policy JSON validation
run_story_test "US-028" "IAM policy JSON validation" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/policy-json-validation.test.ts"

# US-029: Region validation
run_story_test "US-029" "Region validation" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/region-validation.test.ts"

# US-030: Reference existence check
run_story_test "US-030" "Reference existence check" \
  bun test "$PROJECT_ROOT/packages/aws-mock/tests/reference-validation.test.ts"

echo ""
echo "--- EC2 Integration ---"

# US-031: Integration: Full EC2 stack flow
run_story_test "US-031" "Integration: Full EC2 stack flow" \
  bun test "$PROJECT_ROOT/tests/integration/ec2-stack-flow.test.ts"

echo ""
echo "--- Generated Tests ---"

# Generated test suites (part of US-021 through US-024 validation)
run_story_test "GEN-VPC" "Generated: aws_vpc" \
  bun test "$PROJECT_ROOT/tests/generated/aws_vpc/aws_vpc.test.ts"

run_story_test "GEN-SUBNET" "Generated: aws_subnet" \
  bun test "$PROJECT_ROOT/tests/generated/aws_subnet/aws_subnet.test.ts"

run_story_test "GEN-SG" "Generated: aws_security_group" \
  bun test "$PROJECT_ROOT/tests/generated/aws_security_group/aws_security_group.test.ts"

run_story_test "GEN-INSTANCE" "Generated: aws_instance" \
  bun test "$PROJECT_ROOT/tests/generated/aws_instance/aws_instance.test.ts"

echo ""
echo "--- Phase 2 Meta ---"

# US-032: Test runner for Phase 2 (self-check: this script covers Phase 2 stories)
if grep -q 'US-031' "$SCRIPT_DIR/run-tests.sh" && \
   grep -q 'prd-phase2.json' "$SCRIPT_DIR/run-tests.sh"; then
  pass_story "US-032" "Update test runner for Phase 2"
else
  fail_story "US-032" "Update test runner for Phase 2"
fi

# ---------- Update prd.json ----------
echo ""
echo "--- Updating PRD files ---"

# Build JSON object from results file
results_json="{"
first=true
while IFS='=' read -r id status; do
  if [ "$first" = true ]; then first=false; else results_json+=","; fi
  results_json+="\"$id\":\"$status\""
done < "$RESULTS_FILE"
results_json+="}"

# Update prd.json (Phase 1)
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

# Update prd-phase2.json (Phase 2)
bun -e "
const prd = JSON.parse(await Bun.file('$PRD2_FILE').text());
const results = $results_json;

for (const story of prd.userStories) {
  if (results[story.id] !== undefined) {
    story.passes = results[story.id] === 'pass';
  }
}

await Bun.write('$PRD2_FILE', JSON.stringify(prd, null, 2) + '\n');
console.log('prd-phase2.json updated.');
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
