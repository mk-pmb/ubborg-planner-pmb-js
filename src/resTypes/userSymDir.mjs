// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from '../resUtil/preconfiguredResType';
import origResType from './userFile';

export default preCfg(origResType, { mimeType: 'sym', targetMimeType: 'dir' });