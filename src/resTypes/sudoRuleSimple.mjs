// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


async function hatch(initExtras) {
  const res = this;
  const originator = res.id;
  const facts = {
    ...res.getTypeMeta().defaultProps,
    ...initExtras.props,
  };
  await res.needs('file', {
    exists: true,
    path: '/etc/sudoers.d/' + (originator.startsWith('%')
      ? 'group_' + originator.slice(1)
      : 'user_' + originator),
    forceOwner: 'root',
    forceGroup: 'root',
    forceModes: 'a=,ug+r',
    content: [
      originator,
      facts.hosts,
      '=',
      '(' + facts.runAsUsers + ':' + facts.runAsGroups + ')',
      (facts.askPassword ? '' : 'NOPASSWD:'),
      facts.runCmds,
    ].join(' ') + '\n',
  });
}


const recipe = {
  typeName: 'sudoRuleSimple',
  idProps: ['originator'],
  defaultProps: {
    hosts: 'ALL',
    runAsUsers: 'ALL',
    runAsGroups: 'ALL',
    runCmds: 'ALL',
    askPassword: true,
  },
  acceptProps: {
  },
  api: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = spRes.makeSpawner(recipe);

async function planOsUser(spec) {
  const res = await spawnCore(this, spec);
  return res;
}



export default {
  recipe,
  plan: planOsUser,
};
