// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource/index.mjs';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroup',
  idProps: ['grName'],
  defaultProps: {
    exists: true,
    interactive: false,
  },
  acceptProps: {
    grIdNum: true,
  },
  uniqueIndexProps: [
    'grIdNum',
  ],
});


export default {
  plan(spec) { return spawnCore(this, spec); },
};
