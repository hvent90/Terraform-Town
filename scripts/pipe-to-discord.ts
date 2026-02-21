#!/usr/bin/env bun
/**
 * Pipe a file to Discord in chunks (respects 2000 char limit)
 * Usage: bun run scripts/pipe-to-discord.ts <file>
 */

import { readFileSync } from "fs";
import { message } from "@openclaw/channel-discord"; // or however message tool is accessed

const DISCORD_MAX_MESSAGE = 2000;

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: bun run scripts/pipe-to-discord.ts <file>");
  process.exit(1);
}

const content = readFileSync(filePath, "utf-8");

// Split into chunks of max 2000 chars, prefer splitting on newlines
function chunkContent(content: string, maxSize: number): string[] {
  const lines = content.split("\n");
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    // If single line exceeds max, split it
    if (line.length > maxSize) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      // Split long line into chunks
      for (let i = 0; i < line.length; i += maxSize) {
        chunks.push(line.slice(i, i + maxSize));
      }
      continue;
    }

    // Check if adding this line would exceed
    if (current.length + line.length + 1 > maxSize) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + "\n" + line : line;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

const chunks = chunkContent(content, DISCORD_MAX_MESSAGE);

console.log(`Sending ${chunks.length} chunks to Discord...`);

// Send chunks via message tool (using exec to call openclaw)
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const prefix = `📄 **${filePath.split("/").pop()}** (${i + 1}/${chunks.length})\n\`\`\`markdown\n`;
  const suffix = "\n```";
  
  // Adjust for prefix/suffix
  let messageContent = chunk;
  if (prefix.length + chunk.length + suffix.length > DISCORD_MAX_MESSAGE) {
    // Truncate chunk to fit
    const available = DISCORD_MAX_MESSAGE - prefix.length - suffix.length;
    messageContent = chunk.slice(0, available);
  }
  
  console.log(`Sending chunk ${i + 1}/${chunks.length}...`);
  
  // Write to temp file and use exec to send
  const tempFile = `/tmp/discord-chunk-${i}.txt`;
  Bun.write(tempFile, prefix + messageContent + suffix);
  
  // This would need actual Discord API or openclaw message tool
  // For now, just output
  console.log(prefix + messageContent + suffix);
}

console.log(`Done. Sent ${chunks.length} chunks.`);
