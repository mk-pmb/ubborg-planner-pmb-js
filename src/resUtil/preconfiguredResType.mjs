// -*- coding: utf-8, tab-width: 2 -*-

function preCfg(origResType, df, parse) {
  const { plan: origPlan, normalizeProps: norm } = origResType;
  return {
    ...origResType,
    async plan(spec, ...extra) {
      const sp = { ...df, ...(norm ? norm(spec) : spec) };
      if (parse) { Object.assign(sp, await parse(sp)); }
      return origPlan.call(this, sp, ...extra);
    },
  };
};

export default preCfg;
