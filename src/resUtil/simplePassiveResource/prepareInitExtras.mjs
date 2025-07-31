// -*- coding: utf-8, tab-width: 2 -*-

import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import getOwn from 'getown';
import joinIdParts from 'ubborg-restype-util-pmb/src/joinIdParts.mjs';


function prepareInitExtras(ourPlanPr, spawnExtras) {
  const {
    typeMeta,
    api,
    lineageCtx,
    origPropSpec,
    spawnOpt,
    forkLinCtxImpl,
  } = spawnExtras;
  if (lineageCtx.getTypeMeta) {
    throw new Error('A lineage context should not have a getTypeMeta.');
  }

  const { name: typeName, idProps } = typeMeta;
  const normalizedProps = typeMeta.normalizeProps(origPropSpec);
  const id = vTry(joinIdParts, 'construct ID for ' + typeName)(idProps, {
    ...typeMeta.defaultProps,
    ...normalizedProps,
  });
  if (idProps.length === 1) { delete normalizedProps[idProps[0]]; }

  const res = {
    typeName,
    id,
    getTypeMeta() { return typeMeta; },
    traceParents: lineageCtx.traceParents,
    customProps: null, // res.incubate() will overwrite this.
    ...api.direct,
    ...lineageCtx.resByUniqueIndexProp.makeTypeApi(typeName),
    spawning: 'really soon now',
  };

  const sameTypePlanPrs = goak(lineageCtx.getResPlanPrByTypeName(),
    typeName, '{null}');
  const origPlanPr = getOwn(sameTypePlanPrs, id);
  const isDupe = !!origPlanPr;
  if (!isDupe) { sameTypePlanPrs[id] = ourPlanPr; }

  const initExtras = {
    getRes() { return res; }, // in cases where "this" is inconvenient
    isDupe,
    origPlanPr,
    getLineageContext() { return lineageCtx; },
    forkLineageContext: forkLinCtxImpl.bind(res, lineageCtx),
    origPropSpec,
    normalizedProps,
    spawnOpt: (spawnOpt || false),
  };
  return initExtras;
}


export default prepareInitExtras;
