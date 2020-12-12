// -*- coding: utf-8, tab-width: 2 -*-

import simpleNonMagicProps from './simpleNonMagicProps';


const inhOwnScopeKey = 'inheritOwnerWithin';
const inhOwnProps = [
  inhOwnScopeKey,
  ...Object.keys(simpleNonMagicProps.accessProps),
];

function concatIf(a, b) { return (a ? a.concat(b) : b); }
function ensureTrailingSlash(s) { return s.replace(/\/*$/, '/'); }


const EX = function copyDependencyFilePropsOnto(src, dest, addIDP) {
  // eslint-disable-next-line no-param-reassign
  if (addIDP) { dest.ignoreDepPaths = concatIf(src.ignoreDepPaths, addIDP); }

  const inhOwnBase = src[inhOwnScopeKey];
  if (inhOwnBase && dest.path.startsWith(ensureTrailingSlash(inhOwnBase))) {
    inhOwnProps.forEach(function copy(k) {
      if (dest[k] !== undefined) { return; }
      const val = src[k];
      if (val === undefined) { return; }
      // eslint-disable-next-line no-param-reassign
      dest[k] = val;
    });
  }
};


export default EX;
