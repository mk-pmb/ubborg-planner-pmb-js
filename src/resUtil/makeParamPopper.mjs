// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';


function dictDive(d, k) { return (d || false)[k]; }


function makeParamPopper(contextNameOrBundle, paramsDict, origOpt) {
  const opt = { ...origOpt };
  const contextName = (contextNameOrBundle.typeName || contextNameOrBundle);

  let leftoversMsg = `Unsupported ${contextName} param(s)`;
  let dict = paramsDict;
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
