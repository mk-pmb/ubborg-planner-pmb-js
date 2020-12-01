// -*- coding: utf-8, tab-width: 2 -*-

const accessProps = {
  // If the file is to be created:
  createdOwner: 'pos num | nonEmpty str',
  createdGroup: 'pos num | nonEmpty str',
  createdModes: 'nonEmpty str',

  // In case the file existed already:
  enforcedOwner: 'pos num | nonEmpty str',
  enforcedGroup: 'pos num | nonEmpty str',
  enforcedModes: 'nonEmpty str',
};


const basicNonMagicProps = {
  // aka props don't change hatching significantly
  debugHints: 'dictObj',
  ...accessProps,
};


export default basicNonMagicProps;
