// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const recipe = {
  typeName: 'iniFileSect',
  idProps: ['path', 'sect'],
  defaultProps: {
    exists: true,
  },
  acceptProps: {
    // pairs: No. Implementing this feature here (in either plan, hatch or
    //    finalizePlan) would create a cyclic dependency between iniFileOpt
    //    and iniFileSect. Instead, use iniFile's "sections" feature.
  },
  api: {
    async hatch(props) {
      const res = this;
      const { path, exists } = props;
      if (exists) { await res.needs('file', { path, exists: true }); }
    },
    finalizePlan() { return this.hatchedPr; },
  },
};
const spawnCore = spRes.makeSpawner(recipe);


async function plan(spec) {
  const res = await spawnCore(this, spec);
  return res;
}


export default {
  recipe,
  plan,
};
