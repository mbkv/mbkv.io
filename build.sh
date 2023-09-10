#!/bin/bash

inotifywait -r -m -e close_write styles |
  while read file_path file_event file_name; do
    echo $file_event
    yarn lessc styles/styles.less -x >public/styles.css
  done
