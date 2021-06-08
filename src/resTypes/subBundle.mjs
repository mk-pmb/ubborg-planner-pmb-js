// -*- coding: utf-8, tab-width: 2 -*-

import bundle from './bundle.mjs';

function plan(spec, opt, ...extra) {
  return bundle.plan.call(this, spec, { ...opt, ensureParentUrlTrail: '/' },
    extra);
}

export default { plan };
