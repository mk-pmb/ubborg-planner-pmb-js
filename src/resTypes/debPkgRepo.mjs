// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import spRes from '../resUtil/simplePassiveResource';
import claimStageFacts from '../resUtil/bundle/claimStageFacts';
import compileOsVerTpl from '../resUtil/debPkg/compileOsVersionTemplate';
import rewriteUrlProtos from '../resUtil/debPkg/rewriteUrlProtos';
import renderDebLines from '../resUtil/debPkg/renderDebLines';
import maybeDownloadGpgKey from '../resUtil/debPkg/maybeDownloadGpgKey';


const deferUpdProp = 'deferPkgListUpdate';
const defaultState = 'enabled';
const simpleStates = [
  defaultState,
  'disabled',
  'absent',
];


async function hatch(initExtras) {
  const res = this;
  const mustFact = mustBe.tProp(res.typeName + ' prop ',
    await res.toFactsDict({ acceptPreliminary: true }));
  const state = mustFact([['oneOf', simpleStates]], 'state');

  const listPath = `/etc/apt/sources.list.d/ubborg.${res.id}.list`;
  const keyPath = `/etc/apt/trusted.gpg.d/ubborg.${res.id}.asc`;

  if (state === 'absent') {
    await res.needs('file', { path: keyPath, mimeType: null });
    await res.needs('file', { path: listPath, mimeType: null });
    return;
  }

  const renderCtx = {
    resId: res.id,
    mustFact,
    renderOVT: await compileOsVerTpl(res),
    repoUrlTpls: mustFact('nonEmpty ary', 'debUrls').map(rewriteUrlProtos),
    repoEnabled: (state === defaultState),
  };


  await res.needs('admFile', {
    path: listPath,
    mimeType: 'text/plain',
    content: await renderDebLines(renderCtx),
  });

  renderCtx.parBun = initExtras.getLineageContext().parentBundle;
  const setupGpgKey = ((await maybeDownloadGpgKey(renderCtx))
    || false);

  await (setupGpgKey && res.needs('file', {
    path: keyPath,
    mimeType: 'text/plain',
    ...setupGpgKey,
    enforcedOwner: 'root',
    enforcedGroup: 'root',
    enforcedModes: 'a=r',
  }));
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
    state: defaultState,
    [deferUpdProp]: true,
    src: true,    // whether to add deb-src as well.
    dists: ['%{codename}'],
    archs: null,
  },
  acceptProps: {
    debUrls: true,
    components: true,
    primaryKeyId: true,

    keyFileRelUrl: true,
    keyUrls: true,
    keyVerify: true,
  },
  promisingApi: {
    hatch,
    finalizePlan,
  },
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;




async function plan(origSpec) {
  const spec = normalizeProps(origSpec);
  const res = await baseSpawner(this, spec);
  return res;
}


export default {
  normalizeProps,
  plan,
  recipe,
};
