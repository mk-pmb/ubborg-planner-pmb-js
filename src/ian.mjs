// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import nodeRepl from 'repl';

import planResourceByTypeName from './resUtil/planResourceByTypeName';


async function ian(cliArgs) {
  const [topBundleFile] = cliArgs;
  const resourcesByTypeName = Object.create(null);
  const topCtx = {
    getResourcesByTypeName() { return resourcesByTypeName; },
  };
  const topRes = await planResourceByTypeName('bundle', topCtx, topBundleFile);
  const masterPlan = await topRes.relations.waitForAllPlanning();

  if (!process.stdin.isTTY) {
    console.log('non-interactive');
    return;
  }
  const repl = nodeRepl.start();
  Object.assign(repl.context, {
    masterPlan,
    topBundleFile,
    topCtx,
    topRes,
  });
}


export default ian;
