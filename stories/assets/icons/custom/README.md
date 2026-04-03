# Custom icons

Hand-maintained SVGs for icons that aren't available from Lucide or OCHA. Currently this includes social media brand logos sourced from each platform's official brand guidelines:

- Facebook: https://about.meta.com/brand/resources/facebook/logo/
- X (formerly Twitter): https://about.x.com/en/who-we-are/brand-toolkit
- LinkedIn: https://brand.linkedin.com/
- YouTube: https://www.youtube.com/howyoutubeworks/resources/brand-resources/
- Flickr: https://www.flickrhelp.com/hc/en-us/articles/4404069466644-Flickr-brand-guidelines

All SVGs follow the 24x24 viewBox convention used by Lucide and OCHA icons. They get processed by `scripts/icon-build.cjs` into CSS `mask-image` rules.

Part of the icon font to CSS mask-image migration: https://github.com/unisdr/undrr-mangrove/issues/906
