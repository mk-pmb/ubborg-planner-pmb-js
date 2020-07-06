// -*- coding: utf-8, tab-width: 2 -*-

import debPkg from './debPkg';

function plan(spec) {
  return debPkg.plan.call(this, {
    ...debPkg.normalizeProps(spec),
    state: 'absent',
  });
}

export default { plan };
