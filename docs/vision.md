# Terraform Town — Vision

## What

An interactive game that teaches people how to use Terraform, guided by an LLM agent.

## Core Idea

Users learn Terraform by writing real HCL configs against a **mock provider** — no cloud account needed, no cost, no risk. An LLM agent acts as a guide and tutor throughout.

## Mock Provider

A stub Terraform provider that mimics AWS (and potentially other clouds) without making real API calls.

- Accepts the same resource schemas as the real provider (e.g. `aws_s3_bucket`, `aws_lambda_function`)
- Returns synthetic computed values (ARNs, IDs, endpoints, etc.)
- Runs fully offline — no credentials, no network
- Resource schemas are **auto-generated** from the real AWS provider's schema dump (`terraform providers schema -json`) rather than hand-written — keeps schemas accurate and avoids maintaining thousands of resource definitions manually
- Serves a dual purpose:
  1. **For the learner** — safe sandbox to practice `plan` and `apply` without consequences
  2. **For the LLM agent** — a validation layer; the agent can run plans against the mock provider to verify the user's configs are correct, give feedback, and determine progress

## Architecture

The AI assistant is built on [LLM Gateway](https://github.com/hv/llm-gateway) — the harness/event/graph agent framework. This gives us streaming, subagent spawning, tool use, and the client-side rendering infrastructure out of the box.

## Gameplay

Campaign-style progression, like RTS tutorial missions (Factorio, Warcraft 3). Each mission teaches one concept by having the user do it.

**Flow:**
1. The agent presents a mission with a clear objective (e.g. "Create an S3 bucket called `my-first-bucket`")
2. The user writes HCL in the editor to accomplish it
3. The user runs plan/apply — the visualization updates to show what they built
4. The agent validates the result against the mission objective using the mock provider output
5. If correct → mission complete, next mission unlocked
6. If stuck → the agent teaches, gives hints, explains concepts — never just gives the answer

**Mission design principles:**
- Start absurdly simple — "create a single resource" is mission 1
- Each mission introduces exactly one new concept
- Difficulty ramps gradually — early missions are hand-held, later ones are open-ended
- The agent adapts — if the user is breezing through, less hand-holding; if struggling, more guidance

**Curriculum — each mission introduces one Terraform primitive:**

| # | Concept | Mission | AWS Example |
|---|---------|---------|-------------|
| 1 | Provider | Configure a provider so Terraform knows where to build | `provider "aws" { region = "us-east-1" }` |
| 2 | Resource | Create your first piece of infrastructure | `aws_s3_bucket` |
| 3 | Arguments | Configure a resource with specific settings | Set `tags`, `versioning` on the bucket |
| 4 | Attributes | Read a computed value that AWS gives back | Reference `aws_s3_bucket.b.arn` |
| 5 | References | Make one resource depend on another | `aws_s3_bucket_policy` referencing the bucket's `id` |
| 6 | Variables | Replace a hardcoded value with an input variable | `variable "bucket_name" {}` → `var.bucket_name` |
| 7 | Outputs | Expose a value from your config | `output "bucket_arn" { value = ... }` |
| 8 | Locals | Compute an intermediate value | `locals { name_prefix = "prod-${var.project}" }` |
| 9 | Data Sources | Read existing infrastructure you didn't create | `data "aws_caller_identity" "current" {}` |
| 10 | count / for_each | Create multiple of the same resource | `count = 3` on `aws_s3_bucket` |
| 11 | Modules | Group resources into a reusable unit | Extract bucket + policy into a module |
| 12 | Lifecycle | Control how resources are created/destroyed | `create_before_destroy`, `prevent_destroy` |
| 13 | State | Understand what `terraform.tfstate` tracks and why | Inspect state after apply, see drift |

## LLM Agent Role

- Presents missions and explains objectives
- Validates user work by running `terraform plan`/`apply` against the mock provider
- Provides feedback based on plan output — what was created, what's wrong, what's missing
- Teaches concepts when the user is stuck — hints first, explanations second, never just the answer
- Adapts guidance level to the user's skill

## User Interface

Three-panel layout:

1. **Code Editor** — in-browser editor where users write HCL files. Supports creating, editing, and organizing multiple files (e.g. `main.tf`, `variables.tf`). This is where the actual learning happens.

2. **Infrastructure Visualization** — visual representation of the plan output. Shows the services/resources the user has defined and their relationships. Updates when the user runs a plan. Makes the abstract (HCL text) concrete (visual diagram).

3. **Chat** — conversation with the LLM assistant. The agent explains concepts, assigns challenges, answers questions, and gives feedback on the user's work. Can reference both the code and the visualization.

## Open Questions

- Which AWS resources to support first?
- How to handle state — persist between sessions or reset per challenge?
- How are missions defined — hardcoded, LLM-generated, or both?
- Can users go off-script / free-build between missions?
- How to surface plan output to the LLM in a useful format?
