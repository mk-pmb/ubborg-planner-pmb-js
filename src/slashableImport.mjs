// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';


async function relImport(spec) {
  const path = pathLib.resolve(spec);
  return (await import(path)).default;
}


async function slashableImport(spec) {
  let origErr;
  try { return await relImport(spec); } catch (err) { origErr = err; }
  if (spec.endsWith('/')) {
    try {
      return await relImport(pathLib.join(spec, '__main__'));
    } catch (ignore) { /* ignore */ }
    try {
      return await relImport(pathLib.join(spec, pathLib.basename(spec)));
    } catch (ignore) { /* ignore */ }
  }
  throw origErr;
}


export default slashableImport;
