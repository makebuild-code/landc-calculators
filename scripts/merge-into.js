#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const target = process.argv[2];
if (!target) {
  console.error("Specify which branch to merge into (e.g. 'testing').");
  process.exit(1);
}
const branch = execSync('git branch --show-current').toString().trim();
execSync(
  `git checkout ${target} && git pull origin ${target} && git merge ${branch} && git push origin ${target}`,
  { stdio: 'inherit' }
);
