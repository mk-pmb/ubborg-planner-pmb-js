#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function livecd () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m "$BASH_SOURCE"/..)"
  cd "$SELFPATH" || return $?
  ./bin/ian.mjs docs/example/livecd.mjs
}

livecd "$@"; exit $?
