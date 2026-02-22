/**
 * Synthesize all lighting doc findings into an implementation guide
 * for Terraform Town's visual aesthetic: dark, moody, minimal TRON-like
 * scene with frosted glass primitives and emanating internal lights.
 *
 * Usage: bun scripts/synthesize-lighting-guide.ts
 */
import { createRlmHarness } from "/Users/hv/repos/llm-gateway/packages/ai/rlm/harness";
import { createGeneratorHarness } from "/Users/hv/repos/llm-gateway/packages/ai/harness/providers/zen";

const API_KEY = process.env.ZEN_API_KEY ?? "sk-CfrBGgx9H9ocmBdQ8OUAAEArbpQQ93jKnOfWqE4E0IKVhfSlC7FqW21AS1Truj9Y";
const DOCS_DIR = "/Users/hv/repos/terraform-town/packages/visualization/docs/lighting";
const OUTPUT_FILE = `${DOCS_DIR}/lighting-implementation-guide-2.md`;

// Collect all doc files (exclude README, all.md, test-file)
const glob = new Bun.Glob("p{1,2}-*.md");
const docFiles = [...glob.scanSync(DOCS_DIR)].sort();

console.log(`Found ${docFiles.length} doc files to analyze.`);
for (const f of docFiles) console.log(`  - ${f}`);
console.log();

const fileList = docFiles.map((f) => `${DOCS_DIR}/${f}`).join("\n");

const provider = createGeneratorHarness({
  apiKey: API_KEY,
  model: "glm-5-free",
});

const rlm = createRlmHarness({
  rootHarness: provider,
  config: {
    maxIterations: 80,
    maxStdoutLength: 12000,
    metadataPrefixLength: 800,
    execTimeout: 1500,
    maxDepth: 4,
  },
});

