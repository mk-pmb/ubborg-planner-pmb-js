// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';

import specialChars from '../specialChars';
import describeType from '../describeType';

function joinIdParts(i, p) {
  if (!(i || false).length) { throw new Error('idProp cannot be empty'); }
  if (i.map) {
    return i.map(k => joinIdParts(k, p)).join(specialChars.idPropListSep);
  }
  const v = (is.fun(p) ? p(i) : p[i]);
  if (is.fin(v) && is.int(v)) { return String(v); }
  if (is.str(v) && v) { return v.replace(/\S+/g, encodeURI); }
  const e = `Unsupported resource ID type ${describeType(v)} in prop ${i}`;
  throw new TypeError(e);
}


export default joinIdParts;
