// -*- coding: utf-8, tab-width: 2 -*-

import file from './file';

function plan(spec) {
  const { owner } = spec;
  return file.plan.call(this, {
    enforcedOwner: owner,
    enforcedGroup: owner,
    enforcedModes: 'a=r,ug+w',
    ...spec,
    owner: undefined,
  });
}

export default { plan };
