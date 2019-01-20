// -*- coding: utf-8, tab-width: 2 -*-

import goak from 'getoraddkey-simple';

import planResourceByTypeName from './planResourceByTypeName';


function makeResDepFunc(ctx, res, verb) {
  async function dependOn(depType, depSpec) {
    const subCtx = {
      ...ctx,
      requestedBy: res,
      requestVerb: verb,
    };
    const planPr = planResourceByTypeName(depType, subCtx, depSpec);
    goak.pushToKey(res.getDependencyPlanPromises(), verb, planPr);
    return planPr;
  }
  return dependOn;
}


function install(ctx, res, verb) {
  if (verb.forEach) {
    verb.forEach(dv => install(ctx, res, dv));
    return res;
  }
  const f = makeResDepFunc(ctx, res, verb);
  res[verb] = f;
  return f;
}


Object.assign(makeResDepFunc, {
  install,
});


export default makeResDepFunc;
