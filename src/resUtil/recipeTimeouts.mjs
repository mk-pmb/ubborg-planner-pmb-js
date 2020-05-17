// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import isFun from 'is-fn';
import mustBe from 'typechecks-pmb/must-be';
import prTimeoutWarn from '@instaffogmbh/promise-timeout-with-warning';

const mustBePosNum = mustBe('pos num');
const tmoKeyRgx = /^\S+(?=TimeoutSec$)/;

function tmoKeyTaskName(key) {
  const m = tmoKeyRgx.exec(key);
  return (m && { key, taskName: m[0] });
}


function copyRecipeTimeouts(vanillaRecipe, popper) {
  const vnlTimeoutTaskNames = Object.keys(vanillaRecipe)
    .map(tmoKeyTaskName).filter(Boolean);
  const accum = {};
  function copy(m) { accum[m.taskName] = mustBePosNum(m.key, popper(m.key)); }
  vnlTimeoutTaskNames.forEach(copy);
  return accum;
}


function makeResMtdTimeoutProxifier(res) {
  const customPtww = prTimeoutWarn.cfg({
    subj: String(res),
    vErr: true,
    warn: false,
    fail: '10 sec',
  }, res.getTypeMeta().timeouts);

  function makeTimeoutProxy(mtdName, opt) {
    if (!opt) { return makeTimeoutProxy(mtdName, true); }
    const impl = (opt.impl || res[mtdName]);
    function timeoutProxy(...args) {
      return customPtww(impl.apply(res, args), mtdName);
    }
    return timeoutProxy;
  }

  Object.assign(makeTimeoutProxy, {

    mapFuncs(orig) {
      const proxied = {};
      aMap(orig, function installProxy(impl, mtdName) {
        if (!isFun(impl)) { return; }
        // ^-- So derived resTypes can easily hide methods by null-ing them.
        proxied[mtdName] = makeTimeoutProxy(mtdName, { impl });
      });
      return proxied;
    },

  });

  return makeTimeoutProxy;
}


export default {
  copy: copyRecipeTimeouts,
  makeResMtdTimeoutProxifier,
};
