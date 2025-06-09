#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const target = process.argv[2];
if (!target) {
  console.error("Specify which branch to merge into (e.g. 'testing').");
  process.exit(1);
}
execSync(
  `git checkout ${target} && git pull origin ${target} && git merge development && git push origin ${target}`,
  { stdio: 'inherit' }
);
