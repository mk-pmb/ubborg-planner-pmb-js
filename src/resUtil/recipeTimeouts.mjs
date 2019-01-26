// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import flexiTimeout from 'callback-timeout-flexible';
import minExitCode from 'process-exitcode-atleast';

const mustBePosNum = mustBe('pos num');
const tmoKeyRgx = /^(\S+)TimeoutSec$/;


function copyRecipeTimeouts(vanillaRecipe, popper) {
  const accum = {};
  Object.keys(vanillaRecipe).forEach(function copyOneTimeout(key) {
    const m = tmoKeyRgx.exec(key);
    if (!m) { return; }
    const action = m[1];
    accum[action] = mustBePosNum(key, popper(key));
  });
  return accum;
}


function timeoutFailCb(err) {
  if (!err) { throw new Error('Unexpected success'); }
  console.error(err.message || err);
  minExitCode(51);
}


function startRecipeTimeoutTimer(res, task) {
  const name = String(res) + '!' + task;
  const sec = res.getTypeMeta().timeoutsSec[task];
  mustBePosNum('timeout for ' + name, sec);
  const cb = flexiTimeout(timeoutFailCb, {
    limitSec: sec,
    name,
    errMsg: 'Timeout exceeded for \v{name}',
  });
  const tco = cb.timeout;
  return tco;
}


export default {
  copy: copyRecipeTimeouts,
  startTimer: startRecipeTimeoutTimer,
};
