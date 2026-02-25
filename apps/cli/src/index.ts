#!/usr/bin/env bun
import { program } from 'commander';
import { startCommand } from './commands/start';
import { streamCommand } from './commands/stream';

program
  .name('tftown')
  .description('3D visualization for Terraform')
  .version('0.0.1');

program
  .command('start')
  .description('Start the visualization server')
  .option('-p, --port <port>', 'Server port', '4444')
  .option('-s, --state <path>', 'Path to terraform.tfstate')
  .action(startCommand);

program
  .command('stream')
  .description('Read piped terraform output and push events to the viz server')
  .option('-p, --port <port>', 'Server port', '4444')
  .action(streamCommand);

// Convenience wrappers — shell out to terraform and pipe to stream
for (const cmd of ['plan', 'apply', 'destroy', 'refresh', 'import'] as const) {
  program
    .command(`${cmd} [args...]`)
    .description(`Run terraform ${cmd} with live visualization`)
    .option('-p, --port <port>', 'Server port', '4444')
    .allowUnknownOption()
    .action(async (args: string[], options: { port?: string }) => {
      const port = options.port ?? '4444';
      const tfArgs = args.join(' ');
      const shellCmd = `terraform ${cmd} ${tfArgs} 2>&1 | bun ${import.meta.dir}/index.ts stream --port ${port}`;
      const proc = Bun.spawn(['sh', '-c', shellCmd], {
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
      });
      const exitCode = await proc.exited;
      process.exit(exitCode);
    });
}

program.parse();
