// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroup',
  idProps: ['grName'],
  defaultProps: {
    exists: true,
  },
  acceptProps: {
    grIdNum: true,
  },
});


export default {
  plan(spec) { return spawnCore(this, spec); },
};
