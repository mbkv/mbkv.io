---
title: "Michael's public list of bookmarks"
description: "Game development, CPUs, GPUs, browsers, and more"
date: "2024-02-27"
updated: "2024-02-27"
---

## game dev

As an outsider, game development has always been fascinating to me. However,
I've found that many of the practices and algorithms used in this field can be
fairly opaque and hard to find. Some algorithms are fairly straight forward
like axis aligned bounding box collisions. I've even done several
implementations of that at my time at Kapwing. But I've had very little success
finding anything that's even slightly more advanced than that. Just
understanding at what a render layer is supposed to look like is difficult

### GPU optimization

- [Life of a triangle - NVIDIA's logical pipeline](https://developer.nvidia.com/content/life-triangle-nvidias-logical-pipeline)
- [Minimum number of triangles per draw call](https://www.g-truc.net/post-0666.html)
- [How bad are small triangles on GPU and why?](https://www.g-truc.net/post-0662.html)
- [Render Graphs](https://logins.github.io/graphics/2021/05/31/RenderGraphs.html)
- [meshoptimizer](https://github.com/zeux/meshoptimizer)

  contains a huge amount of information about optimization algorithms!

### CPU optimization

- [Pitfalls of Object Oriented Programming](https://harmful.cat-v.org/software/OO_programming/_pdf/Pitfalls_of_Object_Oriented_Programming_GCAP_09.pdf)
- [Pitfalls of Object Oriented Programming, Revisited](https://www.youtube.com/watch?v=VAT9E-M-PoE)

  Kind of sensational titles but it really just looks at it from a hardware
  perspective and probably gives the best short introduction to hardware that I know of

### Techniques
- [Handles are the better pointers](https://floooh.github.io/2018/06/17/handles-vs-pointers.html)

### Engines

- [tokyospliff's](https://www.youtube.com/@tokyospliff/streams) engine [Hell2024](https://www.youtube.com/@tokyospliff/streams)

  tokyospliff is just a different type of beast

## Browsers

I have been in web apps for my entire engineering career. Most of the things I
need to research as of late is fairly obscure. Similarly to gamedev, it also
can't be found but for a completely different reason. The majority of web
development content on the internet has been mostly about how you can write the
same button but in a slightly different way. While that discussion has its time
and place, the thing I'm more interested in is how to get that button to render
as fast as possible. Below are a few resources for that

- [Web Performance Optimization stats](https://wpostats.com/)
- [@intenttoship](https://twitter.com/intenttoship)
- [ECMAScript proposals](https://github.com/tc39/proposals)
- [Figma's "BUilding a professional design tool on the web](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)

  honestly [the entire figma blog](https://www.figma.com/blog/engineering/) is amazing.

- [Fast string concatenation in JavaScript](https://docs.google.com/document/u/0/d/1o-MJPAddpfBfDZCkIHNKbMiM86iDFld7idGbNQLuKIQ)
- [tonsky.me](https://tonsky.me)
- [Frontend web performance: The Essentials](https://medium.com/@matthew.costello/frontend-web-performance-the-essentials-0-61fea500b180)
- [Optimizing for 60fps everywhere in JavaScript](https://www.gosquared.com/blog/optimising-60fps-everywhere-in-javascript)
- [How web bloat impacts users with slow devices](https://danluu.com/slow-devices/)

  There's more articles linked in the appendix but you'll have to actually
  visit the page to find them :)

## Uncategorized

Making this section because I don't even know if these are even good resources or what they really are.

- [The microarchitecture of Intel, AMD, and VIA CPUs](https://agner.org/optimize/microarchitecture.pdf)
