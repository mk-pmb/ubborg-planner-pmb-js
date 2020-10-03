// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType';
import mustBe from 'typechecks-pmb/must-be';

import origResType from './admFile';
import fileGeneratedHint from '../resUtil/fileGeneratedHint';


function renderOneSection(sectSpec) {
  mustBe('nonEmpty ary', 'section content')(sectSpec);
  const [sectType, ...sectOpts] = sectSpec;
  return [
    '',
    `Section "${sectType}"`,
    ...sectOpts.map(opt => opt && `  ${opt}`),
    'EndSection',
  ];
}


export default preCfg(origResType, {
  pathPre: '/usr/share/X11/xorg.conf.d/',
  pathSuf: '.conf',
  mimeType: 'lines',
}, function parse(spec) {
  const ovr = {};
  let sects = spec.sections;
  if (spec.section) {
    if (sects) {
      throw new Error('Conflicting properties "sections" and "sections"');
    }
    ovr.section = undefined;
    sects = [spec.section];
  }
  if (sects) {
    if (spec.content) {
      throw new Error('Conflicting properties "content" and "sections"');
    }
    mustBe('ary', 'sections list')(sects);
    ovr.sections = undefined;
    let genHint = (spec.fileGeneratedHint || fileGeneratedHint('# ', ''));
    if (!Array.isArray(genHint)) { genHint = [genHint]; }
    ovr.content = genHint.concat(...sects.map(renderOneSection));
  }
  return ovr;
});
