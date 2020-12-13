// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';


function capitalize(s) { return s.slice(0, 1).toUpperCase() + s.slice(1); }

const key = 'inheritOwnerWithin';

function chk(spec) {
  if (!spec) { return spec; }
  const splat = String(spec.path || '').split(/(?:^|\s+)§=>\s+/);
  const nParts = splat.length;
  if (nParts === 1) { return spec; }
  if (nParts !== 2) {
    throw new Error(`Too many ${key} separators in path`);
  }
  if (spec[key] !== undefined) {
    const msg = (key + ' may be set either explicitly or via separator syntax,'
      + ' but not both in the same spec.');
    throw new Error(msg);
  }
  const [origWithinSpec, sub] = splat;
  let within = (origWithinSpec || './');
  const dividedAtSlash = (within.endsWith('/') || sub.startsWith('/'));
  if (!dividedAtSlash) {
    throw new Error(`${key} separater can only be used between directories`);
  }
  const relTo = spec[key + 'RelativeTo'];
  // console.error('inhOwn:', { path: src.path, relTo, within });
  if (relTo) {
    within = pathLib.resolve('/proc/ERR_BOGUS_PATH', relTo, '..', within);
    within = pathLib.normalize(within);
  }
  return { path: origWithinSpec + sub, [key]: within };
}


Object.assign(chk, {
  scopeKey: key,
  tgtScopeKey: 'target' + capitalize(key),
  updateInplace(spec) { return Object.assign(spec, chk(spec)); },
});

export default chk;
