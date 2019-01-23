// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import bundle from './bundle';

import hook from '../hook';


const recipe = {
  ...bundle.recipe,
  typeName: 'stage',

  relationVerbs: [
    ...relRes.vanillaRecipe.relationVerbs,
    'spawns',
  ],

  api: {

    makeSubContext(changes) {
      const stg = this;
      const origCtx = stg.spawning.getContext();
      return relRes.apiBasics.makeSubContext.call(stg, {
        ...changes,
        async onResourceSpawned(spawnedRes) {
          await stg.relations.relateTo('spawns', spawnedRes);
          return hook(origCtx, 'onResourceSpawned', spawnedRes);
        },
      });
    },

    async hatch() {
      const stg = this;
      await bundle.recipe.api.hatch.call(stg);
      const spawnsPrList = stg.relations.getRelatedPlanPromises().spawns;
      stg.spawns.list = await Promise.all(spawnsPrList || []);
    },

  },
};

const spawnCore = relRes.makeSpawner(recipe);


export default {
  recipe,
  plan(spec) { return spawnCore(this, spec); },
};
