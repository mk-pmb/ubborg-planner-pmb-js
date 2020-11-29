// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroupMembership',
  idProps: ['loginName', 'grName'],
  defaultProps: {
  },
  acceptProps: {
    loginName: true,
    grName: true,
    member: true,
    assumeUserExists: true,
  },
});


async function planOsUserGroupMembership(spec) {
  const res = await spawnCore(this, spec);
  const { loginName, grName, member } = spec;
  if (member) {
    if (!spec.assumeUserExists) {
      res.needs('osUserLogin', { loginName, exists: true });
    }
    res.needs('osUserGroup', { grName, exists: true });
  }
  return res;
}



export default {
  plan: planOsUserGroupMembership,
};
