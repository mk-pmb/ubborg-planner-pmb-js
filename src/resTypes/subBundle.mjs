// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import bundle from './bundle';

function plan(spec, ...extras) {
  const parBunId = mustBe.nest('parent bundle id', this.parentBundle.id);
  const subSpec = mustBe.nest('sub bundle id', spec.url);
  const url = (parBunId + (parBunId.endsWith('/') ? '' : '/') + subSpec);
  return bundle.plan.call(this, { ...spec, url }, ...extras);
}

export default { plan };
