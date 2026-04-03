# Custom icons

Hand-maintained SVGs for icons that aren't available from Lucide or OCHA. Currently this includes social media brand logos sourced from each platform's official brand guidelines:

- Facebook: https://about.meta.com/brand/resources/facebook/logo/
- X (formerly Twitter): https://about.x.com/en/who-we-are/brand-toolkit
- LinkedIn: https://brand.linkedin.com/
- YouTube: https://www.youtube.com/howyoutubeworks/resources/brand-resources/
- Flickr: https://www.flickrhelp.com/hc/en-us/articles/4404069466644-Flickr-brand-guidelines

New SVGs must use a `viewBox="0 0 24 24"` attribute. The build script removes `width`/`height` attributes via SVGO but does not resize the viewBox — an SVG with a different viewBox will render at the wrong aspect ratio. The build also strips `class` attributes, so do not rely on internal CSS classes in source SVGs.

SVGs are processed by `scripts/icon-build.cjs` into CSS `mask-image` rules.

Part of the icon font to CSS mask-image migration: https://github.com/unisdr/undrr-mangrove/issues/906
