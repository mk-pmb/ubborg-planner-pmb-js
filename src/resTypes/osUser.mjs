// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';

import spRes from '../resUtil/simplePassiveResource/index.mjs';
import parseUserGroupsList from '../parseUserGroupsList.mjs';

import osUserLogin from './osUserLogin.mjs';
import sshAuthKeys from '../resUtil/osUser/sshAuthKeys.mjs';


async function hatch(initExtras) {
  const res = this;
  const loginName = res.id;
  const { spec } = initExtras.spawnOpt;
  const facts = await res.toFactsDict({ acceptPreliminary: true });

  const osLogin = {
    loginName,
    ...facts,
  };

  const homGrIdNum = spec.homonymousGroupIdNum;
  if (homGrIdNum) {
    await res.needs('osUserGroup', { grName: loginName, grIdNum: homGrIdNum });
    if (osLogin.primaryGroupName === undefined) {
      osLogin.primaryGroupName = loginName;
    }
  }

  await res.needs('osUserLogin', osLogin);

  const { groups } = spec;
  if (groups) {
    const memberships = parseUserGroupsList(groups);
    await pProps(memberships, function setMembership(member, grName) {
      return res.needs('osUserGroupMembership',
        { loginName, grName, member });
    });
  }

  await sshAuthKeys.mixin(res, {
    ownerLoginName: loginName,
    ownerGroupName: osLogin.primaryGroupName,
    ...facts,
    ...spec,
  });
}


const recipe = {
  typeName: 'osUser',
  idProps: ['loginName'],
  defaultProps: {
    ...osUserLogin.recipe.defaultProps,
  },
  acceptProps: {
    ...osUserLogin.recipe.acceptProps,
    groups: true,
    homonymousGroupIdNum: true,
    sshAuthKeys: true,
  },
  uniqueIndexProps: [],
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = spRes.makeSpawner(recipe);

function planOsUser(spec) {
  return spawnCore(this, {
    ...spec,
    groups: undefined,
    homonymousGroupIdNum: undefined,
    sshAuthKeys: undefined,
  }, { spec });
}

export default {
  recipe,
  plan: planOsUser,
};
