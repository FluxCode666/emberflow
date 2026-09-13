#!/usr/bin/env node
import { cp, mkdir, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(packageRoot, 'skills', 'emberflow-ui');
const args = process.argv.slice(2);
const command = args[0] === '--help' || args[0] === '-h' ? 'help' : (args[0] && !args[0].startsWith('-') ? args.shift() : 'install');
const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const home = os.homedir();
const codexHome = process.env.CODEX_HOME || path.join(home, '.codex');
const defaultTarget = path.join(codexHome, 'skills', 'emberflow-ui');
const target = flag('--target') || (flag('--scope') === 'project' ? path.join(process.cwd(), '.agents', 'skills', 'emberflow-ui') : defaultTarget);

if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`Emberflow Skill installer\n\nUsage:\n  npx --yes github:FluxCode666/emberflow install                 Install for the current user\n  npx --yes github:FluxCode666/emberflow install --scope project Install into .agents/skills\n  npx --yes github:FluxCode666/emberflow install --target PATH   Install into an exact directory\n  npx --yes github:FluxCode666/emberflow path                   Print the skill source path`);
  process.exit(0);
}
if (command === 'path') {
  console.log(await realpath(source));
  process.exit(0);
}
if (command !== 'install') {
  console.error(`Unknown command: ${command}. Run with --help for usage.`);
  process.exit(1);
}
if (!existsSync(source)) throw new Error(`Skill files are missing from ${source}`);
await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log(`Installed Emberflow UI skill to ${target}`);
console.log('Use it explicitly as $emberflow-ui, or let your agent discover it automatically.');
