// -*- coding: utf-8, tab-width: 2 -*-

async function planUser(userSpec) {
  const user = {
    ...userSpec,
    toString() { return `[user ${this['']}]`; },
  };
  return user;
}



export default {
  plan: planUser,
};
