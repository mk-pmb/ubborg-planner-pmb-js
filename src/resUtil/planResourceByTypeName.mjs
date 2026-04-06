// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';

import findCommonAncestor from 'ubborg-lineage-find-common-ancestor-pmb';

const resProvPrCache = new Map();


async function loadResourceProviderByTypeName(typeName) {
  mustBe.nest('resource type', typeName);
  let rpPromise = resProvPrCache.get(typeName);
  if (rpPromise) { return rpPromise; }
  const rpDescr = ' ResourceProvider for type ' + typeName;
  async function init() {
    let how = (await import('../resTypes/' + typeName + '.mjs')).default;
    if (is.fun(how)) {
      how = await vTry.pr(how, 'Initialize' + rpDescr)({ typeName });
    }
    return how;
  }
  rpPromise = vTry.pr(init, 'Load' + rpDescr)();
  resProvPrCache.set(typeName, rpPromise);
  return rpPromise;
}


async function planResourceByTypeName(typeName, ctx, detailsPr) {
  mustBe.nest('resource type', typeName);
  const prov = await loadResourceProviderByTypeName(typeName);
  const plannerFunc = (prov || false).plan;
  if (!is.fun(plannerFunc)) {
    throw new TypeError('Unsupported resource type: ' + typeName);
  }
  const details = await detailsPr;
  const descr = ('While planning '
    + findCommonAncestor.arrowJoin([...ctx.traceParents(), typeName + '[…]']));
  const resPlan = await vTry.pr(plannerFunc, descr).call(ctx, details);
  return resPlan;
}





export default planResourceByTypeName;
