# Do not delete this folder

This empty `pages/` directory exists on purpose. Next.js treats `src/pages` as
the Pages Router unless a root-level `pages/` folder is present, and our
`src/pages` is the **FSD `pages` layer**, not routing.

Routing lives in the root `app/` folder (App Router). Each route file there is a
thin re-export of a slice from `src/pages`.

See: https://feature-sliced.design/docs/guides/tech/with-nextjs
