// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import bundle from './bundle';

import hook from '../hook';


async function hatchStage() {
  const stg = this;
  // console.debug(String(stg), 'hatching my bundle');
  await bundle.recipe.api.hatch.call(stg);
  // console.debug(String(stg), 'collecting my spawn list');
  const spawnsPrList = stg.relations.getRelatedPlanPromises().spawns;
  stg.spawns.list = await Promise.all(spawnsPrList || []);
  // console.debug(String(stg), 'fully hatched');
}


function makeSubContext(origCtx, changes) {
  const stg = this;
  const upd = {
    ...changes,
    async onResourceSpawned(spawnedRes) {
      // console.log(String(stg), 'seems to spawn', String(spawnedRes));
      await stg.spawns(spawnedRes);
      return hook(origCtx, 'onResourceSpawned', spawnedRes);
    },
  };
  return relRes.recipe.makeSubContext.call(stg, origCtx, upd);
}


const recipe = {
  ...bundle.recipe,
  typeName: 'stage',

  relationVerbs: [
    ...relRes.recipe.relationVerbs,
    'spawns',
  ],

  api: {
    hatch: hatchStage,
  },

  makeSubContext,
};

const spawnCore = relRes.makeSpawner(recipe);


export default {
  recipe,
  plan(spec) { return spawnCore(this, spec); },
};