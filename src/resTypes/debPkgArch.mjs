// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';

const recipe = {
  typeName: 'debPkgArch',
  idProps: ['name'],
  defaultProps: { enabled: true },
  acceptProps: { enabled: 'bool' },
};

const baseSpawner = spRes.makeSpawner(recipe);

export default {
  plan(spec) { return baseSpawner(this, spec); },
};
