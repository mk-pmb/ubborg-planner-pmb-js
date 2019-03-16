// -*- coding: utf-8, tab-width: 2 -*-

import loMapKeys from 'lodash.mapkeys';

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


function doNothing() {}


const apiBasics = {

  incubate(setProps) {
    const res = this;
    const typeMeta = res.getTypeMeta();
    verifyAcceptProps(typeMeta, setProps);
    if (res.props !== undefined) {
      throw new TypeError('Expected props to not be defined yet');
    }
    const okProps = {};
    loMapKeys(setProps, function checkProp(val, key) {
      if (val === undefined) { return; }
      okProps[key] = val;
    });
    res.props = okProps;
  },

  mergeUpdate(dupeRes) {
    const origRes = this;
    try {
      trivialDictMergeInplace(origRes.props, dupeRes.props);
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
    const { hatchedPr, props } = this;
    if (!hatchedPr) { throw new Error('Facts not ready yet'); }
    await hatchedPr;
    return props;
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
