// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import checkInheritOwnerWithin from './checkInheritOwnerWithin.mjs';
import simpleNonMagicProps from './simpleNonMagicProps.mjs';


const inhOwnScopeKey = checkInheritOwnerWithin.scopeKey;
const inhOwnProps = Object.keys(simpleNonMagicProps.ownership);

function concatIf(a, b) { return (a ? a.concat(b) : b); }
function ensureTrailingSlash(s) { return s.replace(/\/*$/, '/'); }


const EX = function copyDependencyFilePropsOnto(src, dest, addIDP) {
  // eslint-disable-next-line no-param-reassign
  if (addIDP) { dest.ignoreDepPaths = concatIf(src.ignoreDepPaths, addIDP); }
  EX.inhOwn(src, dest);
};

Object.assign(EX, {

  inhOwn(src, dest) {
    const within = mustBe('undef | nonEmpty str',
      inhOwnScopeKey)(src[inhOwnScopeKey]);
    if (!within) { return; }
    if (!within.startsWith('/')) {
      const msg = inhOwnScopeKey + ' path must be absolute, not ' + within;
      throw new Error(msg);
    }
    if (!dest.path.startsWith(ensureTrailingSlash(within))) { return; }
    inhOwnProps.forEach(function copy(k) {
      if (dest[k] !== undefined) { return; }
      const val = src[k];
      if (val === undefined) { return; }
      // eslint-disable-next-line no-param-reassign
      dest[k] = val;
    });
    // eslint-disable-next-line no-param-reassign
    dest[inhOwnScopeKey] = within;
  },

});

export default EX;
