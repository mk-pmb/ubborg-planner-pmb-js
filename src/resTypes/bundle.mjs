// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import slashableImport from '../slashableImport';


async function hatchBundle() {
  const bun = this;
  const imp = await slashableImport(bun.id);
  await imp(bun);
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