const task = `You have a list of file paths in \`context\`. Each file is a Three.js lighting tutorial/resource
with extracted code snippets, techniques, and learnings.

Your goal: read ALL of these files, extract every technique relevant to the aesthetic described below,
and synthesize them into a single comprehensive implementation guide.

## THE AESTHETIC

**Terraform Town** is a "Terraform meets Factorio" visualization. The scene is:

- **Camera**: Orthographic/isometric top-down view looking over a dark plane
- **Ground plane**: Very dark, almost black, subtly visible only where light hits it
- **Mesh primitives**: Small frosted glass objects (cubes, cylinders, spheres) representing cloud infrastructure resources
- **Lighting concept**: Each primitive has a LIGHT INSIDE that emanates outward through the frosted glass, illuminating the surrounding floor
- **Overall mood**: Dark, moody, minimal, ambient — think TRON Legacy meets a circuit board
- **Color palette**: Muted neon accents (cyan, amber, violet) against deep darkness
- **Effects needed**: Selective bloom/glow on primitives, soft shadows on the ground plane, subtle fog/atmosphere

The primitives are small and scattered across the plane like components on a motherboard.
Lines/edges connect them (like PCB traces), also subtly glowing.

## YOUR TASK

1. Read ALL the doc files listed in \`context\` using exec(). Process them in batches of 5.
   For each batch, use a SINGLE llm_query(prompt, context) call — pass the extraction instructions as \`prompt\`
   and the concatenated file contents as \`context\`.

   The subagent prompt should be:
   \`\`\`
   Extract every technique from the Three.js lighting tutorial docs in \`context\`.

   Extract EVERY technique, code pattern, and implementation detail that is relevant to building this scene:
   - Dark scene with orthographic camera
   - Frosted glass / translucent mesh primitives with internal point lights
   - Light emanating outward through glass onto a dark ground plane
   - Selective bloom/glow on specific objects
   - Soft shadows, subtle fog/atmosphere
   - TRON-like minimal neon aesthetic
   - Performance considerations for many small light sources

   For each relevant technique found, output:
   - **Source**: which doc/tutorial it came from
   - **Technique**: what it is (e.g., "Selective Unreal Bloom", "MeshPhysicalMaterial transmission")
   - **How it applies**: specifically how to use it for the aesthetic above
   - **Code snippet**: the actual Three.js code (verbatim from the doc if available)
   - **Gotchas/tips**: any performance notes, caveats, or best practices

   Be thorough — extract everything potentially relevant, even if tangentially useful.
   Skip techniques that are completely irrelevant (e.g., outdoor sun lighting, terrain generation).

   Output as structured markdown with clear headings per technique.
   Call FINAL() with your full extracted analysis.
   \`\`\`

2. Collect ALL subagent results. Then use ONE final llm_query(prompt, context) call to synthesize everything
   into the implementation guide. Pass the synthesis instructions as \`prompt\` and ALL the extracted techniques as \`context\`.

   The synthesis subagent prompt should be:
   \`\`\`
   Synthesize the extracted Three.js lighting techniques in \`context\` into a SINGLE, comprehensive
   implementation guide for Terraform Town. The guide should be a practical reference for implementing the scene.

   Structure the guide as follows:

   # Terraform Town — Lighting & Shading Implementation Guide

   ## 1. Scene Foundation
   - Renderer setup (tone mapping, color space, output encoding)
   - Orthographic camera configuration for isometric view
   - Dark background and ground plane setup
   - Scene-level ambient light (very dim)

   ## 2. Frosted Glass Material
   - MeshPhysicalMaterial configuration for frosted glass (transmission, roughness, IOR, thickness)
   - Alternative: MeshTransmissionMaterial from drei
   - TSL approach if applicable
   - Code examples with exact property values

   ## 3. Internal Lighting
   - PointLight inside each primitive (color, intensity, distance, decay)
   - Managing many point lights (performance limits, instancing alternatives)
   - Emissive materials as a complement/alternative to real lights
   - RectAreaLight for flat-panel glow effects

   ## 4. Shadows
   - Shadow setup for internal point lights
   - Shadow map configuration (type, size, bias)
   - Contact shadows as a lightweight alternative
   - Performance: selective shadow casting

   ## 5. Post-Processing & Bloom
   - Selective bloom (UnrealBloomPass with layers)
   - Bloom configuration (strength, radius, threshold) for subtle neon glow
   - EffectComposer pipeline setup
   - Merging bloom with base scene (the ShaderPass approach)

   ## 6. Atmosphere & Fog
   - Subtle fog to add depth (FogExp2 vs custom shader fog)
   - Fog interaction with emissive/bloom objects
   - Volumetric light shafts (if applicable for accent lighting)

   ## 7. PCB Trace Connections
   - Glowing line geometry (BufferGeometry with LineBasicMaterial + emissive)
   - Animated pulse/flow along connections
   - Line bloom integration

   ## 8. Performance Guide
   - Max practical light count and when to fake it with emissive
   - LOD strategies for many primitives
   - Instanced rendering for repeated primitives
   - Shadow budget and optimization
   - WebGPU vs WebGL considerations

   ## 9. Putting It All Together
   - Complete minimal scene setup code
   - Step-by-step rendering pipeline
   - Recommended parameter starting values

   ## 10. Reference Table
   - Table mapping each technique to which source doc it came from

   IMPORTANT RULES:
   - Be SPECIFIC. Include actual Three.js code with real property values.
   - Include both the "do this" AND the "why" for each technique.
   - When citing parameter values, give concrete starting points (e.g., "transmission: 0.95, roughness: 0.3").
   - Include the complete EffectComposer bloom pipeline setup.
   - When multiple approaches exist, recommend the best one for THIS use case and explain why.
   - Note any Three.js version considerations (r160+, WebGPU-only features, etc.).

   Call FINAL() with the complete guide as a markdown string.
   \`\`\`

3. Call FINAL() with the complete guide as a markdown string. The outer script will write it to disk.

## EXECUTION PLAN

- There are ${docFiles.length} doc files.
- Batch them into groups of 5 for reading + extraction (${Math.ceil(docFiles.length / 5)} batches).
- Use Promise.all() within each batch of llm_query() calls for concurrency.
- Process batches sequentially (don't launch all ${docFiles.length} reads at once).
- After all extraction subagents complete, run the synthesis subagent.
- FINAL() the synthesis result — do NOT write files yourself.

## CRITICAL RULES

- Read files using exec(\`cat <filepath>\`). Each file may be large (1000+ lines).
- Always use llm_query(prompt, context) — short instructions as \`prompt\`, data as \`context\`.
- The extraction subagents do the analysis — the main agent just orchestrates.
- Concatenate files within a batch before passing as \`context\` to the subagent (one subagent per batch of 5 files).
- The synthesis subagent receives ALL extracted techniques concatenated as \`context\`.
- Do NOT write files — call FINAL() with the guide content. The outer script handles file I/O.
- Do NOT truncate or summarize the final guide — FINAL() the complete output.`;

console.log("Starting RLM synthesis of lighting implementation guide...\n");

let guideContent = "";

for await (const event of rlm.invoke({
  context: fileList,
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
        guideContent += String(event.content);
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

// Write the guide to disk using Bun.write()
if (guideContent.length > 0) {
  await Bun.write(OUTPUT_FILE, guideContent);
  console.log(`\nGuide written to: ${OUTPUT_FILE}`);
  console.log(`File size: ${guideContent.length} characters`);
} else {
  console.error("\nWARNING: RLM produced no output — no file written.");
}
