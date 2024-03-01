---
title: "How I got zero dependency deployments"
description: "Deployments don't need to be hard. Except when you're doing them yourself"
date: "2024-03-01"
updated: "2024-03-01"
---

My style of programming is to keep things as simple as possible. Dependencies
have their benefits and their issues. Primarily I don't believe anyone can truly
understand what they're even importing until they've designed a similar system
themselves. That may or may not be a good thing, but certainly it's the worst
thing from an educational point of view. Deployments however was a fairly large
blindspot of mine, which I've finally got past, with setting up continuous
deployments to this site. Within a minute of pushing onto the master branch, an
invisible series of cogs and wheels build and deploy my site, all in the
background

Just to go over the high level overview, here are the important points to cover

- I rent an ubuntu droplet from digital ocean
-
