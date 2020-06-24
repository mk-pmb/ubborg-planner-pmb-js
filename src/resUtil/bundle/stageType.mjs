// -*- coding: utf-8, tab-width: 2 -*-

import mergeOptions from 'merge-options';

import basicRelation from '../basicRelation';
import hook from '../../hook';

import bundle from './bundleType';
import debPkg from '../../resTypes/debPkg';

import reportDeferredDebPkg from './reportDeferredDebPkg';


const bunRec = bundle.recipe;


const recipe = {
  ...bunRec,
  typeName: 'stage',
};


const defaultPropsIfDebPkg = { deferredDebPkgs: {
  policy: debPkg.recipe.defaultProps.policy,
} };


async function finalizePlan(initExtras) {
  const stg = this;
  await bunRec.promisingApi.finalizePlan.call(stg, initExtras);

  await stg.hatchedPr;
  await stg.relations.waitForAllSubPlanning();
  await basicRelation.exposeRelationListsOnVerbs(stg, recipe.relationVerbs);

  const spawnList = stg.spawns.list;
  const dfrDebs = await reportDeferredDebPkg(spawnList);
  if (dfrDebs.modifies) {
    stg.customProps = mergeOptions(defaultPropsIfDebPkg, stg.customProps);
    await stg.declareFacts({ deferredDebPkgs: {
      ...dfrDebs,
      modifies: (dfrDebs.modifies.length || 0),
    } });
  }
}


function forkLineageContext(ourLinCtx, changes) {
  const stg = this;
  const upd = {
    ...changes,
    parentStage: stg,
    async onResourceSpawned(spawnedRes) {
      // console.log(String(stg), 'seems to spawn', String(spawnedRes));
      await stg.spawns(spawnedRes);
      return hook(ourLinCtx, 'onResourceSpawned', spawnedRes);
    },
  };
  return bunRec.forkLineageContext.call(stg, ourLinCtx, upd);
}


Object.assign(recipe, {
  acceptProps: {
    ...bunRec.acceptProps,
    deferredDebPkgs: true,
  },

  relationVerbs: [
    ...bunRec.relationVerbs,
    'spawns',
  ],

  promisingApi: {
    ...bunRec.promisingApi,
    finalizePlan,
  },

  forkLineageContext,

});

const spawnCore = bundle.makeSpawner(recipe);

function plan(spec) { return spawnCore(this, spec); };

export default {
  plan,
};
