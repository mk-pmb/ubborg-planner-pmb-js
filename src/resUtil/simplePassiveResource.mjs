// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import is from 'typechecks-pmb';

import joinIdParts from './joinIdParts';
import verifyAcceptProps from './verifyAcceptProps';
import trivialDictMergeInplace from '../trivialDictMergeInplace';
import basicRelation from './basicRelation';
import hook from '../hook';


function resToString() { return `${this.typeName}[${this.id}]`; }


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

  hatch() {},   // thus "simple passive"
};


const vanillaRecipe = {

  relationVerbs: [
    'needs',
    'suggests',
    'conflictsWith',
  ],

  makeSubContext(origCtx, changes) {
    return { ...origCtx, ...changes };
  },

  installRelationFuncs(res, typeMeta) {
    basicRelation.installRelationFuncs(res, typeMeta.relationVerbs);
  },

};


function startHatching(res, ...hatchArgs) {
  async function waitUntilHatched() {
    await res.hatch(...hatchArgs);
    res.hatching = false;
    return res;
  }
  res.hatching = true;
  // ^- Gotta set this first to avoid a time of undefined state: Even if we
  //    called wait…() first, it would be deferred as per promise spec.
  res.hatchedPr = waitUntilHatched();
  return res;
}


function makeSpawner(recipe) {
  const recPop = objPop(recipe);
  recPop.nest = key => mustBe.nest(key, recPop(key));
  const typeName = recPop.nest('typeName');
  const idProp = recPop('idProp');
  const api = { ...apiBasics, ...recPop.ifHas('api') };
  const acceptProps = recPop.ifHas('acceptProps', {});
  function vanil(k) { return recPop.ifHas(k, vanillaRecipe[k]); }
  const installRelationFuncs = vanil('installRelationFuncs');
  const makeSubCtx = vanil('makeSubContext');
  const typeMeta = {
    name: typeName,
    idProp,
    defaultProps: recPop.ifHas('defaultProps', {}),
    acceptProps,
    relationVerbs: vanil('relationVerbs'),
  };
  recPop.expectEmpty('Unsupported recipe feature(s)');

  function copyProps(orig) {
    if (is.obj(orig)) { return { ...orig }; }
    if (is.str(idProp)) { return { [idProp]: orig }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  async function spawn(ctx, origProps) {
    if (ctx.getTypeMeta) {
      throw new Error("A context shouldn't have a getTypeMeta.");
    }
    const props = copyProps(origProps);
    const mgdSameType = goak(ctx.getResourcesByTypeName(), typeName, '{}');
    const popProp = objPop.d(props);
    const id = idJoiner(idProp, popProp);
    const dupeOf = mgdSameType[id];

    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      toString: resToString,
      toDictKey: resToString,
      spawning: {
        dupeOf,
        getContext() { return ctx; },
        makeSubContext(changes) { return makeSubCtx.call(res, ctx, changes); },
      },
    };

    Object.keys(api).forEach(function installProxy(mtdName) {
      const impl = api[mtdName];
      if (!impl) { return; }
      async function mtdProxy(...args) { return impl.apply(res, args); }
      res[mtdName] = vTry.pr(mtdProxy, `${String(res)}.${mtdName}`);
    });

    await res.incubate(props);
    if (dupeOf) {
      const ack = await dupeOf.mergeUpdate(res);
      if (ack === dupeOf) {
        await hook(ctx, 'ResourceRespawned', dupeOf);
        return dupeOf;
      }
      throw new Error('Unmerged duplicate resource ID for ' + String(res));
    }

    await res.prepareRelationsManagement();
    installRelationFuncs.call(ctx, res, typeMeta);

    mgdSameType[id] = res;
    delete res.spawning;
    await hook(ctx, 'ResourceSpawned', res);

    startHatching(res, props);
    return res;
  }

  Object.assign(spawn, { typeMeta });
  return spawn;
}



export default {
  apiBasics,
  makeSpawner,
  vanillaRecipe,
};
