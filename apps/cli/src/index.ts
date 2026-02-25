#!/usr/bin/env bun
import { program } from 'commander';
import { startCommand } from './commands/start';

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

program.parse();
