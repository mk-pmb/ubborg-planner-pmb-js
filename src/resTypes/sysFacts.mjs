// -*- coding: utf-8, tab-width: 2 -*-

/* ********************************************************** *\
 *                                                            *
 *      There is an npm package to help with handling         *
 *      sysFacts resources: ubborg-sysfacts-helper-pmb        *
 *                                                            *
\* ********************************************************** */

import mergeOpt from 'merge-options';

import spRes from '../resUtil/simplePassiveResource';
import makeParamPopperImpl from '../resUtil/makeParamPopper';
import trivialDictMergeInplace from '../trivialDictMergeInplace';

const resPropsProp = 'customProps';
const dataProp = 'facts';

const recipe = {
  ...spRes.recipe,
  typeName: 'sysFacts',
  idProps: ['topic'],
  relationVerbs: [],
  acceptProps: { [dataProp]: true },
  directApi: {
    ...spRes.directApi,
    getSysFacts() { return this[resPropsProp][dataProp]; },
    suggestSysFacts(sug) {
      if (!sug) { return; }
      if (sug === true) { return; }
      const props = this[resPropsProp];
      props[dataProp] = mergeOpt(sug, props[dataProp]);
    },
    declareSysFacts(facts) {
      trivialDictMergeInplace(this[resPropsProp][dataProp], facts);
    },
    makeSysFactPopper(opt) {
      return makeParamPopperImpl(this.typeName + ' facts',
        this[resPropsProp][dataProp], opt);
    },
  },
};

const baseSpawner = spRes.makeSpawner(recipe);

export default {
  async plan(...args) {
    const res = await baseSpawner(this, ...args);
    await res.hatchedPr;
    return res;
  },
};
