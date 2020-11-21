// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import fileGeneratedHint from '../file/hintGenerated';


function renderDebLines(renderCtx) {
  const { mustFact, repoUrlTpls, renderOVT } = renderCtx;
  const dists = mustFact('nonEmpty ary', 'dists');
  const isFlatRepo = ((dists.length === 1) && (dists[0] === '/'));
  const compo = (mustFact(isFlatRepo ? 'undef' : 'nonEmpty ary',
    'components') || []);
  const src = mustFact('bool', 'src');
  const debLines = [fileGeneratedHint('# ', '\n')];
  repoUrlTpls.forEach((url) => {
    mustBe.near('dists', dists).forEach((dist) => {
      mustBe.nest('dist', dist);
      const debLn = renderOVT([url, dist, ...compo].join(' ') + '\n');
      debLines.push('deb     ' + debLn);
      if (src) { debLines.push('deb-src ' + debLn); }
    });
  });
  return debLines;
}


export default renderDebLines;
