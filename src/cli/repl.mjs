// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import nodeRepl from 'repl';
import loMapKeys from 'lodash.mapkeys';
import loCamel from 'lodash.camelcase';

import makeToplevelContext from '../resUtil/makeToplevelContext';
import planResourceByTypeName from '../resUtil/planResourceByTypeName';


async function runFromCli(topBundleFile) {
  const topCtx = makeToplevelContext();
  const topRes = await planResourceByTypeName('stage', topCtx, topBundleFile);

  const resourcesByTypeName = topCtx.getResourcesByTypeName();
  const stages = resourcesByTypeName.stage;
  const camelStages = loMapKeys(stages, (val, key) => loCamel(key));

  const replVars = {
    camelStages,
    resourcesByTypeName,
    stages,
    topBundleFile,
    topCtx,
    topRes,
  };

  async function awaitAsReplVar(pr, slot) {
    if (slot === undefined) { return awaitAsReplVar(pr, 'awaited'); }
    const x = await pr;
    replVars[slot] = x;
    console.info('awaitAsReplVar:', slot, ':=', x);
  }

  Object.assign(replVars, {
    awaitVar: awaitAsReplVar,
  });

  console.info('ubborg planner repl vars:',
    Object.keys(replVars).sort().join(' '));
  const repl = nodeRepl.start();
  Object.assign(repl.context, replVars);
}


export default { runFromCli };
