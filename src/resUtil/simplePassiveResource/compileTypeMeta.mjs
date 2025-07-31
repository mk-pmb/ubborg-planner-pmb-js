// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be.js';

import recipeTimeouts from '../recipeTimeouts.mjs';


const typeMetaDictNames = [
  'acceptProps',
  'defaultProps',
  'mergePropsConflictSolvers',
  recipeTimeouts.recipeTmoKey,
];
const typeMetaListNames = [
  'mergePropsPrepareSteps',
  'relationVerbs',
  'uniqueIndexProps',
];

function typeMetaToString() { return `resTypeMeta[${this.name}]`; }


function checkSingleIdProp(idProps) {
  if (idProps.length !== 1) { return false; }
  const [name] = idProps;
  return mustBe.nest('Single idProp name', name);
}


function compileTypeMeta(typeName, idProps, mustVanil) {
  const parseStrSpec = mustVanil('fun | undef | nul', 'spawnParseStringSpec');
  const singleIdProp = checkSingleIdProp(idProps);

  function normalizeProps(orig) {
    // We can't handle arrays of specs here, because spawn() is expected
    // to return a promise for exactly one resource.
    // Thus, the array convenience is reserved for relationVerb functions.
    let p = orig;
    if (parseStrSpec && is.str(p)) { p = parseStrSpec(p) || p; }
    if (is.dictObj(p)) { return { ...p }; }
    if (singleIdProp && is.str(p)) { return { [singleIdProp]: p }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const tm = {
    name: typeName,
    idProps,
    toString: typeMetaToString,
    normalizeProps,
  };
  function cp(l, c) { l.forEach((k) => { tm[k] = mustVanil(c, k); }); };
  cp(typeMetaListNames, 'ary');
  cp(typeMetaDictNames, 'dictObj');
  return tm;
}



export default compileTypeMeta;
