#!/bin/bash
# Ralph Wiggum - Visualization Component
# Runs until all stories in prd-visualization.json have passes: true

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RALPH_MD="$SCRIPT_DIR/RALPH-visualization.md"
MAX_ITERATIONS=25

echo "Starting Ralph loop - Visualization Component..."
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS (Visualization)"
  echo "==============================================================="
  
  # Run Claude Code with RALPH-visualization.md instructions
  OUTPUT=$(claude --dangerously-skip-permissions --print < "$RALPH_MD" 2>&1 | tee /dev/stderr) || true
  
  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "==============================================================="
    echo "  Ralph completed all Visualization tasks!"
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
echo "Check prd-visualization.json and progress.txt for current state."
exit 1
