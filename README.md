# IndusTrack marketing images

Static social post graphics published through Buffer. Folder per week (Monday date).

## Rendering
`node tools/render.js specs.json out/` renders each post's graphic spec. Brand styles (`style: "statement"` or `"stat"`, matching the past IndusTrack look with Poppins) also produce a 1080x1920 story version (`<id>-story.png`). The review page uses the same drawing code (tools/draw.js).

- `library/`: photos for post backgrounds (see library/README.md)
- `reference/`: past graphics and ads, for reference only
