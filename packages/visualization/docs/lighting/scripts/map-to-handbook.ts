/**
 * Map lighting-implementation-guide-2.md content onto the Scene Implementation
 * Handbook structure defined in docs/plans/2026-02-21-scene-implementation-handbook-design.md.
 *
 * Reads the raw technique extractions, reorganizes and synthesizes them into
 * the 14-section handbook format with aesthetic direction + Three.js code per section.
 *
 * Usage: bun scripts/map-to-handbook.ts
 */
import { createRlmHarness } from "/Users/hv/repos/llm-gateway/packages/ai/rlm/harness";
import { createGeneratorHarness } from "/Users/hv/repos/llm-gateway/packages/ai/harness/providers/zen";

const API_KEY = process.env.ZEN_API_KEY ?? "sk-CfrBGgx9H9ocmBdQ8OUAAEArbpQQ93jKnOfWqE4E0IKVhfSlC7FqW21AS1Truj9Y";
const DOCS_DIR = "/Users/hv/repos/terraform-town/packages/visualization/docs/lighting";
const INPUT_FILE = `${DOCS_DIR}/lighting-implementation-guide-2.md`;
const DESIGN_FILE = "/Users/hv/repos/terraform-town/docs/plans/2026-02-21-scene-implementation-handbook-design.md";
const VIZ_REQUIREMENTS_FILE = "/Users/hv/repos/terraform-town/docs/visualization-requirements.md";
const VISION_FILE = "/Users/hv/repos/terraform-town/docs/vision.md";
const THEME_FILE = "/Users/hv/repos/terraform-town/packages/visualization/src/themes/default.ts";
const OUTPUT_FILE = `${DOCS_DIR}/scene-implementation-handbook.md`;

// Read input files
const guideContent = await Bun.file(INPUT_FILE).text();
const designDoc = await Bun.file(DESIGN_FILE).text();
const vizRequirements = await Bun.file(VIZ_REQUIREMENTS_FILE).text();
const visionDoc = await Bun.file(VISION_FILE).text();
const themeFile = await Bun.file(THEME_FILE).text();

const guideLines = guideContent.split("\n").length;
console.log(`Input guide: ${INPUT_FILE} (${guideLines} lines, ${guideContent.length} chars)`);
console.log(`Design doc: ${DESIGN_FILE}`);
console.log(`Viz requirements: ${VIZ_REQUIREMENTS_FILE}`);
console.log(`Vision doc: ${VISION_FILE}`);
console.log(`Theme file: ${THEME_FILE}`);
console.log(`Output: ${OUTPUT_FILE}`);
console.log();

const provider = createGeneratorHarness({
  apiKey: API_KEY,
  model: "glm-5-free",
});

const rlm = createRlmHarness({
  rootHarness: provider,
  config: {
    maxIterations: 120,
    maxStdoutLength: 16000,
    metadataPrefixLength: 1000,
    execTimeout: 20000,
    maxDepth: 5,
  },
});

// Split guide into chunks of ~1500 lines for processing
const CHUNK_SIZE = 1500;
const guideLineArray = guideContent.split("\n");
const chunks: string[] = [];
for (let i = 0; i < guideLineArray.length; i += CHUNK_SIZE) {
  chunks.push(guideLineArray.slice(i, i + CHUNK_SIZE).join("\n"));
}
console.log(`Split guide into ${chunks.length} chunks of ~${CHUNK_SIZE} lines each.\n`);

