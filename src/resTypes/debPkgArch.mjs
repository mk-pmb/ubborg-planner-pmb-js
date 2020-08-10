// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';

const defaultState = 'enabled';

const recipe = {
  typeName: 'debPkgArch',
  idProps: ['name'],
  defaultProps: {
    state: defaultState,
  },
  acceptProps: {
    state: [['oneOf', [defaultState, 'disabled']]],
  },
};

const baseSpawner = spRes.makeSpawner(recipe);

export default {
  plan(spec) { return baseSpawner(this, spec); },
};
