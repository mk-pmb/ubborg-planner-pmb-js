// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import findCommonAncestor from 'ubborg-lineage-find-common-ancestor-pmb';
import preview from 'concise-value-preview-pmb';
import pEachSeries from 'p-each-series';
import mergeOpt from 'merge-options';
import vTry from 'vtry';
import mustBe from 'typechecks-pmb/must-be';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';
import phrases from '../phrases';


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
    `No idea how to merge unequal property ${dp || '(empty path)'} of new ${
      String(dupeRes)}`,
    `for ${dupeAnc} into the current ${origRes.typeName} resource plan`,
    `for ${origAnc}`,
    `common ancestry ${String(anc.common) || '(none)'}:`,
    err.message,
  ];
}


function getDupeResLineageContext() {
  const self = this;
  const dr = self.dupeRes();
  const descr = `${phrases.blamePlannerBug()
  }: While looking up the lineage context for dupe resource ${String(dr)}`;

  function dare() {
    const x = dr.spawning.getLineageContext();
    mustBe('obj', 'value')(x);
    return x;
  }
  return vTry(dare, descr)();
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
      userHints: [],

      dupeRes: () => dupeRes,
      dupeProps: () => dupeRes.customProps,
      amendDupeProps: makeMergeOptPropsReplacer(dupeRes),
      getLineageContext: getDupeResLineageContext,

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
        const hints = mergeCtx.userHints;
        const msg = describeMergeConflict(origRes, dupeRes, caught);
        if (hints.length) { msg[0] = '(See hints below) ' + msg[0]; }
        caught.message = msg.concat(hints).join('\n    ');
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
