// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const sprRecipe = {
  typeName: 'osUserGroupMembership',
  idProp: ['user', 'group'],
  defaultProps: {
  },
  acceptProps: {
    user: true,
    group: true,
    member: true,
  },
}


async function osUserGroupMembership(spec) {
  const res = spRes.spawn(sprRecipe, this, {
    ...spec,
    groups: undefined,
  });

  const { group, member } = spec;
  if (member) { res.needs('osUserGroup', { group, exists: true }); }

  return res;
}



export default {
  plan: osUserGroupMembership,
};
