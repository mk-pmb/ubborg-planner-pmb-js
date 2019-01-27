// -*- coding: utf-8, tab-width: 2 -*-

import verifyAcceptProps from '../verifyAcceptProps';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';
import basicRelation from '../basicRelation';


const apiBasics = {

  incubate(newProps) {
    const res = this;
    const typeMeta = res.getTypeMeta();
    verifyAcceptProps(typeMeta, newProps);
    const { dupeOf } = res.spawning;
    if (!dupeOf) {
      res.props = { ...newProps };
      return res;
    }
    try {
      trivialDictMergeInplace(dupeOf.props, newProps);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        const dunno = `No idea how to merge unequal ${
          String(res)} property "${caught.dictKey}": `;
        caught.message = dunno + caught.message;
      }
      throw caught;
    }
    return dupeOf;
  },


  prepareRelationsManagement() {
    return basicRelation.prepareRelationsManagement(this);
  },

  async toFactsDict() {
    const { hatchedPr, props } = this;
    if (!hatchedPr) { throw new Error('Facts not ready yet'); }
    await hatchedPr;
    return props;
  },

  hatch() {},   // thus "simple passive"
};


export default apiBasics;
