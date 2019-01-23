// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';

function hook(obj, evName, ...args) {
  const hnd = obj['on' + evName];
  if (!hnd) { return false; }
  if (is.fun(hnd)) { return hnd.apply(obj, args); }
  const err = `Handler for event ${evName} must be false-y or a function`;
  throw new Error(err);
}

export default hook;
