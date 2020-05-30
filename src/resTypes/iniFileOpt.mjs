// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const recipe = {
  typeName: 'iniFileOpt',
  idProps: [
    'path',
    'sect',
    'key',
  ],
  defaultProps: {
    val: null,  // null = remove
  },
  acceptProps: {
  },
};
const spawnCore = spRes.makeSpawner(recipe);


async function plan(spec) {
  const { path, sect, val } = spec;
  if (val === undefined) {
    throw new Error('A value is required. Use null to remove the key.');
  }
  const res = await spawnCore(this, spec);
  if (val !== null) {
    await res.needs('iniFileSect', { path, sect, exists: true });
  }
  return res;
}


export default {
  recipe,
  plan,
};
