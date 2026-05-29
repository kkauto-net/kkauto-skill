#!/usr/bin/env node
import { Command } from 'commander';
import { runDoctor } from './commands/doctor.js';
import { runInstall } from './commands/install.js';
import { runList } from './commands/list.js';
import { runPrintConfig } from './commands/print-config.js';
import { runUpdate } from './commands/update.js';
import { supportedAgentList, supportedSelectorList } from './agents/index.js';
import { redact } from './core/redaction.js';

const program = new Command();

program
  .name('kkauto-skill')
  .description('Install and update kkAuto AI-agent skills and MCP config.')
  .version('0.1.0');

program
  .command('install')
  .description('Install kkAuto skill packs and MCP config for an AI agent.')
  .option('--agent <agent>', supportedSelectorList, 'auto')
  .option('--packs <csv>', 'comma-separated packs')
  .option('--dry-run', 'preview writes only')
  .option('--no-mcp-config', 'install skills only')
  .option('--json', 'machine-readable output')
  .action((options) => { void runInstall(options).catch(handleError); });

program
  .command('update')
  .description('Refresh previously installed kkAuto skill packs from this package.')
  .option('--dry-run', 'preview writes only')
  .option('--json', 'machine-readable output')
  .action((options) => runUpdate(options).catch(handleError));

program
  .command('doctor')
  .description('Check kkAuto skill and MCP config health without revealing secrets.')
  .option('--agent <agent>', 'agent to inspect')
  .option('--json', 'machine-readable output')
  .action((options) => runDoctor(options).catch(handleError));

program
  .command('list')
  .description('List available agents, packs, and local installs.')
  .option('--json', 'machine-readable output')
  .action((options) => runList(options).catch(handleError));

program
  .command('print-config')
  .description('Print MCP config for an agent without writing files.')
  .requiredOption('--agent <agent>', supportedAgentList)
  .option('--json', 'machine-readable output')
  .action((options) => runPrintConfig(options).catch(handleError));

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${redact(message)}\n`);
  process.exit(1);
}

program.parseAsync();
