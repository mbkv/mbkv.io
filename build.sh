#!/bin/bash -l

# this is probably overengineered garbage but because I felt like it and never
# wanted to figure out why my site was out of date, this does some weird stuff
# There's TWO lock files. One for the currently running script, the second for
# the script queued up after currently running script. This way if I rapidly
# push 10 consecutive commits, this still will only run twice. Once for the
# first commit. the other for the last commit. since this is git it doesn't
# matter if I build for the previous 8

LOCKFILE1="/var/www/mbkv.io/build-mbkv.1.lock"
LOCKFILE2="/var/www/mbkv.io/build-mbkv.2.lock"

lock_file() {
    echo "$BASHPID" >"$1"
    sleep .5
    if [ "$(cat $1)" != $BASHPID ]; then
        echo "Race condition!"
        exit
    fi
}

unlock_file() {
    rm "$1"
}

is_lock_active() {
    if [ -f "$1" ]; then
        if ps -p "$(cat "$1")" >/dev/null; then
            return 0
        fi
    fi
    return 1
}

build() {
    if is_lock_active "$LOCKFILE1"  && is_lock_active "$LOCKFILE2"; then
        exit 1
    fi

    if is_lock_active "$LOCKFILE1"; then
        lock_file "$LOCKFILE2"
        while is_lock_active "$LOCKFILE1"; do
            sleep 1
        done
        lock_file "$LOCKFILE1"
        unlock_file "$LOCKFILE2"
    else
        lock_file "$LOCKFILE1"
    fi

    echo "Building on $(date)"
    nvm install v20.11.1
    pushd /var/www/mbkv.io/repo
    git fetch --all -q
    git reset --hard origin/master
    git clean -dXf public/
    yarn
    yarn build
    rsync --delete -av public/ /var/www/mbkv.io/public/
    popd

    unlock_file "$LOCKFILE1"
}
build >> /var/www/mbkv.io/log 2>&1 &

