// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import bunUrls from 'ubborg-bundleurl-util-pmb';


async function impDf(spec) { return (await import(spec)).default; }


const slim = async function slashableImport(spec) {
  let origErr;
  try { return await impDf(spec); } catch (err) { origErr = err; }
  if (spec.endsWith('/')) {
    try {
      return await impDf(pathLib.join(spec, '__main__'));
    } catch (ignore) { /* ignore */ }
    try {
      return await impDf(pathLib.join(spec, pathLib.basename(spec)));
    } catch (ignore) { /* ignore */ }
  }
  throw origErr;
};

Object.assign(slim, {

  fromBundleUrl(url) { return slim(bunUrls.toModuleId(bunUrls.href(url))); },

});

export default slim;
