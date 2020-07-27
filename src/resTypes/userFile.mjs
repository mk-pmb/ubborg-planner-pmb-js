// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType';

import origResType from './file';

export default preCfg(origResType, {
  enforcedModes: 'a-x,a=rX,ug+w', // a-x ensures X only matches directories
}, function parse(spec) {
  const { owner } = spec;
  return {
    enforcedOwner: owner,
    enforcedGroup: owner,
    owner: undefined,
  };
});
