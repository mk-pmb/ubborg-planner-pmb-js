// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';

import relRes from '../../resUtil/parentRelPathResource';
import basicRelation from '../../resUtil/basicRelation';
import bundle from '../bundle';
import hook from '../../hook';

import reportDeferredDebPkg from './reportDeferredDebPkg';


const bunRec = bundle.recipe;
const hatchBundle = bunRec.api.hatch;


function lengthOrVal(x) { return ((x || false).length || x); }


async function hatchStage() {
  const stg = this;
  await hatchBundle.call(stg);
  await stg.relations.waitForAllSubPlanning();

  await basicRelation.exposeRelationListsOnVerbs(stg, [
    'spawns',
  ]);

  const defferedDebPkgs = await reportDeferredDebPkg(stg.spawns.list);
  stg.declareFacts({
    defferedDebPkgs: aMap(defferedDebPkgs, lengthOrVal),
  });
}


function forkLineageContext(origCtx, changes) {
  const stg = this;
  const upd = {
    ...changes,
    async onResourceSpawned(spawnedRes) {
      // console.log(String(stg), 'seems to spawn', String(spawnedRes));
      await stg.spawns(spawnedRes);
      return hook(origCtx, 'onResourceSpawned', spawnedRes);
    },
  };
  return relRes.recipe.forkLineageContext.call(stg, origCtx, upd);
}


const recipe = {
  ...bunRec,
  typeName: 'stage',

  relationVerbs: [
    ...relRes.recipe.relationVerbs,
    'spawns',
  ],

  api: {
    ...bunRec.api,
    hatch: hatchStage,
  },

  forkLineageContext,
};

const spawnCore = relRes.makeSpawner(recipe);

function plan(spec) { return spawnCore(this, spec); };

export default plan;
