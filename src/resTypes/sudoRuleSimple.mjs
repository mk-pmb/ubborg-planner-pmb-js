// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


async function hatch() {
  const res = this;
  const originator = res.id;
  const path = ('/etc/sudoers.d/' + (originator.startsWith('%')
    ? 'group_' + originator.slice(1)
    : 'user_' + originator));
  const facts = await res.toFactsDict({ acceptPreliminary: true });
  await res.needs('file', {
    path,
    mimeType: 'text/plain',
    enforcedOwner: 'root',
    enforcedGroup: 'root',
    enforcedModes: 'a=,ug+r',
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
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
};

const spawnCore = spRes.makeSpawner(recipe);




export default {
  recipe,
  plan(spec) { return spawnCore(this, spec); },
};
