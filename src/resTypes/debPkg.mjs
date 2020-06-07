// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

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
  mustBe(['undef', '|', ['oneOf', simpleStates]], 'state')(state);
  const res = await spawnCore(this, spec);
  return res;
}


export default {
  plan,
};
