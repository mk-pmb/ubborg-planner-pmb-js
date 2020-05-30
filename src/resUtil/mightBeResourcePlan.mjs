// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';


const mbrp = function mightBeResourcePlan(x) { return !mbrp.whyNot(x); };

mbrp.whyNot = function whyNotResourcePlan(x) {
  if (!x) { return 'false-y'; }
  if (!x.id) { return 'no ID'; }
  const rela = x.relations;
  if (!rela) { return 'unrelated'; }
  if (!is.fun(rela.relateTo)) { return 'unrelatable'; }
  if (!is.fun(rela.waitForAllSubPlanning)) { return 'cannot plan deeply'; }

  const spw = (x.spawning || false);
  if (spw) {
    if (!spw.getLineageContext) { return 'spawning w/o getLineageContext'; }
    return '';
  }

  if (!x.hatchedPr) { return 'no hatched promise'; }
  return '';
};


mbrp.traceWhyNot = function traceWhyNotResourcePlan(x) {
  const w = mbrp.whyNot(x);
  console.trace('traceWhyNotResourcePlan:', String(x), (w || 'no reason'));
  return !w;
};





export default mbrp;
