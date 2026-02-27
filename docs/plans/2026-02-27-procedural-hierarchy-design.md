# Procedural Hierarchy Layout Design

## Problem

The hierarchy layout places all resources in a single horizontal line when
importing real-world tfstate files. With 716 resources across ~90 types, only
~12 have `vpc_id`/`subnet_id` attributes — the two hand-coded parent detection
keys. The remaining ~700 become root nodes placed in a single row at z=0.

## Solution

Two changes:

### 1. Procedural parent detection in `StateSync.findParent`

Replace the hand-coded `PARENT_ATTRS` map with a procedural algorithm:

1. Scan ALL string attribute values of each resource
2. For each value matching a known resource ID (via `idToAddress` lookup),
   resolve to the target resource's type
3. Score each candidate parent by **shared type prefix segments**
   (underscore-delimited): `sharedSegments("aws_s3_bucket_policy",
   "aws_s3_bucket") = 3`
4. Pick the candidate with the highest score (minimum 2 segments required)
5. Tiebreak: longer type string wins (more specific parent preferred)

Examples from production state:

| Child type | Parent type | Shared prefix | Segments |
|---|---|---|---|
| `aws_route53_record` | `aws_route53_zone` | `aws_route53` | 2 |
| `aws_lambda_alias` | `aws_lambda_function` | `aws_lambda` | 2 |
| `aws_s3_bucket_policy` | `aws_s3_bucket` | `aws_s3_bucket` | 3 |
| `aws_security_group_rule` | `aws_security_group` | `aws_security_group` | 3 |
| `aws_iam_role_policy_attachment` | `aws_iam_role` (3) over `aws_iam_policy` (2) | `aws_iam_role` | 3 |
| `aws_ecs_service` | `aws_ecs_cluster` | `aws_ecs` | 2 |
| `aws_apigatewayv2_route` | `aws_apigatewayv2_api` | `aws_apigatewayv2` | 2 |
| `aws_cloudwatch_metric_alarm` | `aws_sns_topic` → 1 segment | no parent | — |

Benefits:
- No hand-coded mappings — works for any provider
- Self-correcting as new resource types appear
- ~330+ of 716 resources gain a parent procedurally

### 2. Grid of service groups for orphans in `hierarchyLayout`

After building the parent-child tree:
- Resources with a parent nest using existing tree layout (recursive placeTree)
- Root nodes (no parent) get grouped by `resource.type` (service name)
- Service groups are arranged in a 2D grid (similar to `typeClusterLayout`)
- Within each group, root trees are laid out in a sub-grid with children
  expanding below

### What stays the same

- `ClusterLabels` — groups by `resource.type`, works automatically
- `parseHcl` — only used for HCL text input, not tfstate
- Other layout modes — untouched

## Files to change

1. `packages/visualization/src/state/StateSync.ts` — rewrite `findParent`
2. `packages/visualization/src/layout/hierarchyLayout.ts` — add service group grid for orphans
3. `packages/visualization/src/layout/hierarchyLayout.test.ts` — update tests

## Expected result

- ~330+ resources gain a parent procedurally
- ~386 orphans group into ~30 service clusters in a 2D grid
- Each cluster contains its trees (e.g., route53_zone with 68 records below)
