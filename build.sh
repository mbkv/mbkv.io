#!/bin/bash

# this is probably overengineered garbage but because I felt like it and never
# wanted to figure out why my site was out of date, this does some weird stuff
# There's TWO lock files. One for the currently running script, the second for
# the script queued up after currently running script. This way if I rapidly
# push 10 consecutive commits, this still will only run twice. Once for the
# first commit. the other for the last commit. since this is git it doesn't
# matter if I build for the previous 8

set -e

. $HOME/.bash_profile

LOCKFILE1="/var/www/mbkv.io/build-mbkv.1.lock"
LOCKFILE2="/var/www/mbkv.io/build-mbkv.2.lock"

exec {LOCK1_FD}>"$LOCKFILE1"
exec {LOCK2_FD}>"$LOCKFILE2"

while getopts ":f" opt; do
  case $opt in
    f)
      force=true
      ;;
  esac
done

lock_file_block() {
        flock -x "$1"
}

lock_file() {
        flock -n -x "$1"
        return $?
}

unlock_file() {
        flock -u "$1"
}

build() {
    lock_file "$LOCK1_FD"
    if [ $? -ne 0 ]; then
        lock_file "$LOCK2_FD" || exit 1
        lock_file_block "$LOCK1_FD"
        unlock_file "$LOCK2_FD"
    fi

    echo "Building on $(date)"
    pushd /var/www/mbkv.io/repo
    git remote update

    head_commit="$(git rev-parse HEAD)"
    origin_commit="$(git rev-parse origin/master)"
    if [ "$head_commit" == "$origin_commit" ] && [ -z "$force" ]; then
            echo "Not doing anything since the commit is the same"
            sleep 30
            exit 1
    fi

    git reset --hard origin/master
    git clean -dXf public/
    bun install
    echo "Building..."
    time bun run bin/build.ts
    echo "Finsihed building..."
    rsync --delete -av public/ /var/www/mbkv.io/public/
}

time build >> /var/www/mbkv.io/log 2>&1 &
