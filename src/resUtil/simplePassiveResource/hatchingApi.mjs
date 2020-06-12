// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}


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
        caught.message = `No idea how to merge unequal ${
          String(origRes)} property "${caught.dictKey}": ${caught.message}`;
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


export default { direct, promising };
