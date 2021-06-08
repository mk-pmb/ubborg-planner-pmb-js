// -*- coding: utf-8, tab-width: 2 -*-

import makeUipDb from './uniqueIndexPropsDb.mjs';


function makeToplevelContext() {
  const resPlanPrsByTypeName = Object.create(null);
  const topCtx = {
    getResPlanPrByTypeName() { return resPlanPrsByTypeName; },
    traceParents() { return []; },
    pendingResPlanPromises: new Map(),
    resByUniqueIndexProp: makeUipDb(),
  };
  return topCtx;
}


export default makeToplevelContext;
