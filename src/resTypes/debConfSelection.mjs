// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import spRes from '../resUtil/simplePassiveResource/index.mjs';


const debConfNativeTypes = [
  'boolean',
  'error',
  'multiselect',
  'note',
  'password',
  'seen',
  'select',
  'string',
  'text',
  'title',
];


const recipe = {
  typeName: 'debConfSelection',
  idProps: ['pkg', 'question'],
  defaultProps: {
    seen: true,
    kind: null,   // = guess
    answer: null,
  },
};


const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;


function guessKind(v) {
  const t = typeof v;
  if (t === 'boolean') { return t; }
  if (t === 'string') { return t; }
  if (Array.isArray(v)) { return 'multiselect'; }
  return 'E_CANNOT_GUESS_FROM:' + (v && t);
}


async function plan(origSpec) {
  const spec = normalizeProps(origSpec);
  if (!spec.kind) { spec.kind = (guessKind(spec.answer) || spec.kind); }
  if (spec.seen === null) { delete spec.seen; }
  const verify = mustBe.tProp(recipe.typeName + ': ', spec);
  verify('nonEmpty str', 'pkg');
  verify('nonEmpty str', 'question');
  verify('bool | undef', 'seen');
  verify([['oneOf', debConfNativeTypes]], 'kind');
  const res = await baseSpawner(this, spec);
  return res;
}


export default {
  normalizeProps,
  plan,
  recipe,
};
