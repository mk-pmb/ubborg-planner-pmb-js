// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'file',
  idProps: ['path'],
  defaultProps: {
  },
  acceptProps: {
    weakGroup: true,
    weakModes: true,
    weakOwner: true,

    forceGroup: true,
    forceModes: true,
    forceOwner: true,

    replace: true,
    backupDir: true,

    content: true,
  },
});


async function planFile(spec) {
  const res = await spawnCore(this, spec);
  return res;
}



export default {
  plan: planFile,
};
