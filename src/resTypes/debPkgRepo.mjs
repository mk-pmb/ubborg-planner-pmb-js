// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import spRes from '../resUtil/simplePassiveResource';
import claimStageFacts from '../resUtil/bundle/claimStageFacts';
import compileOsVerTpl from '../resUtil/debPkg/compileOsVersionTemplate';
import rewriteUrlProtos from '../resUtil/debPkg/rewriteUrlProtos';
import renderDebLines from '../resUtil/debPkg/renderDebLines';
import maybeDownloadGpgKey from '../resUtil/debPkg/maybeDownloadGpgKey';


const deferUpdProp = 'deferPkgListUpdate';


async function hatch(initExtras) {
  const res = this;
  const mustFact = mustBe.tProp(res.typeName + ' prop ',
    await res.toFactsDict({ acceptPreliminary: true }));
  const renderCtx = {
    resId: res.id,
    mustFact,
    renderOVT: await compileOsVerTpl(res),
    repoUrlTpls: mustFact('nonEmpty ary', 'debUrls').map(rewriteUrlProtos),
  };

  await res.needs('admFile', {
    path: `/etc/apt/sources.list.d/ubborg.${res.id}.list`,
    mimeType: 'text/plain',
    content: await renderDebLines(renderCtx),
  });

  renderCtx.parBun = initExtras.getLineageContext().parentBundle;
  const setupGpgKey = ((await maybeDownloadGpgKey(renderCtx))
    || false);

  await (setupGpgKey && res.needs('admFile', {
    path: `/etc/apt/trusted.gpg.d/ubborg.${res.id}.asc`,
    mimeType: 'text/plain',
    ...setupGpgKey,
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
    state: 'enabled',
    [deferUpdProp]: true,
    src: true,    // whether to add deb-src as well.
    dists: ['%{codename}'],
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
