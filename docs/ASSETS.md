# Asset inventory

The project folder was empty when inspected. There were no attached or locally supplied logo concepts, posters, van images, project documents or existing application files.

- `public/images/home-illustration.svg`: original code-created interior illustration, labelled as an illustration in the website. It does not depict a Rose job or a real customer property. Native vector artwork avoids a large raster download.
- `components/brand.tsx`: provisional circular R wordmark, explicitly identified as provisional in the footer. It is not represented as the owner’s supplied logo.
- `lib/brand.ts`: central `logo` and `removalsVan` paths, initially null. Replace these with local image paths after source assets arrive.
- Rose Removals section: visible, labelled placeholder for the actual white van image. No substitute vehicle is presented as Rose’s van.

The cleaning and removals promotional posters were not reproduced, and no old discount was copied into the website. An attempted stock-photo download was rejected by automatic approval review because approval was required while the environment’s approval policy was disabled; no downloaded stock image is used.

Store approved source assets separately, then add suitably sized web derivatives under `public/images`. Use Next Image for raster delivery, correct dimensions and responsive `sizes`; keep the logo’s aspect ratio. Do not bake the provisional mark into other assets.
