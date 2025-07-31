// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';

import relRes from '../resUtil/parentRelUrlResource.mjs';

const recipe = {
  ...relRes.recipe,
  typeName: 'ansibleTask',
  acceptProps: {
    tasks: true,
    blockExtras: true,
  },
};

const baseSpawner = relRes.makeSpawner(recipe);

function plan(origSpec, opt, ...extra) {
  mustBe.dictObj('spec', origSpec);
  const spec = { ...origSpec };
  if (spec.task) {
    spec.tasks = [].concat(spec.task, spec.tasks).filter(Boolean);
    delete spec.task;
  }
  if (spec.eachTaskDefaults) {
    spec.tasks = spec.tasks.map(t => ({ ...spec.eachTaskDefaults, ...t }));
    delete spec.eachTaskDefaults;
  }
  return baseSpawner(this, spec, { ...opt, ensureParentUrlTrail: '/' }, extra);
}

export default { plan };
