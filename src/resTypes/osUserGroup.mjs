// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroup',
  idProp: 'group',
  defaultProps: {
    exists: true,
  },
  acceptProps: {
    gid: true,
  },
});


export default {
  plan(spec) { return spawnCore(this, spec); },
};
