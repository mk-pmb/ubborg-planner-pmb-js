// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

async function impDf(spec) { return (await import(spec)).default; }

async function slashableImport(spec) {
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
}

export default slashableImport;
