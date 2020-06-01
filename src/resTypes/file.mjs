// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'file',
  idProps: ['path'],
  defaultProps: {
    exists: true,
    followSymlink: true,
  },
  acceptProps: {
    replace: true,
    backupDir: true,

    // If the file is to be created:
    createForOwner: true,
    createForGroup: true,
    createWithModes: true,

    // In case the file existed already:
    enforcedOwner: true,
    enforcedGroup: true,
    enforcedModes: true,

    content: true,
  },
});





export default {
  plan(spec) { return spawnCore(this, spec); },
};
