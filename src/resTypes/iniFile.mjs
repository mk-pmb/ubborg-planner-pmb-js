// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';
// import mustBe from 'typechecks-pmb/must-be';

import spRes from '../resUtil/simplePassiveResource';


async function hatch(initExtras) {
  const res = this;
  const path = res.id;
  const { fileOpts, sections } = initExtras.spawnOpt.spec;

  await res.needs('file', {
    ...fileOpts,
    path,
    // Ensure conflict with anything that wants the same file to not exist:
    mimeType: 'text/plain',
  });

  await (sections && pProps(sections, async function addSect(pairs, sect) {
    await res.needs('iniFileSect', { path, sect, exists: (pairs !== null) });
    await (pairs && pProps(pairs, async function addPair(val, key) {
      await res.needs('iniFileOpt', { path, sect, key, val });
    }));
  }));
}

const recipe = {
  typeName: 'iniFile',
  idProps: ['path'],
  defaultProps: {
  },
  acceptProps: {
    fileOpts: true,
    sections: true,
  },
  api: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
};
const spawnCore = spRes.makeSpawner(recipe);


async function plan(spec) {
  const res = await spawnCore(this, {
    ...spec,
    fileOpts: undefined,
    sections: undefined,
  }, { spec });
  return res;
}


export default {
  recipe,
  plan,
};
