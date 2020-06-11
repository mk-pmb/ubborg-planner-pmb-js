// -*- coding: utf-8, tab-width: 2 -*-

import loMapKeys from 'lodash.mapkeys';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}

function orf(x) { return (x || false); }


const apiBasics = {

  incubate(setProps) {
    const res = this;
    const oldProps = res.customProps;
    if (oldProps !== null) {
      throw new TypeError('Expected .customProps to still be null');
    }
    verifyAcceptProps(res, setProps);
    const okProps = {};
    loMapKeys(setProps, function checkProp(val, key) {
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

  declareFacts(claims) {
    const origRes = this;
    try {
      trivialDictMergeInplace(origRes.customProps, claims);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        caught.message = `Unresolved contradiction to established property "${
          caught.dictKey}" of ${String(origRes)}: ${caught.message}`;
      }
      throw caught;
    }
    return origRes;
  },

  prepareRelationsManagement() {
    return basicRelation.prepareRelationsManagement(this);
  },

  async customizedFactsToDict(opt) {
    const res = this;
    if (res.hatching) {
      if (orf(opt).acceptPreliminary) { return res.customProps; }
      // We can't just await res.hatchedPr; or node.js v8.x will just exit
      // in case we get cyclic await from calling cFTD inside hatch().
      throw new Error('Facts not ready yet, wait until hatched!');
    }
    return res.customProps;
  },

  async toFactsDict(opt) {
    const custom = await this.customizedFactsToDict(opt);
    const dflt = this.getTypeMeta().defaultProps;
    return { ...dflt, ...custom };
  },

  // The reasons for naming this resType "simple passive":
  hatch: doNothing,
  finalizePlan: doNothing,
};


export default apiBasics;
