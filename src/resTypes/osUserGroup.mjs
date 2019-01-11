// -*- coding: utf-8, tab-width: 2 -*-

import spRes from '../resUtil/simplePassiveResource';


const sprRecipe = {
  typeName: 'osUserGroup',
  idProp: 'group',
  defaultProps: {
    exists: true,
  },
  acceptProps: {
  },
}


async function osUserGroup(spec) {
  const res = spRes.spawn(sprRecipe, this, spec);
  return res;
}



export default {
  plan: osUserGroup,
};
