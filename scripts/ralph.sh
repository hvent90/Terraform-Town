#!/bin/bash
# Ralph Wiggum - Autonomous AI agent loop for terraform-town
# Runs until all stories in prd.json have passes: true

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RALPH_MD="$SCRIPT_DIR/RALPH.md"
MAX_ITERATIONS=20

echo "Starting Ralph loop..."
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="
  
  # Run Claude Code with RALPH.md instructions
  OUTPUT=$(claude --dangerously-skip-permissions --print < "$RALPH_MD" 2>&1 | tee /dev/stderr) || true
  
  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "==============================================================="
    echo "  Ralph completed all tasks!"
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
echo "Check prd.json and progress.txt for current state."
exit 1
