#!/usr/bin/env bun
import { program } from 'commander';

program
  .name('tftown')
  .description('3D visualization for Terraform')
  .version('0.0.1');

program.parse();
