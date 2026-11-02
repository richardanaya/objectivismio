# objectivismio

A single-page site for Objectivism. The homepage is an HTML/CSS recreation of the poster: cream sheet, registration dots, four diagonal stripe bands, the five-column reason grid, and a scan-line Objectivism wordmark. `assets/objectivism-hero.png` is the same poster, used for the social preview image.

## Run locally

From the repository root, serve the files with any static server:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

There is no build step for the pages. `css/base.css` is the shared sheet. `css/home.css` is the poster. `css/article.css` is the essay layout. Paths are relative, so the same files work locally and on a project-site subpath. The body typesetter is the bundled `assets/typeset.js`; rebuild it with `npm run build:typeset` only if `src/` changes.

## GitHub Pages

Pages serves the site from `/` (the published site root), not from `/docs`.

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys `index.html`, `styles.css`, and `assets/` to GitHub Pages on every push to `main`.

One-time setup:

1. Repository → **Settings** → **Pages**
2. **Build and deployment** → **Source**: GitHub Actions

After the workflow runs, the site is at:

[https://richardanaya.github.io/objectivismio/](https://richardanaya.github.io/objectivismio/)

Source: [github.com/richardanaya/objectivismio](https://github.com/richardanaya/objectivismio)

Inter is included under the SIL Open Font License (`assets/inter-OFL.txt`). The wordmark is Geist Serif, also under the SIL Open Font License (`assets/geist-serif-OFL.txt`). The poster PNG is the social preview only. The brand column carries the dithered immortal-robot plate (`assets/immortal-robot-dither.png`).
