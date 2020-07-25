// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import stage from './stage';


const hooksByType = {
  stage,
};


function resHook(resType, event, arg) {
  const f = getOwn(getOwn(hooksByType, resType), event);
  return (f && f(arg));
}


Object.assign(resHook, {
  byType: hooksByType,
});
export default resHook;
