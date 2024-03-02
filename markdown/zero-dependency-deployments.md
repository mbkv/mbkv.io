---
title: "Setting up easy deployments on Ubuntu"
description: "Deployments don't need to be hard. Except when you're doing them yourself"
date: "2024-03-01"
updated: "2024-03-01"
---

My style of programming is to keep things as simple as possible. Dependencies
have their benefits and their issues. Primarily I don't believe anyone can
truly understand what they're importing until they've designed a similar system
themselves. That may or may not be a good thing, but certainly it's the worst
thing from a learning point of view. Deployments however was a fairly large
blindspot of mine, which I've finally got past, with setting up continuous
deployments to this site. Within a minute of pushing onto the master branch, an
invisible series of cogs and wheels build and deploy my site, all in the
background

Here's the high level overview

- Create a system user with extremely limited priveleges
- SSH is hardened to not allow a TTY, run arbitrary commands, or to allow
  passing ports
- SSH "ForceCommand" is turned on and points to your build script of choice

After doing all this, all you need to do is ssh into your new user and it will
run a build script of your choice. You can even set it up to run the build in
the background and have it immediately kick you off the shell. This is useful
for when in the next part we can set up github actions and avoid paying a lot
of money just waiting on an ssh connection

So here's how you do it. First you need your build script. I'm using a mock file here to keep it simple

```bash
# cat /usr/local/bin/build-site
#!/bin/bash -l

echo "build-site ran!"
```

Now you need your new restrictive user to set up the build script.

```bash
# options here are
# -r  create a system account
# -G  list of supplementary groups of the new account
# -m  create the user's home directory
sudo useradd -r -G www-data -m site
sudo su site -l
mkdir .ssh
touch .hushlogin # disables annoying motd message

# if you don't have a private/public key yet, you can generate it
# like such and copy over the private key locally
ssh-keygen -t ed25519 -a 200

cp secret.pub .ssh/authorized_keys

chmod 700 .ssh
chmod 600 .ssh/authorized_keys

exit
```

Almost done! Now we need to harden SSH. Go ahead and edit `/etc/ssh/sshd_config` and insert the following

```
Match User site
        AllowTcpForwarding no
        PermitTTY no
        ForceCommand /usr/local/bin/build-site
        PasswordAuthentication no
        PermitEmptyPasswords no
```

Be sure to restart sshd

```bash
sudo service sshd restart
```

If you followed these instructions carefully and I didn't accidentally leave
any details, you should be able to `ssh test@server` and be greeted with a
"build-site ran!" message. Furthermore any attempts at running other programs
with ssh has been limited. Which is good!

If you set up so your build script is throttled (won't run if there are no
changes + only runs only once every minute), you might actually be able to
leave your system account without a password. That way bots trying to access
your server will act as a poor man's cronjob

Finally, I promised setting up github actions. This part isn't as interesting as
everything else. [this is the deploy action I'm
using](https://github.com/mbkv/mbkv.io/blob/master/.github/workflows/deploy.yml)

```yml
name: deploy
on:
  push:
    branches:
      - master

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: mbkv.io
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: 22
```

Simply add in your `SSH_USERNAME` and `SSH_KEY` secret in your repo settings,
and done! The only thing left is setting up your build script up correctly. If
you're looking for inspiration, [my build script is located
here](https://github.com/mbkv/mbkv.io/blob/master/build.sh)
