// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import findCommonAncestor from 'ubborg-lineage-find-common-ancestor-pmb';
import preview from 'concise-value-preview-pmb';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}


function describeMergeConflict(origRes, dupeRes, err) {
  const anc = findCommonAncestor(origRes, dupeRes);
  const dp = findCommonAncestor.arrowJoin(err.dictPath.map(preview));
  return [
    'No idea how to merge',
    'unequal property ' + (dp || '(empty path)'),
    'of new ' + (String(anc.subB) || '(common ancestor)'),
    'into   ' + (String(anc.subA) || '(common ancestor)'),
    'common ancestry ' + (String(anc.common) || '(none)') + ':',
    err.message,
  ];
}


const promising = {

  incubate(setProps) {
    const res = this;
    const oldProps = res.customProps;
    if (oldProps !== null) {
      throw new TypeError('Expected .customProps to still be null');
    }
    verifyAcceptProps(res, setProps);
    const okProps = {};
    aMap(setProps, function checkProp(val, key) {
      if (val === undefined) { return; }
      okProps[key] = val;
    });
    res.customProps = okProps;

    (function registerUniqueIndexProps() {
      const byUip = res.spawning.getLineageContext().resByUniqueIndexProp;
      const { name: typeName, uniqueIndexProps: uipNames } = res.getTypeMeta();
      if (!uipNames) { return; }
      uipNames.forEach(prop => byUip.registerUip(typeName, prop, res));
    }());
  },

  mergeUpdate(dupeRes) {
    const origRes = this;
    try {
      trivialDictMergeInplace(origRes.customProps, dupeRes.customProps);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        caught.message = describeMergeConflict(origRes, dupeRes,
          caught).join('\n\t');
      }
      throw caught;
    }
    return origRes;
  },

  prepareRelationsManagement() {
    return basicRelation.prepareRelationsManagement(this);
  },

  // The reasons for naming this resType "simple passive":
  hatch: doNothing,
  finalizePlan: doNothing,
};


const direct = {

  hasHatched() { return (Boolean(this.hatchedPr) && (!this.hatching)); },

  mustHaveHatched(intentDescr) {
    if (this.hasHatched()) { return true; }
    throw new Error('Wait for ' + String(this) + '.hatchedPr before you '
      + String(intentDescr) + '. If this occurrs while .hatch()ing, '
      + 'consider doing your work in .finalizePlan instead.');
  },

};


export default {
  direct,
  promising,
  describeMergeConflict,
};
