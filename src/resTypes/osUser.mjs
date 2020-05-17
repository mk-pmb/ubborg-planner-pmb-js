// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';

import osUserLogin from './osUserLogin';

const recipe = {
  typeName: 'osUser',
  idProp: 'loginName',
  defaultProps: {
    ...osUserLogin.recipe.defaultProps,
  },
  acceptProps: {
    ...osUserLogin.recipe.acceptProps,
    groups: true,
    homonymousGroupIdNum: true,
  },

  api: {
    async hatch() {
      const res = this;
      const { loginName, groups } = res.props;
      if (groups) {
        const memberships = parseUserGroupsList(groups);
        await pProps(memberships, function setMembership(member, grName) {
          return res.needs('osUserGroupMembership',
            { loginName, grName, member });
        });
      }
    },
  },

};

const spawnCore = spRes.makeSpawner(recipe);

async function planOsUser(spec) {
  const { loginName } = spec;
  const res = await spawnCore(this, { loginName });
  res.needs('osUserLogin', {
    ...spec,
    groups: undefined,
    homonymousGroupIdNum: undefined,
  });

  const grIdNum = spec.homonymousGroupIdNum;
  if (grIdNum) { res.needs('osUserGroup', { grName: loginName, grIdNum }); }

  return res;
}



export default {
  recipe,
  plan: planOsUser,
};
