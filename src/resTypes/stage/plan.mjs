// -*- coding: utf-8, tab-width: 2 -*-

import mergeOptions from 'merge-options';

import basicRelation from '../../resUtil/basicRelation';
import hook from '../../hook';

import bundle from '../bundle';
import debPkg from '../debPkg';

import reportDeferredDebPkg from './reportDeferredDebPkg';


const bunRec = bundle.recipe;
const hatchBundle = bunRec.promisingApi.hatch;


const recipe = {
  ...bunRec,
  typeName: 'stage',
};


const defaultPropsIfDebPkg = { deferredDebPkgs: {
  policy: debPkg.recipe.defaultProps.policy,
} };


async function hatchStage() {
  const stg = this;
  await hatchBundle.call(stg);
}


async function finalizeStage() {
  const stg = this;
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


function forkLineageContext(origCtx, changes) {
  const stg = this;
  const upd = {
    ...changes,
    parentStage: origCtx.currentStage,
    currentStage: stg,
    async onResourceSpawned(spawnedRes) {
      // console.log(String(stg), 'seems to spawn', String(spawnedRes));
      await stg.spawns(spawnedRes);
      return hook(origCtx, 'onResourceSpawned', spawnedRes);
    },
  };
  return bunRec.forkLineageContext.call(stg, origCtx, upd);
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
    hatch: hatchStage,
    finalizePlan: finalizeStage,
  },

  forkLineageContext,

});

const spawnCore = bundle.makeSpawner(recipe);

function plan(spec) { return spawnCore(this, spec); };

export default plan;
