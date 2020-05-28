// -*- coding: utf-8, tab-width: 2 -*-

import makeUipDb from './uniqueIndexPropsDb';


function makeToplevelContext() {
  const resourcesByTypeName = Object.create(null);
  const topCtx = {
    getResourcesByTypeName() { return resourcesByTypeName; },
    traceParents() { return []; },
    pendingResPlanPromises: new Map(),
    resByUniqueIndexProp: makeUipDb(),
  };
  return topCtx;
}


export default makeToplevelContext;
