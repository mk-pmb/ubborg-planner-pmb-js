// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import slashableImport from '../slashableImport';


async function breedBundle() {
  const bun = this;
  // console.debug(String(bun), 'import');
  const imp = await slashableImport(bun.id);
  // console.debug(String(bun), 'run');
  await imp(bun);
  // console.debug(String(bun), 'bred');
};


const recipe = {
  typeName: 'bundle',
  idProp: 'path',
  defaultProps: {
  },
  acceptProps: {
  },
  api: {
    hatch: breedBundle,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = relRes.makeSpawner(recipe);


export default {
  recipe,
  plan(spec) { return spawnCore(this, spec); },
};
