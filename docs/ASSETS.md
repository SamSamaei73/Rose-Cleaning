# Asset inventory

Updated for the official brand on 18 November 2026.

- `img/Logo.jpeg`: approved owner-supplied artwork, retained intact (1254 × 1254). `public/brand/Logo.jpeg` remains a byte-for-byte archival copy. On-page logos now use `public/brand/Logo-transparent.png` through `components/brand.tsx` and `lib/brand.ts`: a real-alpha cutout outside the circular badge, with the original decoded JPEG colour pixels retained exactly and the interior kept opaque.
- `public/brand/favicon-{16,32,48}.png` and `app/favicon.ico`: small icons derived from a faithful crop of the original R/rose artwork, with no redrawing or recolouring. Crop: x=100, y=175, width=680, height=580; fit within a square with the logo's dark background.
- `app/apple-icon.png` (180px) and `app/icon.png` (192px): complete approved artwork resized with its proportions preserved. Next.js file-based metadata serves these alongside the explicit small-icon links in `app/layout.tsx`. There was no existing web manifest to update.
- `public/images/photography/`: compressed, locally served photographic assets. See [PHOTOGRAPHY.md](PHOTOGRAPHY.md) for source pages, creators, licences, crops and limitations. These stock photographs do not depict Rose staff, customer jobs or owned vehicles.
- `lib/service-catalogue.ts`: the public catalogue's names, descriptions, image references, alt text and request destinations. Historical bookable service IDs remain in the existing operational catalogue.
- `public/images/home-illustration.svg`: retained legacy illustration; no longer used on public pages.
- Rose Removals: text section with an honest note that the original van image is still needed. `brand.removalsVan` remains unset. No unrelated vehicle is substituted.

The services poster was not present as an image in the workspace. Catalogue and contact updates follow the owner's supplied transcription. No promotional discounts were activated. A photograph of actual wheelie-bin washing is still welcome; the current related stock image shows bins.

Use Next Image and responsive sizes for future raster assets. Keep the approved logo separate from photography and decorative backgrounds. Replacing the brand image is a single configuration change; regenerate the small app icons when the approved artwork changes.

## Transparent logo follow-up

The built-in image editing tool supplied the cutout matte. Its colour output was not substituted for the official artwork: the final PNG combines the original JPEG's unchanged RGB pixels with the extracted alpha edge, normalising interior opacity. The canvas stays 1254 × 1254. Browser-sized derivatives are delivered by Next Image. Existing small favicon artwork remains unchanged.

Edit prompt: “Make a precise transparent PNG cutout of the entire circular badge. Remove only the black rectangular backdrop outside the outer copper rim. Preserve the dark burgundy interior, complete original artwork, proportions, colours, lettering and framing. No redrawing, re-lettering, redesign, cropping, padding or added shadow. Output real alpha transparency.”

The final file is `public/brand/Logo-transparent.png`; the original JPEG is unchanged. Pixel verification found zero changed RGB channels and 400,265 fully transparent pixels. Production build (including TypeScript), targeted lint, and Chrome desktop/mobile checks passed. The served 128px logo retains alpha transparency and is 12,224 bytes. Header/footer, login and registration all use the new asset. Pixel/alpha results and rendered screenshots are recorded locally in `.local/logo-transparency/`.
