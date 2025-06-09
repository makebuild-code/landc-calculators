#!/usr/bin/env node
import { execSync } from 'child_process';

const branch = execSync('git branch --show-current').toString().trim();
execSync(`git push origin ${branch}`, { stdio: 'inherit' });
