# soms.im

Official website for **SOMS (Simple Open Messaging Service)** — https://soms.im

- **Main Repository**: [hapood/simple-open-messaging-service](https://github.com/hapood/simple-open-messaging-service)
- **Live Playground**: [Playground](https://hapood.github.io/simple-open-messaging-service/)

## Preview and validate

Serve from the repository root (asset URLs are root-relative):

```sh
python3 -m http.server 8765
python3 scripts/check-site.py
node --check assets/site.js
node --check assets/detail.js
```

The four `/how-it-works/` pages each contain a single SVG and static technical
explanations. JavaScript enhances the diagram; the text remains available without
it. `/somfp/` is a legacy HTML redirect, not a server-level 301.

When publishing changes, update the asset version query strings together if the
scripts and SVG structure change. Set sitemap `lastmod` to the actual content
modification date, not the date of every request or automatic build.
