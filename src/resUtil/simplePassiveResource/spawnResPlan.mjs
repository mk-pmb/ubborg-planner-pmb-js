// -*- coding: utf-8, tab-width: 2 -*-

import hook from '../../hook';
import recipeTimeouts from '../recipeTimeouts';
import prepareInitExtras from './prepareInitExtras';
import startHatching from './startHatching';


async function spawnResPlan(ourPlanPr, spawnExtras) {
  const initExtras = prepareInitExtras(ourPlanPr, spawnExtras);
  const {
    isDupe,
    origPlanPr,
    normalizedProps,
  } = initExtras;
  const res = initExtras.getRes();
  const {
    typeMeta,
    api,
    lineageCtx,
    installRelationFuncs,
  } = spawnExtras;

  const makeResMtdTmoProxy = recipeTimeouts.makeResMtdTimeoutProxifier(res);
  Object.assign(res, makeResMtdTmoProxy.mapFuncs(api.promising), {
    relations: String(res) + ' not ready for relations yet!',
    spawning: initExtras,
  });

  async function extendedIncubate() {
    await res.incubate(normalizedProps);
    if (isDupe) { return; }
    await res.prepareRelationsManagement();
    installRelationFuncs.call(lineageCtx, res, typeMeta);
    await hook(lineageCtx, 'ResourceSpawned', res);
  }
  await makeResMtdTmoProxy('spawning', { impl: extendedIncubate })();

  if (isDupe) {
    const origPlan = await origPlanPr;
    const ack = await origPlan.mergeUpdate(res);
    if (ack !== origPlan) {
      throw new Error('Unmerged duplicate resource ID for ' + String(res));
    }
    await hook(lineageCtx, 'ResourceRespawned', origPlan);
    return origPlan;
  }
  delete res.spawning;

  startHatching(res, initExtras);
  // ^-- Should be awaited by the top-level resource via res.hatchedPr.

  await res.finalizePlan(initExtras);
  // finalizePlan may overlap with hatching: Hatching might reach a state
  // where declaration of dependencies is still work in progress, but the
  // plan is stable already. In this case, ideally, finalizePlan would
  // resolve before hatchedPr.

  return res;
}

export default spawnResPlan;