const task = `You have several files to work with. Your job is to produce a complete Scene Implementation Handbook
for Terraform Town by mapping existing technique extractions onto a new document structure.

## INPUT FILES (read them using exec())

1. \`/tmp/design-doc.txt\` — The approved handbook structure (14 sections). This is YOUR TABLE OF CONTENTS.
2. \`/tmp/viz-requirements.txt\` — Existing visualization requirements (primitives, themes, interactions, API contracts, performance specs). Absorb relevant content.
3. \`/tmp/vision.txt\` — Game vision doc (context for aesthetic direction).
4. \`/tmp/theme.txt\` — Current Theme TypeScript implementation (default.ts). Use real values from here.
5. \`/tmp/chunk-0.txt\` through \`/tmp/chunk-${chunks.length - 1}.txt\` — The raw lighting technique extractions (~9800 lines total, split into ${chunks.length} chunks).

## YOUR GOAL

Produce a COMPLETE, publication-ready **Scene Implementation Handbook** that:

1. Follows the EXACT section structure from the design doc (sections 1-14 + appendices A-C)
2. For each section:
   - Opens with the **Aesthetic Direction** subsection (descriptive, evocative — what it should LOOK and FEEL like)
   - Follows with **implementation subsections** containing actual Three.js code with real property values
3. Maps techniques from the lighting guide chunks into the correct handbook sections
4. Pulls in primitives catalog, theme values, API contracts, interaction model, and performance specs from viz-requirements.txt
5. Deduplicates — the raw guide has many repeated techniques across batches; consolidate into single authoritative entries
6. Uses REAL values from theme.txt (the actual colors, intensities, distances in the codebase)

## IMPORTANT CONTEXT

- **Rendering framework**: Raw Three.js (imperative) with a thin React wrapper. NO React Three Fiber. All code examples should be imperative Three.js.
- **No fog**: Fog was removed from the design — it doesn't work with orthographic camera + selective bloom. Do NOT include fog sections.
- **GPU particles**: Section 7 covers GPU-accelerated particle effects. The raw guide has instanced mesh patterns and particle recycling techniques — map those here.
- **Aesthetic pillars**: TRON Legacy (visual language) × Factorio (spatial language). The guide should read like an art director + lead engineer wrote it together.

## EXECUTION PLAN

1. Read ALL input files using exec(). The chunks are large — read them one at a time.
2. For each chunk, use llm_query(prompt, context) to extract and categorize techniques by handbook section number (1-14).
   The extraction prompt should be:
   \`\`\`
   You have raw Three.js lighting technique extractions in \`context\`.

   Categorize every technique into the correct handbook section (1-14):
   1. Aesthetic Identity
   2. Scene Foundation (renderer, camera, ground, ambient light)
   3. Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)
   4. Internal Lighting (PointLight, many lights, RectAreaLight)
   5. Shadows (shadow maps, contact shadows, selective casting)
   6. Post-Processing & Bloom (UnrealBloomPass, selective bloom, EffectComposer)
   7. GPU Particle Effects (instanced particles, recycling, GPU animation)
   8. Resource Primitives Catalog (shapes, resource mappings, containment)
   9. PCB Trace Connections (glowing lines, animated flow)
   10. State Visualization & Animation (create/destroy/modify animations, state-driven materials)
   11. Interaction Model (mouse/touch/keyboard, tooltip, selection)
   12. Performance Guide (light budget, instancing, LOD, shadow budget)
   13. Data Contracts & Integration (state format, API, sync)
   14. Putting It All Together (complete setup, pipeline, parameter table)

   For each technique, output:
   - Section number it belongs to
   - The technique name
   - The code snippet (if any)
   - Key parameters/values
   - Gotchas/tips

   Deduplicate — if the same technique appears multiple times, keep the most complete version.
   Skip techniques about fog/atmosphere (removed from design).
   Skip React Three Fiber / R3F patterns — we use raw Three.js.

   Output as structured markdown grouped by section number.
   Call FINAL() with the categorized output.
   \`\`\`

3. Also read viz-requirements.txt and extract content for sections 8, 10, 11, 12, 13 using llm_query().
   The prompt should be:
   \`\`\`
   Extract content from the visualization requirements doc in \`context\` that maps to these handbook sections:
   - Section 8: Resource Primitives Catalog (base shapes, resource mappings, material configs, containment)
   - Section 10: State Visualization & Animation (animation types, timing, easing, state colors)
   - Section 11: Interaction Model (mouse, touch, keyboard, tooltip, detail panel)
   - Section 12: Performance Guide (instancing, LOD, culling, targets)
   - Section 13: Data Contracts & Integration (TerraformState interfaces, Visualization API, state sync)

   Also extract the Theme interface definition for Appendix C.

   Output the extracted content grouped by section number, preserving code blocks and tables.
   Call FINAL() with the extraction.
   \`\`\`

4. Collect ALL categorized results from steps 2-3. Then use ONE final llm_query(prompt, context) to synthesize
   the complete handbook. Pass the synthesis instructions as \`prompt\` and ALL categorized content as \`context\`.

   The synthesis prompt should be:
   \`\`\`
   Synthesize ALL the categorized techniques and requirements in \`context\` into the complete
   Scene Implementation Handbook for Terraform Town.

   STRUCTURE: Follow this exact section layout:

   # Terraform Town — Scene Implementation Handbook

   ## 1. Aesthetic Identity
   ### 1.1 The Two Pillars: TRON × Factorio
   ### 1.2 Mood & Atmosphere
   ### 1.3 Color Philosophy
   ### 1.4 Spatial Language

   ## 2. Scene Foundation
   ### 2.1 Aesthetic Direction
   ### 2.2 Renderer Setup
   ### 2.3 Orthographic Camera Configuration
   ### 2.4 Ground Plane
   ### 2.5 Scene-Level Ambient Light

   ## 3. Frosted Glass Materials
   ### 3.1 Aesthetic Direction
   ### 3.2 MeshPhysicalMaterial Transmission Config
   ### 3.3 Emissive as Complement
   ### 3.4 TSL / WebGPU Future Path

   ## 4. Internal Lighting System
   ### 4.1 Aesthetic Direction
   ### 4.2 PointLight Per Primitive
   ### 4.3 Managing Many Point Lights
   ### 4.4 RectAreaLight for Flat Panels
   ### 4.5 Light Color Semantics

   ## 5. Shadows
   ### 5.1 Aesthetic Direction
   ### 5.2 Shadow Map Configuration
   ### 5.3 Selective Shadow Casting
   ### 5.4 Contact Shadows Alternative

   ## 6. Post-Processing & Bloom
   ### 6.1 Aesthetic Direction
   ### 6.2 Selective Bloom via Layers
   ### 6.3 Bloom Tuning
   ### 6.4 EffectComposer Pipeline

   ## 7. GPU Particle Effects
   ### 7.1 Aesthetic Direction
   ### 7.2 GPU-Accelerated Particle System
   ### 7.3 Particle Archetypes
   ### 7.4 Performance Considerations
   ### 7.5 Particle + Bloom Integration

   ## 8. Resource Primitives Catalog
   ### 8.1 Aesthetic Direction
   ### 8.2 Base Shapes & Geometry
   ### 8.3 Resource Type Mappings
   ### 8.4 Material + Light Configuration Per Type
   ### 8.5 Containment & Hierarchy

   ## 9. PCB Trace Connections
   ### 9.1 Aesthetic Direction
   ### 9.2 Line Geometry
   ### 9.3 Animated Pulse / Flow
   ### 9.4 Connection Bloom Integration

   ## 10. State Visualization & Animation
   ### 10.1 Aesthetic Direction
   ### 10.2 Animation Types & Timing
   ### 10.3 State-Driven Material Changes
   ### 10.4 Animation Queue & Orchestration

   ## 11. Interaction Model
   ### 11.1 Mouse / Touch / Keyboard
   ### 11.2 Tooltip & Detail Panel
   ### 11.3 Selection Visuals

   ## 12. Performance Guide
   ### 12.1 Light Budget
   ### 12.2 Instanced Rendering
   ### 12.3 Level of Detail
   ### 12.4 Shadow Budget
   ### 12.5 Performance Targets
   ### 12.6 WebGPU vs WebGL

   ## 13. Data Contracts & Integration
   ### 13.1 Input State Format
   ### 13.2 Visualization API
   ### 13.3 State Sync

   ## 14. Putting It All Together
   ### 14.1 Complete Minimal Scene Setup
   ### 14.2 Step-by-Step Rendering Pipeline
   ### 14.3 Recommended Starting Values

   ## Appendix A: Technology Stack
   ## Appendix B: Source Reference Table
   ## Appendix C: Theme Interface

   RULES:
   - Every "Aesthetic Direction" subsection should be DESCRIPTIVE and EVOCATIVE — paint a picture of what the implementer should be creating. Write like an art director briefing a technical artist.
   - Every implementation subsection should have REAL Three.js CODE with actual property values.
   - Use the real theme values from the codebase: background '#0a0a0a', ambient '#111122' intensity 0.08, hemisphere sky '#0a0a2a' ground '#000000' intensity 0.05, bloom strength 0.4 radius 0.3 threshold 0.6.
   - Resource colors from theme: vpc=#00FFFF, subnet=#0066FF, security_group=#FF8C00, instance=#39FF14, s3_bucket=#B026FF, iam_role=#FFD700, lambda_function=#FF00FF.
   - NO React Three Fiber. All code is imperative Three.js.
   - NO fog sections. Fog was removed.
   - Section 1 (Aesthetic Identity) has NO code — pure vision and art direction.
   - Section 14 should include a COMPLETE working minimal scene setup.
   - Appendix A tech stack: Three.js, WebGL 2.0, GSAP, d3-force, React (thin wrapper), zustand, Vite, Vitest+Playwright.
   - Do NOT truncate. Output the COMPLETE handbook.

   Call FINAL() with the complete handbook as a markdown string.
   \`\`\`

5. FINAL() the complete handbook. The outer script writes it to disk.

## CRITICAL RULES

- Read files using exec(\`cat <filepath>\`). Files may be large.
- Always use llm_query(prompt, context) — short instructions as \`prompt\`, data as \`context\`.
- Process chunks sequentially (one at a time) to avoid overwhelming context.
- The extraction subagents categorize. The synthesis subagent writes the final document.
- Do NOT write files — call FINAL() with the handbook content.
- Do NOT truncate or summarize the final handbook — FINAL() the complete output.
- Do NOT include fog/atmosphere content.
- Do NOT use React Three Fiber patterns — raw Three.js only.`;

