// -*- coding: utf-8, tab-width: 2 -*-

async function claimStageFacts(initExtras, makeClaims) {
  const res = initExtras.getRes();
  await res.hatchedPr;
  const facts = await res.toFactsDict();
  const claims = await makeClaims(facts);
  if (!claims) { return; }
  const stg = initExtras.getLineageContext().currentStage;
  await stg.declareFacts(claims);
}

export default claimStageFacts;
