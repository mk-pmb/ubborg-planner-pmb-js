// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUserGroupMembership',
  idProp: ['user', 'group'],
  defaultProps: {
  },
  acceptProps: {
    user: true,
    group: true,
    member: true,
  },
});


async function planOsUserGroupMembership(spec) {
  const res = await spawnCore(this, spec);
  const { group, member } = spec;
  if (member) { res.needs('osUserGroup', { group, exists: true }); }
  return res;
}



export default {
  plan: planOsUserGroupMembership,
};