// Write input files to /tmp for the RLM agent to read
await Bun.write("/tmp/design-doc.txt", designDoc);
await Bun.write("/tmp/viz-requirements.txt", vizRequirements);
await Bun.write("/tmp/vision.txt", visionDoc);
await Bun.write("/tmp/theme.txt", themeFile);
for (let i = 0; i < chunks.length; i++) {
  await Bun.write(`/tmp/chunk-${i}.txt`, chunks[i]);
}
console.log(`Wrote ${chunks.length + 4} input files to /tmp/`);
console.log("Starting RLM handbook synthesis...\n");

let handbookContent = "";

for await (const event of rlm.invoke({
  context: [
    `/tmp/design-doc.txt`,
    `/tmp/viz-requirements.txt`,
    `/tmp/vision.txt`,
    `/tmp/theme.txt`,
    ...chunks.map((_, i) => `/tmp/chunk-${i}.txt`),
  ].join("\n"),
  messages: [{ role: "user", content: task }],
})) {
  switch (event.type) {
    case "tool_call":
      if ("input" in event && typeof event.input === "object" && event.input !== null) {
        const input = event.input as Record<string, unknown>;
        if (input.code) {
          console.log("\n--- REPL Code ---");
          console.log(String(input.code).slice(0, 800));
          if (String(input.code).length > 800) console.log("... (truncated)");
        }
      }
      break;
    case "tool_result":
      if ("output" in event && typeof event.output === "object" && event.output !== null) {
        const output = event.output as Record<string, unknown>;
        if (output.stdout) {
          console.log("\n--- REPL Output ---");
          console.log(String(output.stdout).slice(0, 3000));
          if (String(output.stdout).length > 3000) console.log("... (truncated)");
        }
        if (output.error) {
          console.log("\n--- REPL Error ---");
          console.log(String(output.error));
        }
      }
      break;
    case "text":
      if ("content" in event) {
        handbookContent += String(event.content);
        console.log("\n--- Final Answer (preview) ---");
        console.log(String(event.content).slice(0, 500) + "...");
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

// Write the handbook to disk
if (handbookContent.length > 0) {
  await Bun.write(OUTPUT_FILE, handbookContent);
  console.log(`\nHandbook written to: ${OUTPUT_FILE}`);
  console.log(`File size: ${handbookContent.length} characters`);
} else {
  console.error("\nWARNING: RLM produced no output — no file written.");
}
