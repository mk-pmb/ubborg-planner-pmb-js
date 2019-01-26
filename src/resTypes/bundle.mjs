// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import slashableImport from '../slashableImport';


async function hatchBundle() {
  const bun = this;
  // console.debug(String(bun), 'import');
  const imp = await slashableImport(bun.id);
  // console.debug(String(bun), 'run');
  await imp(bun);
  // console.debug(String(bun), 'wfp');
  await bun.relations.waitForAllSubPlanning();
  // console.debug(String(bun), 'bundle hatched');
};


const recipe = {
  typeName: 'bundle',
  idProp: 'path',
  defaultProps: {
  },
  acceptProps: {
  },
  api: {
    hatch: hatchBundle,
  },
};

const spawnCore = relRes.makeSpawner(recipe);

async function planBundle(spec) {
  const bun = await spawnCore(this, spec);
  await bun.hatchedPr;
  return bun;
}



export default {
  recipe,
  plan: planBundle,
};
