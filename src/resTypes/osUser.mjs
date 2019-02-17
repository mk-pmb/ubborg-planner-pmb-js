// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';


const spawnCore = spRes.makeSpawner({
  typeName: 'osUser',
  idProp: 'loginName',
  defaultProps: {
    system: false,
    locked: false,
    fullName: '',
  },
  acceptProps: {
    userIdNum: true,
    passwordHash: true,
  },
});


async function planOsUser(spec) {
  const res = await spawnCore(this, {
    ...spec,
    groups: undefined,
  });

  const { loginName, groups } = spec;
  if (groups) {
    aMap(parseUserGroupsList(groups), (member, grName) => {
      res.needs('osUserGroupMembership', { loginName, grName, member });
    });
  }

  return res;
}



export default {
  plan: planOsUser,
};
