// -*- coding: utf-8, tab-width: 2 -*-

const key = 'inheritOwnerWithin';

function chk(spec) {
  if (!spec) { return spec; }
  const splat = String(spec.path || '').split(/\s+§=>\s+/);
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
  const [within, sub] = splat;
  return { path: within + sub, [key]: within };
}


Object.assign(chk, {
  updateInplace(spec) { return Object.assign(spec, chk(spec)); },
});

export default chk;
