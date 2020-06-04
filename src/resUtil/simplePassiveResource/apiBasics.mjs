// -*- coding: utf-8, tab-width: 2 -*-

import loMapKeys from 'lodash.mapkeys';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}


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
        const dunno = `No idea how to merge unequal ${
          String(origRes)} property "${caught.dictKey}": `;
        caught.message = dunno + caught.message;
      }
      throw caught;
    }
    return origRes;
  },

  prepareRelationsManagement() {
    return basicRelation.prepareRelationsManagement(this);
  },

  async customizedFactsToDict() {
    const res = this;
    if (!res.hatchedPr) { throw new Error('Facts not ready yet'); }
    await res.hatchedPr;
    return res.customProps;
  },

  async toFactsDict() {
    const custom = await this.customizedFactsToDict();
    const dflt = this.getTypeMeta().defaultProps;
    return { ...dflt, ...custom };
  },

  // The reasons for naming this resType "simple passive":
  hatch: doNothing,
  finalizePlan: doNothing,
};


export default apiBasics;
