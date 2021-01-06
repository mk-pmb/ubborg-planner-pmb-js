// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';

import phrases from '../phrases';
import mtAlias from './mimeAlias';
import simpleNonMagicProps from './simpleNonMagicProps';


const {
  sym: mtSym,
} = mtAlias;


const EX = function solveMimeType(origMt, dupeMt, mergeCtx) {
  const origTmt = mergeCtx.origProps().targetMimeType;
  if (origMt === mtSym) {
    if (origTmt === dupeMt) { return origMt; }
    if (origTmt === undefined) {
      mergeCtx.userHints.push('Hint: The symlink was declared first and'
        + ' does not demand a targetMimeType. However, automatic conversion'
        + ' could cause delayed conflicts if the timing of declaration'
        + ' changes. Instead, please configure the expected tMT explicitly.');
    }
    mergeCtx.userHints.push('Hint: The symlink was declared first and'
      + ' demands a conflicting targetMimeType: ' + origTmt);
    return;
  }
  if (dupeMt === mtSym) { return EX.replaceWithSymlink(origMt, mergeCtx); }
};


Object.assign(EX, {

  replaceWithSymlink(origMt, mergeCtx) {
    const dupeTmt = mergeCtx.dupeProps().targetMimeType;
    function nope() { mergeCtx.flinch(phrases.noDupeHatch(origMt, mtSym)); }
    function almost(hint) {
      mergeCtx.userHints.push('Hint: Replacing the previously declared'
        + ' file with the symlink might have been acceptable ' + hint);
      nope();
    }
    if (dupeTmt !== origMt) {
      return almost('if the symlink would demand this targetMimeType: '
        + origMt);
    }
    const pop = objPop(mergeCtx.origProps());
    const oTmt = pop('targetMimeType');
    if (oTmt !== mtSym) {
      if (oTmt === undefined) {
        mergeCtx.forceUpdateOrigProps({ targetMimeType: origMt });
      } else {
        return almost('if the former had no targetMimeType.');
      }
    }
    pop('mimeType'); // It's being solved right now.
    pop('content'); // :TODO: Maybe solve if target has same content.
    pop('debugHints');  // Can probably be solved.
    Object.keys(simpleNonMagicProps.all).forEach(x => pop(x));

    const unsupp = pop.remainingKeys();
    if (unsupp.length) {
      return almost('if the former would not demand these props: '
        + unsupp.sort().join(', '));
    }

    mergeCtx.forceUpdateOrigProps({ mimeType: mtSym });
    return mtSym; // confirm the dupeMT
  },

});

export default EX;
