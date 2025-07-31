// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';

import fileGeneratedHint from '../file/hintGenerated.mjs';


const archsListSep = ',';
// ^-- source: https://manpages.debian.org/buster/apt/sources.list.5.en.html

function fmtArchsList(a) {
  if (!a) { return; }
  if (!a.length) { return; }
  return ('[arch=' + a.join(archsListSep) + ']');
}


function renderDebLines(renderCtx) {
  const { mustFact, repoUrlTpls, renderOVT } = renderCtx;
  const dists = mustFact('nonEmpty ary', 'dists');
  const archs = fmtArchsList(mustFact('undef | nul | nonEmpty ary', 'archs'));
  const isFlatRepo = ((dists.length === 1) && (dists[0] === '/'));
  const compo = (mustFact(isFlatRepo ? 'undef' : 'nonEmpty ary',
    'components') || []);
  const src = mustFact('bool', 'src');
  const debLines = [fileGeneratedHint('# ', '\n')];
  const debTypePrefix = (renderCtx.repoEnabled ? '' : '# disabled # ');
  repoUrlTpls.forEach((url) => {
    mustBe.near('dists', dists).forEach((dist) => {
      mustBe.nest('dist', dist);
      const debLn = renderOVT([
        archs,
        url,
        dist,
        ...compo,
      ].filter(Boolean).join(' ') + '\n');
      debLines.push(debTypePrefix + 'deb     ' + debLn);
      if (src) { debLines.push(debTypePrefix + 'deb-src ' + debLn); }
    });
  });
  return debLines;
}


export default renderDebLines;
