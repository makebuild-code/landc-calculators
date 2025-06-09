#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const msg = process.argv.slice(2).join(' ');
if (!msg) {
  console.error('Please provide a commit message.');
  process.exit(1);
}
execSync(`git add . && git commit -m "${msg}"`, { stdio: 'inherit' });
