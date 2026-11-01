# objectivismio

A single-page site for Objectivism, set in the poster’s brand system: cream ground, heavy black rules, caution yellow, orange, and a four-color stripe. The hero is the poster in `assets/objectivism-hero.png`.

## Run locally

From the repository root, serve the files with any static server:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

There is no build step. `index.html` and `styles.css` are the site. Paths are relative, so the same files work locally and on a project-site subpath.

## GitHub Pages

Pages serves the site from `/` (the published site root), not from `/docs`.

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys `index.html`, `styles.css`, and `assets/` to GitHub Pages on every push to `main`.

One-time setup:

1. Repository → **Settings** → **Pages**
2. **Build and deployment** → **Source**: GitHub Actions

After the workflow runs, the site is at:

[https://richardanaya.github.io/objectivismio/](https://richardanaya.github.io/objectivismio/)

Source: [github.com/richardanaya/objectivismio](https://github.com/richardanaya/objectivismio)

Inter is included under the SIL Open Font License (`assets/inter-OFL.txt`).
