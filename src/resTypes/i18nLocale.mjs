// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource/index.mjs';

const recipe = {
  ...spRes.recipe,
  typeName: 'i18nLocale',
  idProps: ['name'],
  relationVerbs: [],
  defaultProps: { present: true },
  acceptProps: { present: 'bool' },
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;

async function plan(origSpec) {
  const spec = normalizeProps(origSpec);
  spec.name = spec.name.replace(/\s+/g, '');
  if (spec.name.endsWith('¬')) {
    spec.name = spec.name.slice(0, -1);
    spec.present = false;
  }
  return baseSpawner(this, spec);
}

export default {
  normalizeProps,
  plan,
  recipe,
};
