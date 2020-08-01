// -*- coding: utf-8, tab-width: 2 -*-

function mergeNlSpace(s) { return s.trim().replace(/\n +/g, ' '); }

const phrases = {

  noDupeHatch(origDescr, dupeDescr) {
    return mergeNlSpace(`
      Cannot convert ${origDescr} to ${dupeDescr}:
      The change might require different ways of hatching, but the
      course of action for the original resource  has already been decided,
      and the temporary duplicate resource will be discarded.
      `);
  },

};

export default phrases;
