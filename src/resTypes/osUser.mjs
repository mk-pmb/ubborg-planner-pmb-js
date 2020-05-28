// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';

import osUserLogin from './osUserLogin';

const recipe = {
  typeName: 'osUser',
  idProps: ['loginName'],
  defaultProps: {
    ...osUserLogin.recipe.defaultProps,
    primaryGroupName: true,
  },
  acceptProps: {
    ...osUserLogin.recipe.acceptProps,
    groups: true,
    homonymousGroupIdNum: true,
  },
  uniqueIndexProps: [
    ...osUserLogin.recipe.uniqueIndexProps,
  ],
};

const spawnCore = spRes.makeSpawner(recipe);

async function planOsUser(spec) {
  const { loginName } = spec;
  const res = await spawnCore(this, { loginName });
  const login = {
    ...spec,
    groups: undefined,
    homonymousGroupIdNum: undefined,
  };

  const prGrName = spec.primaryGroupName;
  if (prGrName === true) { login.primaryGroupName = loginName; }

  const homGrIdNum = spec.homonymousGroupIdNum;
  if (homGrIdNum) {
    res.needs('osUserGroup', { grName: loginName, homGrIdNum });
    if (prGrName === undefined) { login.primaryGroupName = loginName; }
  }

  res.needs('osUserLogin', login);

  const { groups } = spec;
  if (groups) {
    const memberships = parseUserGroupsList(groups);
    await pProps(memberships, function setMembership(member, grName) {
      return res.needs('osUserGroupMembership',
        { loginName, grName, member });
    });
  }

  return res;
}



export default {
  recipe,
  plan: planOsUser,
};
