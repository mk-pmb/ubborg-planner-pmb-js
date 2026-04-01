// -*- coding: utf-8, tab-width: 2 -*-

import spChars from 'ubborg-restype-util-pmb/src/specialChars.mjs';

import makeUipDb from './uniqueIndexPropsDb.mjs';

const arrConcat = Array.prototype.concat;


const EX = function makeToplevelContext() {
  const resPlanPrsByTypeName = Object.create(null);
  const topCtx = {
    getResPlanPrByTypeName() { return resPlanPrsByTypeName; },
    parentStage: null,
    pendingResPlanPromises: new Map(),
    resByUniqueIndexProp: makeUipDb(),
    traceParents() { return EX.emptyParentsStack; },
  };
  return topCtx;
};

EX.parentsStackApi = {
  bless(x) { return Object.assign(x, EX.parentsStackApi); },
  concat(...args) { return this.bless(arrConcat.apply(this, args)); },
  toString() { return this.join(spChars.wideChainLinks.fwd); },
};
EX.emptyParentsStack = Object.freeze(EX.parentsStackApi.bless([]));


export default EX;
