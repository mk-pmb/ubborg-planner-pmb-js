// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const recipe = {
  typeName: 'osUserLogin',
  idProps: ['loginName'],
  defaultProps: {
    createDefaultHomeDir: false,
    exists: true,
    fullName: '',
    locked: false,
    system: false,
  },
  acceptProps: {
    userIdNum: true,
    passwordHash: true,
  },
  uniqueIndexProps: [
    'userIdNum',
  ],
};

const spawnCore = spRes.makeSpawner(recipe);


async function planOsUserLogin(spec) {
  if (spec.groups) {
    throw new Error('osUserLogin does not support groups.'
      + ' You might be looking for osUser or osUserGroupMembership.');
  }
  const res = await spawnCore(this, spec);
  return res;
}



export default {
  recipe,
  plan: planOsUserLogin,
};
