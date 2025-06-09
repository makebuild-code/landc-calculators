#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const name = process.argv[2];
if (!name) {
  console.error('Please provide a bugfix name.');
  process.exit(1);
}
execSync(
  `git checkout development && git pull origin development && git checkout -b bugfix/${name}`,
  { stdio: 'inherit' }
);
