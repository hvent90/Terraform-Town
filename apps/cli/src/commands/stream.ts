import { parseLine } from '../output-parser';

const DEFAULT_PORT = 4444;

export async function streamCommand(options: { port?: string }) {
  const port = options.port ? parseInt(options.port) : DEFAULT_PORT;
  const baseUrl = `http://localhost:${port}`;

  const decoder = new TextDecoder();
  const stdin = Bun.stdin.stream();
  const reader = stdin.getReader();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!; // keep incomplete last line in buffer

      for (const line of lines) {
        if (line.length === 0) continue;

        // Echo to stdout so the user still sees terraform output
        process.stdout.write(line + '\n');

        const events = parseLine(line);
        for (const event of events) {
          await postEvent(baseUrl, event);
        }
      }
    }

    // Flush remaining buffer
    if (buffer.length > 0) {
      process.stdout.write(buffer + '\n');
      const events = parseLine(buffer);
      for (const event of events) {
        await postEvent(baseUrl, event);
      }
    }
  } finally {
    // Send done event
    await postEvent(baseUrl, { type: 'done', exitCode: 0 });
  }
}

async function postEvent(baseUrl: string, event: any) {
  try {
    await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    // Server might not be running — silently ignore
  }
}
