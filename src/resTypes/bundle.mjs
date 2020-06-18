// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelPathResource';
import slashableImport from '../slashableImport';

const { makeSpawner } = relRes;


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
  idProps: ['path'],
  defaultProps: {
  },
  acceptProps: {
  },
  promisingApi: {
    hatch: breedBundle,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = makeSpawner(recipe);


export default {
  recipe,
  makeSpawner,
  plan(spec) { return spawnCore(this, spec); },
};
