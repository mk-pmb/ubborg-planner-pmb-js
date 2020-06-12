// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';

import factsApi from './factsApi';
import hatchingApi from './hatchingApi';

const parts = [
  factsApi,
  hatchingApi,
];

const vanillaApi = {};
parts.forEach(function addPart(pt) {
  aMap(pt, function addCateg(impl, categName) {
    vanillaApi[categName] = { ...vanillaApi[categName], ...impl };
  });
});

export default vanillaApi;
