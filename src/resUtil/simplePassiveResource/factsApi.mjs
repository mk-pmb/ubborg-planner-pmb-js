// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';

import verifyAcceptProps from '../verifyAcceptProps.mjs';
import trivialDictMergeInplace from '../../trivialDictMergeInplace.mjs';


function orf(x) { return (x || false); }
function resToDictKey() { return `${this.typeName}[${this.id}]`; }


const direct = {

  toString: resToDictKey,
  toDictKey: resToDictKey,

};

const promising = {

  async declareFacts(claims) {
    const origRes = this;
    verifyAcceptProps(origRes, claims);
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
    const res = this;
    const custom = await res.customizedFactsToDict(opt);
    const dflt = res.getTypeMeta().defaultProps;
    return mergeOpt(dflt, custom);
  },

};

export default { direct, promising };
