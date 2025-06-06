# Inferred Nx Tasks

This is the companion repository for my blog post, [Inferred Config for Nx Monorepos](https://brianschiller.com/blog/2025/06/04/inferred-nx-config).

## Issues on nx@20.8.2

This repository was working with nx@19.5.4, but not with nx@20.8.2. You can try it out by running

```
pnpm install
pnpm exec nx run-many --target=test
```

On my machine, this fails with the following error:

```
 NX   Unexpected token '{'
```

I believe this is because Nx is trying to run `my-nx-plugin/src/index.ts` directly in Node, but it includes typescript syntax that Node doesn't understand.

I'm not sure why this worked with nx@19.5.4, but I wish it would work with nx@20.8.2. Is there a way to make it work?
