// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource/index.mjs';


const recipe = {
  typeName: 'osUserLogin',
  idProps: ['loginName'],
  defaultProps: {
    exists: true,
    preserveExistingPasswordHash: false,
    disablePasswordLogin: false,
    interactive: false,
  },
  acceptProps: {
    userIdNum: true,
    primaryGroupName: true,
    homeDirPath: true,
    passwordHash: true,
    shell: true,

    fullName: true,                 // GECOS field part 1
    buildingAndRoomNumber: true,    // GECOS field part 2
    officePhoneNumber: true,        // GECOS field part 3
    homePhoneNumber: true,          // GECOS field part 4
    additionalContactInfo: true,    // GECOS field part 5
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
  const login = {
    ...spec,
  };
  if (spec.primaryGroupName === true) {
    login.primaryGroupName = spec.loginName;
  }
  const res = await spawnCore(this, login);
  if (spec.primaryGroupName) {
    res.needs('osUserGroup', { grName: spec.primaryGroupName });
  }
  return res;
}



export default {
  recipe,
  plan: planOsUserLogin,
};
