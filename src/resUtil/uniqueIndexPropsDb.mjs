// -*- coding: utf-8, tab-width: 2 -*-

function getOrAddMap(parent, key) {
  const had = parent.get(key);
  if (had) { return had; }
  const add = new Map();
  parent.set(key, add);
  return add;
}


function mapMap(map, iter) {
  const dict = {};
  map.forEach(function add(val, key) {
    const prop = String(key);
    const dupe = dict[prop];
    if (dupe !== undefined) { throw new Error('Duplicate key: ' + prop); }
    dict[prop] = (iter ? iter(val, prop) : val);
  });
  return dict;
}


function resByProp(db, sameTypeName, propName, otherTypeName) {
  const typeName = (otherTypeName || sameTypeName);
  return getOrAddMap(getOrAddMap(db, typeName), propName);
}


function registerUip(typeName, propName, res) {
  // console.debug('regUip:', { typeName, propName, res });
  const val = res.customProps[propName];
  if (val === undefined) { return; }
  const db = this;
  const dict = resByProp(db, typeName, propName);
  const dupe = dict.get(val);
  if (dupe === res) { return; }
  if (dupe) {
    throw new Error(`Duplicate unique property: ${propName}="${
      val}", already registered by ${String(dupe)}`);
  }
  dict.set(val, res);
}


const toplevelDbApi = {
  registerUip,

  makeTypeApi(typeName) {
    const db = this;
    const api = {
      resByProp: resByProp.bind(null, db, typeName),
    };
    return api;
  },

  toJsonablePojo() {
    return mapMap(this, function foundType(propNames, typeName) {
      return mapMap(propNames, function foundProp(resByVal, propName) {
        const valByResId = {};
        // We need to flip k/v here, because the value might not be a string.
        resByVal.forEach(function foundVal(res, val) {
          const { id } = res;
          const dupeVal = valByResId[id];
          if (dupeVal !== undefined) {
            throw new Error(`The fail whale is on fire! Resource of type ${
              typeName}, id ${id} seems to have multiple values for prop "${
              propName}": "${dupeVal}" vs. "${val}"`);
          }
          valByResId[id] = val;
        });
        return valByResId;
      });
    });
  },

};


function makeUipDb() {
  // (typeName -> (propName -> (value -> resIdString)))
  return Object.assign(new Map(), toplevelDbApi);
}


export default makeUipDb;
