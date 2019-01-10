// -*- coding: utf-8, tab-width: 2 -*-

import goak from 'getoraddkey-simple';
import isFun from 'is-fn';
import isStr from 'is-string';
import vTry from 'vtry';
import tyck from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';

const promiseCache = {};

async function loadResourceProviderByTypeName(typeName) {
  mustBe.nest('resource type', typeName);
  let rpp = promiseCache[typeName];
  if (rpp) { return rpp; }
  async function init() {
    let how;
    try {
      how = (await import('./' + typeName)).default;
    } catch (ignore) {
      return false;
    }
    if (isFun(how)) { return how({ typeName }); }
    return how;
  }
  rpp = init();
  promiseCache[typeName] = rpp;
  return rpp;
}


async function tryPlanByTypeName(typeName, ctx, details) {
  const resId = details[''];
  const mgdRes = mustBe.prop('obj', ctx, 'resourcesByTypeName');
  const prov = await loadResourceProviderByTypeName(typeName);
  const plannerFunc = (prov || false).plan;
  if (!tyck.fun(plannerFunc)) {
    throw new TypeError('Unsupported resource type: ' + typeName);
  }

  const mgdSame = goak(mgdRes, typeName, '{}');
  const dupe = mgdSame[resId];
  const resPlan = await plannerFunc.call(ctx, details);
  if (dupe) {
    if (resPlan !== dupe) {
      throw new Error(`Duplicate resource ID "${resId}" for ${typeName}`);
    }
  } else {
    mgdSame[resId] = resPlan;
  }
  return resPlan;
}


function planByTypeName(typeName, ctx, details) {
  if (isStr(details)) {
    return planByTypeName(typeName, ctx, { '': details });
  }
  mustBe.nest('resource type', typeName);
  const resId = (details || false)[''];
  mustBe.nest('resource identifier', resId);
  return vTry.pr(tryPlanByTypeName, `Plan [${typeName} ${resId}]`
  )(typeName, ctx, details);
}





export default {
  planByTypeName,
};
