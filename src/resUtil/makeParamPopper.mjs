// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';


function dictDive(d, k) { return (d || false)[k]; }


function makeParamPopper(bun, origOpt) {
  const { typeName } = bun; // may differ in derived types.
  const opt = { ...origOpt };

  let leftoversMsg = `Unsupported ${typeName} param(s)`;
  let dict = bun.getParams();
  const { dive } = opt;
  if (dive && dive.length) {
    mustBe.ary('dive option', dive);
    delete opt.dive;
    dict = dive.reduce(dictDive, dict);
    leftoversMsg += ` (prefix ${dive.join('.')}.…)`;
  }

  return objPop((dict || false), {
    mustBe,
    leftoversMsg,
    ...opt,
  });
}


export default makeParamPopper;
