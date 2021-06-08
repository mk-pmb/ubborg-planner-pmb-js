// -*- coding: utf-8, tab-width: 2 -*-

import nodeUrlLib from 'url';

import rewriteUrlProtos from './rewriteUrlProtos.mjs';


function makeRelativeUrlResolver(base) {
  const { URL } = nodeUrlLib;
  return function resolve(href) { return String(new URL(href, base)); };
}


function maybeDownloadGpgKey(renderCtx) {
  const {
    resId,
    mustFact,
    repoUrlTpls,
    renderOVT,
    parBun,
  } = renderCtx;
  let keyUrls = mustFact('undef | nul | nonEmpty ary', 'keyUrls');
  if (keyUrls === undefined) { keyUrls = [`file+bun://${resId}.gpg-key.txt`]; }

  const veri = mustFact('undef | obj', 'keyVerify');
  if (!keyUrls) { return; }
  const resolve = makeRelativeUrlResolver(renderOVT(repoUrlTpls[0]));
  keyUrls = keyUrls.map(rewriteUrlProtos).map(renderOVT).map(resolve);

  const fileHow = {};
  const keySrcPath = parBun.relBunUrlToAbsPath(keyUrls[0],
    { ifUnsupported: null });
  if (keySrcPath) {
    fileHow.uploadFromLocalPath = keySrcPath;
    keyUrls.shift();
  }

  if (keyUrls.length) {
    if (!veri) {
      const err = 'No validation configured for GPG key URL ' + keyUrls[0];
      throw new Error(err);
    }
    fileHow.downloadUrls = keyUrls;
  }

  if (veri) { fileHow.verifyContent = veri; }

  return fileHow;
}


export default maybeDownloadGpgKey;
