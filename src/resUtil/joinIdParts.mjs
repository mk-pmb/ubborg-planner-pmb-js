// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';

import specialChars from '../specialChars';
import describeType from '../describeType';

function joinIdParts(p, i) {
  if (i.map) {
    return i.map(k => joinIdParts(p, k)).join(specialChars.idPropListSep);
  }
  const v = p[i];
  if (is.fin(v) && is.int(v)) { return String(v); }
  if (is.str(v) && v) { return v; }
  const e = `Unsupported resource ID type ${describeType(v)} in prop ${i}`;
  throw new TypeError(e);
}


export default joinIdParts;
