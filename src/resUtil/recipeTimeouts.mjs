// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import isFun from 'is-fn';
import mustBe from 'typechecks-pmb/must-be';
import prTimeoutWarn from '@instaffogmbh/promise-timeout-with-warning';

const globalTimeoutFactor = (+process.env.UBBORG_TIMEOUT_FACTOR || 1);

const recipeTmoKey = 'apiTimeoutsSec';

function makeResMtdTimeoutProxifier(res) {
  const subj = String(res);
  const apiTmo = mustBe.prop(res.getTypeMeta(), 'dictObj', recipeTmoKey);
  const customPtww = prTimeoutWarn.cfg({
    subj,
    vErr: true,
    warn: false,
    fail: '10 sec',
  });

  function makeTimeoutProxy(mtdName, opt) {
    if (!opt) { return makeTimeoutProxy(mtdName, true); }
    const impl = (opt.impl || res[mtdName]);
    const tmo = (+apiTmo[mtdName] || 0);
    const ovr = ((tmo > 0) && { fail: `${tmo * globalTimeoutFactor} sec` });
    function timeoutProxy(...args) {
      return customPtww(impl.apply(res, args), mtdName, ovr);
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
  recipeTmoKey,
  globalTimeoutFactor,
  makeResMtdTimeoutProxifier,
};
