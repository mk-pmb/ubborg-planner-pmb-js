// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import getOwn from 'getown';
import sysFactsHelper from 'ubborg-sysfacts-helper-pmb';

import fileGeneratedHint from '../resUtil/fileGeneratedHint';
import spRes from '../resUtil/simplePassiveResource';
import claimStageFacts from '../resUtil/bundle/claimStageFacts';


const deferUpdProp = 'deferPkgListUpdate';

function rewriteUrlProtos(origUrl) {
  let u = mustBe.nest('URL', origUrl);

  u = u.replace(/^ppa:(\S+)/, 'http://ppa.launchpad.net/$1/%{distro}');
  // Why no SSL? -> https://bugs.launchpad.net/launchpad/+bug/1473091
  // Discussion of possible attack vectors against unencrypted
  // downloading of signed packages:
  // https://github.com/nodesource/distributions/issues/71
  // (2020-07-05: Mostly, hiding new updates for as long as the
  // old signature is still valid.)

  return u;
}


async function hatch() {
  const res = this;

  const renderOVT = await (async function compile() {
    const t = 'osVersion';
    const d = await sysFactsHelper.mtd(res, t)();
    const r = /%\{([\w\-]+)\}/g;
    function w(m, k) { return m && mustBe.nest(`${t}.${k}`, getOwn(d, k)); }
    return function renderOsVersionTemplate(s) { return s.replace(r, w); };
  }());

  const mustFact = mustBe.tProp(res.typeName + ' prop ',
    await res.toFactsDict({ acceptPreliminary: true }));
  const debLines = [fileGeneratedHint('# ', '\n')];
  const dists = mustFact('nonEmpty ary', 'dists');
  const isFlatRepo = ((dists.length === 1) && (dists[0] === '/'));
  const compo = (mustFact(isFlatRepo ? 'undef' : 'nonEmpty ary',
    'components') || []);
  const src = mustFact('bool', 'src');
  mustFact('nonEmpty ary', 'debUrls').map(rewriteUrlProtos).forEach((url) => {
    mustBe.near('dists', dists).forEach((dist) => {
      mustBe.nest('dist', dist);
      const debLn = renderOVT([url, dist, ...compo].join(' ') + '\n');
      debLines.push('deb     ' + debLn);
      if (src) { debLines.push('deb-src ' + debLn); }
    });
  });

  await res.needs('admFile', {
    path: `/etc/apt/sources.list.d/ubborg.${res.id}.list`,
    mimeType: 'text/plain',
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
    dists: ['%{codename}'],
  },
  acceptProps: {
    debUrls: true,
    components: true,
    primaryKeyId: true,

    keyUrl: true,
    keyVerify: true,
  },
  promisingApi: {
    hatch,
    finalizePlan,
  },
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;

const simpleStates = [
  recipe.defaultProps.state,
  'absent',
];




async function plan(origSpec) {
  const spec = normalizeProps(origSpec);
  const { state } = spec;
  mustBe([['oneOf', [undefined, ...simpleStates]]], 'state')(state);
  const res = await baseSpawner(this, spec);
  return res;
}


export default {
  normalizeProps,
  plan,
  recipe,
};
