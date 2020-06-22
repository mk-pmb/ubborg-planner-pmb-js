// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';

import nodeModuleMeta from '../../package.json';
import spRes from '../resUtil/simplePassiveResource';
import claimStageFacts from '../resUtil/bundle/claimStageFacts';



const deferUpdProp = 'deferPkgListUpdate';


async function hatch() {
  const res = this;
  const path = '/etc/apt/sources.list.d/ubborg.' + res.id + '.list';
  const facts = await res.toFactsDict({ acceptPreliminary: true });

  const debLines = ['# generated by ' + nodeModuleMeta.name + '\n'];
  const { urls, dists, components, src } = facts;
  mustBe.near('components', components);
  mustBe.bool('src', src);
  mustBe.near('urls', urls).forEach((origUrl) => {
    let url = mustBe.nest('URL', origUrl);
    if (url.startsWith('ppa:')) { url = ''; }
    mustBe.near('dists', dists).forEach((dist) => {
      mustBe.nest('dist', dist);
      const debLn = [url, dist, ...components].join(' ') + '\n';
      debLines.push('deb     ' + debLn);
      if (src) { debLines.push('deb-src ' + debLn); }
    });
  });

  await res.needs('file', {
    path,
    mimeType: 'text/plain',
    enforcedOwner: 'root',
    enforcedGroup: 'adm',
    enforcedModes: 'a=r,ug+w',
    content: debLines,
  });
}



async function finalizePlan(initExtras) {
  await claimStageFacts(initExtras, function claims(facts) {
    if (!facts[deferUpdProp]) { return; }
    return { deferredDebPkgs: { updatePkgLists: true } };
  });
}


const recipe = {
  typeName: 'debPkgRepo',
  idProps: ['name'],
  defaultProps: {
    state: 'enabled',
    [deferUpdProp]: true,
    src: true,    // whether to add deb-src as well.
  },
  acceptProps: {
    urls: true,
    dists: true,
    components: true,
    primaryKeyId: true,
    keyData: true,
  },
  promisingApi: {
    hatch,
    finalizePlan,
  },
};

const spawnCore = spRes.makeSpawner(recipe);

const simpleStates = [
  recipe.defaultProps.state,
  'absent',
];


async function plan(spec) {
  if (is.str(spec)) { return plan.call(this, { name: spec }); }
  const { state } = spec;
  mustBe([['oneOf', [undefined, ...simpleStates]]], 'state')(state);
  const res = await spawnCore(this, spec);
  return res;
}


export default {
  plan,
  recipe,
};
