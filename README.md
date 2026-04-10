# Minimap Marker Tool

Static HTML app for reviewing minimap images one at a time, placing draggable markers, and exporting annotated copies.

The app expects the PNG files to live in the local `minimaps/` subfolder next to `index.html`.

## What it does

- Shows one minimap at a time with the filename as the title.
- Lists all minimaps in a left sidebar and marks completed ones with a green check.
- Supports red enemy-spawn dots, green atomicycle dots, blue capture-point circles, and delete mode.
- Lets users revisit any minimap and move or remove markers.
- Ends on a submit screen with username sanitization.
- Exports annotated PNGs plus `placements.json`.

## GitHub Pages note

GitHub Pages cannot save files into server-side user folders because it only hosts static files.

This app handles that limitation by:

- Saving directly into a local folder chosen by the user when the browser supports the File System Access API.
- Falling back to downloading a zip file named after the sanitized username.

## Files

- `index.html`
- `styles.css`
- `script.js`

## Publish

Upload the folder contents to a GitHub Pages repo or branch root, then open `index.html`.
