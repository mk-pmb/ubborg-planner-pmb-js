// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';

const spawnCore = spRes.makeSpawner({
  typeName: 'osUser',
  idProp: 'loginName',
  defaultProps: {},
  acceptProps: {},

  api: {
    async hatch(props) {
      const res = this;
      const { loginName, groups } = props;
      if (groups) {
        const memberships = parseUserGroupsList(groups);
        await pProps(memberships, function setMembership(member, grName) {
          res.needs('osUserGroupMembership',
            { loginName, grName, member });
        });
      }
    },
    // finalizePlan() { return this.hatchedPr; },
  },

});


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
  plan: planOsUser,
};
