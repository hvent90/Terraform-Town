/**
 * Split packages/visualization/docs/lighting/all.md into individual files
 * using the RLM harness with subagents.
 *
 * Usage: bun scripts/split-lighting-docs.ts
 */
import { createRlmHarness } from "../packages/ai/rlm/harness";
import { createGeneratorHarness } from "../packages/ai/harness/providers/zen";

const API_KEY = "sk-CfrBGgx9H9ocmBdQ8OUAAEArbpQQ93jKnOfWqE4E0IKVhfSlC7FqW21AS1Truj9Y";
const SOURCE_FILE = "/Users/hv/repos/terraform-town/packages/visualization/docs/lighting/all.md";
const OUTPUT_DIR = "/Users/hv/repos/terraform-town/packages/visualization/docs/lighting";

const content = await Bun.file(SOURCE_FILE).text();

const provider = createGeneratorHarness({
  apiKey: API_KEY,
  model: "glm-5-free",
});

const rlm = createRlmHarness({
  rootHarness: provider,
  config: {
    maxIterations: 50,
    maxStdoutLength: 8000,
    metadataPrefixLength: 500,
    execTimeout: 300,
    maxDepth: 2,
  },
});

const task = `You have the full contents of a markdown file in the \`context\` variable.
This file contains Three.js lighting tutorials/resources in TWO different formats:

**Part 1** (first ~80 lines): 6 items with "### N. **Title**" headings, each with detailed bullet-point sub-items (Link, Overview, Key Techniques, Code Example, etc.).

**Part 2** (remainder): 24 items with "**N. Title**" headings (bold, no ###), organized under "##" category headers (e.g., "## Cutting-Edge", "## Physically Correct Rendering", "## Atmospheric Effects", "## Courses & Comprehensive References"). Each has a URL line and a short paragraph description.

There is an intro paragraph before Part 1 and a transition paragraph + "---" separator before Part 2. Discard those — only extract the numbered items.

Your job:
1. Parse and identify all 30 items from \`context\`.
2. Spawn a llm_query() subagent for EACH item. Each subagent independently handles writing its file and doing the research.
3. Collect results, then write a README.md table of contents.

Steps:
1. Parse \`context\` to find all 30 items. Use regex to match both "### N." and "**N." patterns. Extract the URL from each item. Print the count, titles, and URLs.

2. For each item, derive a kebab-case filename slug from the title (strip markdown bold markers, special chars, quotes).
   Prefix Part 1 items with "p1-" and Part 2 items with "p2-" to avoid slug collisions (some cover the same resource).

3. For each item, spawn a subagent via llm_query(). Process in batches of 5 using Promise.all().

   Each llm_query(prompt, context) call should pass the instructions as \`prompt\` and the item's VERBATIM original text and its URL as \`context\`.
   The instructions for each subagent should tell it to:
   a) Scrape the URL using exec() to run the Claude Code CLI:
      \`await exec(\\\`claude -p "Fetch the page at <URL>. Extract: (1) all specific code snippets/implementations with full context, (2) key techniques and patterns explained, (3) practical tips and gotchas mentioned, (4) any performance considerations. Format as markdown with clear headings. If the page cannot be fetched, say FETCH_FAILED." --allowedTools "WebFetch" --no-chrome --permission-mode bypassPermissions --max-budget-usd 0.10 2>/dev/null\\\`)\`
   b) Build the final file content:
      - Start with the VERBATIM original item text from \`context\` (unchanged)
      - Add a separator: "\\n\\n---\\n\\n## Deep Dive — Extracted Learnings\\n\\n"
      - Append the scraped learnings (or "Could not fetch source page" if FETCH_FAILED)
   c) Write the file to ${OUTPUT_DIR}/<slug>.md using base64 encoding:
      \`await exec(\\\`echo '\${btoa(fullContent)}' | base64 -d > /path/to/file.md\\\`)\`
   d) Call FINAL() with the slug and title so the parent can build the TOC.

   The subagent prompt should look like:
   \`\`\`
   You have an item from a Three.js lighting resource list in \\\`context\\\`.
   The URL to research is: <URL>
   The output file path is: <OUTPUT_PATH>

   Steps:
   1. Use exec() to run the Claude Code CLI to scrape the URL (command provided above).
      Collect the result.
   2. Build the final content: the VERBATIM original text from context, then a separator
      "\\n\\n---\\n\\n## Deep Dive — Extracted Learnings\\n\\n", then the scraped learnings
      (or "Could not fetch source page" if it failed).
   3. Write the file using btoa() + base64 -d via exec().
   4. Call FINAL({ slug: "<slug>", title: "<title>" }).
   \`\`\`

4. After ALL subagents complete, generate a table of contents at ${OUTPUT_DIR}/README.md with:
   - Title: "# Lighting Tutorials & Resources"
   - Two sections matching the document structure: detailed reviews (Part 1) and curated collection (Part 2).
   - A numbered list where each entry links to the individual file and shows the item title.
   For the one-line description in the TOC, use llm_query() to generate it. Spawn ALL the llm_query() calls
   concurrently via Promise.all() — do NOT await them one by one.

5. Write the README.md, then call FINAL("done").

CRITICAL RULES:
- Each item is handled by its OWN subagent via llm_query(). Do NOT run exec(claude ...) directly from this main agent.
- The subagent does the scraping, content assembly, and file writing — not the main agent.
- Batch the llm_query() subagent calls: 5 concurrent at a time (use a batching helper, NOT all 30 at once).
- The original item content must appear VERBATIM at the top of each file — never modify it.
- The scraped learnings go BELOW a separator, clearly marked as extracted content.
- Use btoa() + base64 -d for writing files to avoid shell escaping problems.
- Process ALL 30 items — do not skip any.
- If a URL fails to fetch, still write the file with the original content and a note.`;

