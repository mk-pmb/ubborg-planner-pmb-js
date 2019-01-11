// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';


function pugl(x) {
  if (!x) { return {}; }
  if (is.str(x)) { return { [x]: true }; }
  if (is.ary(x)) { return Object.assign({}, ...x.map(pugl)); }
  if (is.obj(x)) { return x; }
  return {};
}


export default pugl;
