// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


async function hatch() {
  const res = this;
  const facts = await res.toFactsDict({ acceptPreliminary: true });
  const { path, sect, val } = facts;
  if (val === undefined) {
    const err = 'Value must not be ' + val + '. Use null to remove the key.';
    throw new Error(err);
  }
  if (val !== null) {
    await res.needs('iniFileSect', { path, sect, exists: true });
  }
}

const recipe = {
  typeName: 'iniFileOpt',
  idProps: [
    'path',
    'sect',
    'key',
  ],
  defaultProps: {
  },
  acceptProps: {
    val: true,
  },
  promisingApi: { hatch },
};
const spawnCore = spRes.makeSpawner(recipe);




export default {
  recipe,
  async plan(spec) { return spawnCore(this, spec); },
};
