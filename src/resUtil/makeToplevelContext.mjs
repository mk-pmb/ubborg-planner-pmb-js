// -*- coding: utf-8, tab-width: 2 -*-


function makeToplevelContext() {
  const resourcesByTypeName = Object.create(null);
  const topCtx = {
    getResourcesByTypeName() { return resourcesByTypeName; },
    traceParents() { return []; },
    pendingResPlanPromises: new Map(),
  };
  return topCtx;
}


export default makeToplevelContext;
