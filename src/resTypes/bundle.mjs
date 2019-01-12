// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'bundle',
  idProp: 'path',
  defaultProps: {
  },
  acceptProps: {
  },
});


async function planBundle(spec) {
  const res = await spawnCore(this, spec);
  return res;
}



export default {
  plan: planBundle,
};
