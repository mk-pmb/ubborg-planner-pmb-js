// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';


const sprRecipe = {
  typeName: 'osUser',
  idProp: 'loginName',
  defaultProps: {
    system: false,
    locked: false,
    fullName: '',
  },
  acceptProps: {
    uid: true,
    passwordHash: true,
  },
}


async function planOsUser(spec) {
  const res = spRes.spawn(sprRecipe, this, {
    ...spec,
    groups: undefined,
  });

  const { loginName, groups } = spec;
  if (groups) {
    aMap(parseUserGroupsList(groups), function (member, group) {
      res.needs('osUserGroupMembership', { user: loginName, group, member });
    });
  }

  return res;
}



export default {
  plan: planOsUser,
};
