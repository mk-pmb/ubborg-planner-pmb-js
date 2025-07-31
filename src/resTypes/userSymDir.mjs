// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType.mjs';

import origResType from './userFile.mjs';

export default preCfg(origResType, { mimeType: 'sym', targetMimeType: 'dir' });
