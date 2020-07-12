// -*- coding: utf-8, tab-width: 2 -*-

import relRes from '../resUtil/parentRelUrlResource';

const recipe = {
  ...relRes.recipe,
  typeName: 'ansibleTask',
  acceptProps: {
    task: true,
  },
};

const baseSpawner = relRes.makeSpawner(recipe);

function plan(spec, opt, ...extra) {
  return baseSpawner(this, spec, { ...opt, ensureParentUrlTrail: '/' }, extra);
}

export default { plan };
