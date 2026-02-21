#!/bin/bash
# Ralph Wiggum - Phase 2: EC2 Stack
# Runs until all stories in prd-phase2.json have passes: true

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RALPH_MD="$SCRIPT_DIR/RALPH-phase2.md"
MAX_ITERATIONS=15

echo "Starting Ralph loop - Phase 2: EC2 Stack..."
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS (Phase 2)"
  echo "==============================================================="
  
  # Run Claude Code with RALPH-phase2.md instructions
  OUTPUT=$(claude --dangerously-skip-permissions --print < "$RALPH_MD" 2>&1 | tee /dev/stderr) || true
  
  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "==============================================================="
    echo "  Ralph completed all Phase 2 tasks!"
    echo "==============================================================="
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi
  
  echo ""
  echo "Iteration $i complete. Continuing in 2 seconds..."
  sleep 2
done

echo ""
echo "==============================================================="
echo "  Ralph reached max iterations ($MAX_ITERATIONS)"
echo "==============================================================="
echo "Check prd-phase2.json and progress.txt for current state."
exit 1