console.log("Starting RLM to split lighting docs...\n");

for await (const event of rlm.invoke({
  context: content,
  messages: [{ role: "user", content: task }],
})) {
  switch (event.type) {
    case "tool_call":
      if ("input" in event && typeof event.input === "object" && event.input !== null) {
        const input = event.input as Record<string, unknown>;
        if (input.code) {
          console.log("\n--- REPL Code ---");
          console.log(String(input.code).slice(0, 500));
          if (String(input.code).length > 500) console.log("... (truncated)");
        }
      }
      break;
    case "tool_result":
      if ("output" in event && typeof event.output === "object" && event.output !== null) {
        const output = event.output as Record<string, unknown>;
        if (output.stdout) {
          console.log("\n--- REPL Output ---");
          console.log(String(output.stdout).slice(0, 2000));
        }
        if (output.error) {
          console.log("\n--- REPL Error ---");
          console.log(String(output.error));
        }
      }
      break;
    case "text":
      if ("content" in event) {
        console.log("\n--- Final Answer ---");
        console.log(String(event.content));
      }
      break;
    case "tool_progress":
      if ("content" in event && typeof event.content === "object" && event.content !== null) {
        const c = event.content as Record<string, unknown>;
        if (c.channel === "stdout" && c.data) {
          process.stdout.write(String(c.data));
        }
        if (c.channel === "stderr" && c.data) {
          process.stderr.write(String(c.data));
        }
      }
      break;
    case "error":
      console.error("\n--- Error ---");
      console.error("error" in event ? String(event.error) : event);
      break;
    case "harness_end":
      console.log("\nRLM session complete.");
      break;
  }
}

// Verify results
const files = new Bun.Glob("*.md").scanSync(OUTPUT_DIR);
const fileList = [...files];
console.log(`\nFiles in output directory: ${fileList.length}`);
for (const f of fileList.sort()) {
  console.log(`  - ${f}`);
}
