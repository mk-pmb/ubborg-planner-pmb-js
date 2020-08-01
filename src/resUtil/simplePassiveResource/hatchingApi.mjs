// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import findCommonAncestor from 'ubborg-lineage-find-common-ancestor-pmb';
import preview from 'concise-value-preview-pmb';
import pEachSeries from 'p-each-series';
import mergeOpt from 'merge-options';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}


function makeMergeOptPropsReplacer(dest) {
  return function mergeReplaceProps(upd) {
    const merged = mergeOpt(dest.customProps, upd);
    dest.customProps = merged; // eslint-disable-line no-param-reassign
  };
}


function describeMergeConflict(origRes, dupeRes, err) {
  const anc = findCommonAncestor(origRes, dupeRes);
  const dp = findCommonAncestor.arrowJoin(err.dictPath.map(preview));
  const origAnc = (String(anc.subA) || '(common ancestor)');
  const dupeAnc = (String(anc.subB) || '(common ancestor)');
  return [
    `No idea how to merge unequal property ${dp || '(empty path)'}`,
    `of new ${dupeRes.typeName} for ${dupeAnc}`,
    `into ${origRes.typeName} from  ${origAnc}`,
    `common ancestry ${String(anc.common) || '(none)'}:`,
    err.message,
  ];
}


const promising = {

  incubate(setProps) {
    const res = this;
    const oldProps = res.customProps;
    if (oldProps !== null) {
      throw new TypeError(`Expected customProps to still be null`);
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

  async mergeUpdate(dupeRes) {
    const origRes = this;
    const mergeCtx = {
      id: origRes.id,

      dupeRes: () => dupeRes,
      dupeProps: () => dupeRes.customProps,
      amendDupeProps: makeMergeOptPropsReplacer(dupeRes),

      origRes: () => origRes,
      origProps: () => origRes.customProps,
      forceUpdateOrigProps: makeMergeOptPropsReplacer(origRes),
    };
    const typeMeta = origRes.getTypeMeta();
    await pEachSeries(typeMeta.mergePropsPrepareSteps,
      function prepare(impl) { return impl(mergeCtx); });

    try {
      trivialDictMergeInplace(origRes.customProps, dupeRes.customProps,
        typeMeta.mergePropsConflictSolvers, mergeCtx);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        caught.message = describeMergeConflict(origRes, dupeRes,
          caught).join('\n    ');
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
