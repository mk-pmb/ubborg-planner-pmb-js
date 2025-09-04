// -*- coding: utf-8, tab-width: 2 -*-

import makeUipDb from './uniqueIndexPropsDb.mjs';


function makeToplevelContext() {
  const resPlanPrsByTypeName = Object.create(null);
  const topCtx = {
    getResPlanPrByTypeName() { return resPlanPrsByTypeName; },
    pendingResPlanPromises: new Map(),
    resByUniqueIndexProp: makeUipDb(),
    traceParents() { return []; },
  };
  return topCtx;
}


export default makeToplevelContext;
