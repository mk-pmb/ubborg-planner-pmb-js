// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';
import is from 'typechecks-pmb';

import spRes from '../resUtil/simplePassiveResource';
import parseUserGroupsList from '../parseUserGroupsList';

import osUserLogin from './osUserLogin';


async function setupSshAuthKeys(res) {
  const facts = await res.toFactsDict({ acceptPreliminary: true });
  const loginName = res.id;
  const { homeDirPath } = facts;
  let keys = facts.sshAuthKeys;
  if (!is.str(keys)) {
    if (!keys) { return; }
    if (is.dictObj(keys)) {
      keys = keys.map(([k, v]) => (k && v && `${v} ${k}`));
    }
    if (is.ary(keys)) { keys = keys.filter(Boolean).map(k => k + '\n'); }
  }
  if (!homeDirPath) {
    throw new Error('homeDirPath is required to set up SSH authorized_keys!');
  }

  function homeSubDir(sub, props) {
    return res.needs('file', {
      path: homeDirPath + sub,
      mimeType: 'dir',
      enforcedOwner: loginName,
      enforcedGroup: loginName,
      enforcedModes: 'a=rx,ug+w',
      ...props,
    });
  };
  await homeSubDir('');
  await homeSubDir('/.config');
  await homeSubDir('/.config/ssh');
  await homeSubDir('/.ssh', { mimeType: 'sym', content: '.config/ssh' });
  await homeSubDir('/.config/ssh/authorized_keys', {
    mimeType: 'text/plain',
    enforcedModes: 'a=,u+rw',
    content: keys,
  });
}

async function hatch(initExtras) {
  const res = this;
  const loginName = res.id;
  const { spec } = initExtras.spawnOpt;

  const osLogin = {
    ...spec,
    groups: undefined,
    homonymousGroupIdNum: undefined,
    sshAuthKeys: undefined,
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

  await setupSshAuthKeys(res);
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
  uniqueIndexProps: [
    ...osUserLogin.recipe.uniqueIndexProps,
  ],
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = spRes.makeSpawner(recipe);

async function planOsUser(spec) {
  const { loginName } = spec;
  return spawnCore(this, { loginName }, { spec });
}



export default {
  recipe,
  plan: planOsUser,
};
