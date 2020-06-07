// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const recipe = {
  typeName: 'debPkg',
  idProps: ['name'],
  defaultProps: {
    state: 'installed',
  },
  acceptProps: {
    presenceMarker: true,
  },
};

const spawnCore = spRes.makeSpawner(recipe);

const simpleStates = [
  recipe.defaultProps.state,
  'absent',
  'banned',
];


async function plan(spec) {
  const { state } = spec;
  if (!simpleStates.includes(state)) {
    throw new Error('state must be one of ' + simpleStates.join(', '));
  }
  const res = await spawnCore(this, spec);
  return res;
}


export default {
  plan,
};
