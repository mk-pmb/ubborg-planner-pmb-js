#!/usr/bin/env nodemjs
// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';

async function runFromCli() {
  const [cliName, ...args] = process.argv.slice(2);
  const cliMod = await import('../src/cli/' + cliName);
  return cliMod.default.runFromCli(...args);
}
runFromCli();
