// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import is from 'typechecks-pmb';

import joinIdParts from './joinIdParts';
import verifyAcceptProps from './verifyAcceptProps';
import trivialDictMergeInplace from '../trivialDictMergeInplace';


function resToString() { return `${this.typeName}[${this.id}]`; }


const apiBasics = {

  incubate(newProps) {
    const res = this;
    const typeMeta = res.getTypeMeta();
    verifyAcceptProps(typeMeta.acceptProps, newProps);
    const { dupe } = res.spawning;
    if (!dupe) {
      res.props = { ...newProps };
      return res;
    }
    try {
      trivialDictMergeInplace(dupe.props, newProps);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        const dunno = `No idea how to merge unequal ${
          String(res)} property "${caught.dictKey}": `;
        caught.message = dunno + caught.message;
      }
      throw caught;
    }
    return dupe;
  },

};


function makeSpawner(recipe) {
  const recPop = objPop(recipe);
  recPop.nest = key => mustBe.nest(key, recPop(key));
  const typeName = recPop.nest('typeName');
  const idProp = recPop('idProp');
  const api = { ...apiBasics, ...recPop.ifHas('api') };
  const acceptProps = recPop.ifHas('acceptProps', {});
  const typeMeta = {
    name: typeName,
    idProp,
    defaultProps: recPop.ifHas('defaultProps', {}),
    acceptProps,
  };
  recPop.expectEmpty('Unsupported recipe feature(s)');

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  function copyProps(orig) {
    if (is.obj(orig)) { return { ...orig }; }
    if (is.str(idProp)) { return { [idProp]: orig }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  async function spawn(ctx, origProps) {
    const props = copyProps(origProps, typeName);
    const mgdRes = mustBe.prop('obj', ctx, 'resourcesByTypeName');
    const mgdSameType = goak(mgdRes, typeName, '{}');
    const popProp = objPop.d(props);
    const id = idJoiner(idProp, popProp);
    const dupe = mgdSameType[id];
    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      toString: resToString,
      spawning: {
        dupe,
        getContext() { return ctx; },
      },
    };

    Object.keys(api).forEach(function installProxy(mtdName) {
      const impl = api[mtdName];
      if (!impl) { return; }
      async function mtdProxy(...args) { return impl.apply(res, args); }
      res[mtdName] = vTry.pr(mtdProxy, `${String(res)}.${mtdName}`);
    });

    await res.incubate(props);
    if (dupe) {
      const ack = await dupe.mergeUpdate(res);
      if (ack !== res) {
        throw new Error('Unmerged duplicate resource ID for ' + String(res));
      }
    } else {
      mgdSameType[id] = res;
    }
    delete res.spawning;
    return (dupe || res);
  }

  Object.assign(spawn, { typeMeta });
  return spawn;
}



export default {
  apiBasics,
  makeSpawner,
};
