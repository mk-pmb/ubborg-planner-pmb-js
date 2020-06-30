// -*- coding: utf-8, tab-width: 2 -*-

import file from './file';

function plan(spec) {
  return file.plan.call(this, {
    enforcedOwner: 'root',
    enforcedGroup: 'adm',
    enforcedModes: 'a-x,a=rX,ug+w', // a-x ensures X only matches directories
    ...spec,
  });
}

export default { plan };
