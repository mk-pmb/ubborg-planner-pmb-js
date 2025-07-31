// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';

import mtAlias from './mimeAlias.mjs';


const when = ' (when used with symlink arrow notation)';

function und(o, k) { mustBe('undef', k + when)(k[o]); }

function chk(spec) {
  const sym = spec.path.split(/\s+=\->\s+/);
  if (sym.length !== 2) { return null; }
  und(spec, 'content');
  und(spec, 'mimeType');
  const [path, content] = sym;
  return { path, content, mimeType: mtAlias.sym };
}


Object.assign(chk, {
  updateInplace(spec) { return Object.assign(spec, chk(spec)); },
});

export default chk;
