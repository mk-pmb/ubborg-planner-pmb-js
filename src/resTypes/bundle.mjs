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


export default {
  recipe,
  plan(spec) { return spawnCore(this, spec); },
};
