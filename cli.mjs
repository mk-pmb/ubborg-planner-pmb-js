#!/usr/bin/env node
// -*- coding: utf-8, tab-width: 2 -*-

async function runFromCli() {
  const [taskName, ...args] = process.argv.slice(2);
  const taskImpl = await import('./src/cli/' + taskName + '.mjs');
  return taskImpl.default.runFromCli(...args);
}
runFromCli();
