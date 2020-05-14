// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroupMembership',
  idProp: ['loginName', 'grName'],
  defaultProps: {
  },
  acceptProps: {
    loginName: true,
    grName: true,
    member: true,
  },
});


async function planOsUserGroupMembership(spec) {
  const res = await spawnCore(this, spec);
  const { loginName, grName, member } = spec;
  if (member) {
    res.needs('osUserGroup', { grName, exists: true });
    res.needs('osUser', { loginName, exists: true });
  }
  return res;
}



export default {
  plan: planOsUserGroupMembership,
};
