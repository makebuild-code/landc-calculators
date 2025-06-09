#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const branch = process.argv[2];
if (!branch) {
  console.error('Please provide a feature name.');
  process.exit(1);
}
execSync(
  `git checkout development && git pull origin development && git checkout -b feature/${branch}`,
  { stdio: 'inherit' }
);
