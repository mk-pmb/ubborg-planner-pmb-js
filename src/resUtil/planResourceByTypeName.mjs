// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';

const resProvPrCache = {};


async function loadResourceProviderByTypeName(typeName) {
  mustBe.nest('resource type', typeName);
  let rpp = resProvPrCache[typeName];
  if (rpp) { return rpp; }
  async function init() {
    const how = (await import('../resTypes/' + typeName)).default;
    if (is.fun(how)) { return how({ typeName }); }
    return how;
  }
  rpp = init();
  resProvPrCache[typeName] = rpp;
  return rpp;
}


async function planResourceByTypeName(typeName, ctx, details) {
  mustBe.nest('resource type', typeName);
  const prov = await loadResourceProviderByTypeName(typeName);
  const plannerFunc = (prov || false).plan;
  if (!is.fun(plannerFunc)) {
    throw new TypeError('Unsupported resource type: ' + typeName);
  }
  const resPlan = await plannerFunc.call(ctx, details);
  return resPlan;
}





export default planResourceByTypeName;
