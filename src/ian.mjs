// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';
import nodeRepl from 'repl';
import loMapKeys from 'lodash.mapkeys';
import loCamel from 'lodash.camelcase';

import planResourceByTypeName from './resUtil/planResourceByTypeName';


async function ian(cliArgs) {
  const [topBundleFile] = cliArgs;
  const resourcesByTypeName = Object.create(null);
  const topCtx = {
    getResourcesByTypeName() { return resourcesByTypeName; },
    traceParents() { return []; },
  };
  console.log('topRes: awaiting bundle');
  const topRes = await planResourceByTypeName('bundle', topCtx, topBundleFile);
  console.log('topPlan: waitForAllPlanning');
  const topPlan = await topRes.relations.waitForAllPlanning();
  console.log('topPlan: ready');

  if (!process.stdin.isTTY) {
    console.log('non-interactive');
    return;
  }

  const repl = nodeRepl.start();
  const stages = resourcesByTypeName.stage;
  const camelStages = loMapKeys(stages, (val, key) => loCamel(key));
  Object.assign(repl.context, {
    camelStages,
    resourcesByTypeName,
    stages,
    topBundleFile,
    topCtx,
    topPlan,
    topRes,
  });
}


export default ian;
