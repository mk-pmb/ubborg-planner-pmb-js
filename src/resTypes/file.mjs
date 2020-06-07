// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import spRes from '../resUtil/simplePassiveResource';


const mimeTypeAliases = {
  blk:  'inode/blockdevice',
  char: 'inode/chardevice',
  dir:  'inode/directory',
  fifo: 'inode/fifo',
  sock: 'inode/socket',
  sym:  'inode/symlink',  // only for broken ones. see the "symlink" resType.
  b64:  'application/octet-stream;base64',
};


const spawnCore = spRes.makeSpawner({
  typeName: 'file',
  idProps: ['path'],
  defaultProps: {
    mimeType: '*/*',  // null = no such file should exist. NB aliases above.
  },
  acceptProps: {
    replace: true,
    backupDir: true,

    // If the file is to be created:
    createdOwner: true,
    createdGroup: true,
    createdModes: true,

    // In case the file existed already:
    enforcedOwner: true,
    enforcedGroup: true,
    enforcedModes: true,

    content: true,
  },
});


async function plan(spec) {
  const ovr = {};
  const mta = mimeTypeAliases[spec.mimeType];
  if (mta) { ovr.mimeType = mta; }
  const res = await spawnCore(this, { ...spec, ...ovr });

  const parentDir = pathLib.dirname(spec.path);
  if (parentDir && (parentDir !== '/')) {
    await res.needs('file', { path: parentDir, mimeType: 'dir' });
  }

  return res;
}



export default {
  plan,
};
