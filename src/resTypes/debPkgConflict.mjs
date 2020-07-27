// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType';

import origResType from './debPkg';

export default preCfg(origResType, { state: 'absent' });
