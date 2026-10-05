# Reed’s Wildlife Photography

**[Visit the gallery on Reedos.dev](https://reedos.dev/wildlife-site/)** ·
[About the photographer](https://reedos.dev/wildlife-site/about.html)

Wildlife photographs organized into species galleries, places, photo essays and a
life list, with a full-frame lightbox. This repository holds the published static
site: HTML, exported images, styles, scripts and bundled fonts.

## Preview locally

From this repository’s root, with Python 3 installed:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. No package install or build step is needed to serve the
committed site. The pages include a Cloudflare Web Analytics beacon, so previewing
them can make an external request to `static.cloudflareinsights.com`.

## Files

- `index.html`, `explore.html`, `about.html`, `life-list.html`: entry pages.
- `species/`, `places/`, `journeys/`: individual galleries and essays.
- `img/`: published image exports, including responsive sizes.
- `static/`: styles, lightbox scripts, fonts and supporting assets.
- `robots.txt`, `sitemap.xml`: crawling and page discovery.

## Maintaining and publishing

This is the publication repository; the source photo library and site generator are
not included. Make ongoing content/design changes in the author’s publishing source
and regenerate its output so later publications retain them. A correction made only
to exported HTML can be overwritten by the next publication. Preserve this README
when copying generated output into the repository.

GitHub Pages publishes `main` from the repository root to
https://reedos.dev/wildlife-site/. Review changed pages locally, commit the intended
publication, push `main`, and confirm the Pages deployment and the Reedos.dev gallery.
The `.nojekyll` marker keeps the committed static files as the published output.

## Photographs and reuse

The repository does not include a license granting reuse of the photographs. Contact
the photographer through the [About page](https://reedos.dev/wildlife-site/about.html)
for permission before reusing them. Bundled third-party assets retain their own terms.
