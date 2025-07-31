// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType.mjs';

import origResType from './debPkg.mjs';

export default preCfg(origResType, { state: 'absent' });
