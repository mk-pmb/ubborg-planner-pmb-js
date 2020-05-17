// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserLogin',
  idProp: 'loginName',
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
});


async function planOsUserLogin(spec) {
  if (spec.groups) {
    throw new Error('osUserLogin does not support groups.'
      + ' You might be looking for osUser or osUserGroupMembership.');
  }
  const res = await spawnCore(this, spec);
  return res;
}



export default {
  plan: planOsUserLogin,
};
