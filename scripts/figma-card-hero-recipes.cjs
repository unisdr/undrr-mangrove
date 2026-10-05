const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
/** Source-owned finite Card and Hero recipes. Native acceptance is separate. */

function buildCardHeroRecipes({ root, modes, variables, styles }) {
  const {
    refs,
    cardFile,
    heroFile,
    source,
    cardRule,
    heroRule,
    desktopImageWidth,
    value,
    number,
    geometry,
    widths,
    tones,
    surface,
    paints,
    gradientPaints,
    typography,
    fail,
    cardPresets,
    heroPresets,
    sampleGeometry,
  } = require('./figma-maintenance-card-hero-assets.cjs').buildCardHeroAssets({
    root,
    modes,
    variables,
    styles,
  });
  const photoFile = sampleGeometry.file;
  const photoBytes = fs.readFileSync(path.join(root, photoFile));
  const photoSha256 = crypto
    .createHash('sha256')
    .update(photoBytes)
    .digest('hex');
  if (photoSha256 !== sampleGeometry.sha256)
    fail('Source sample photograph changed; review dimensions and crop');
  const photo = {
    assetId: 'mangrove-sample-farmer',
    base64: photoBytes.toString('base64'),
    scaleMode: 'FILL',
  };
  const photoSource = {
    file: photoFile,
    sha256: photoSha256,
    width: sampleGeometry.width,
    height: sampleGeometry.height,
    description:
      'Existing repository sample farmer photograph, not the remote Card/Hero story photograph. Native crop/pixels remain unverified.',
  };
  const frame = (name, layout, children = [], extra = {}) => ({
    type: 'FRAME',
    id: name,
    name,
    fill: null,
    stroke: null,
    layout,
    children,
    ...extra,
  });
  const text = (name, property, characters, style, fill, extra = {}) => ({
    type: 'TEXT',
    id: name,
    name,
    textProperty: property,
    characters,
    textStyle: style,
    fill,
    stroke: null,
    textDecoration: 'NONE',
    textWrap: 'AUTO',
    layout: {
      width: 'FILL',
      height: 'HUG',
    },
    ...extra,
  });
  const action = (
    name,
    label,
    context = 'Base',
    width = 'HUG',
    extra = {}
  ) => ({
    type: 'INSTANCE',
    id: name,
    name,
    family: 'editorial-cta',
    variant: {
      Context: context,
      State: 'Default',
      Content: 'Short',
      Motion: 'NoPreference',
    },
    overrides: {
      Label: label,
    },
    expose: true,
    layout: {
      width,
      height: 'HUG',
    },
    ...extra,
  });
  const image = (name, width, height, extra = {}) => ({
    type: 'FRAME',
    id: name,
    name,
    image: {
      ...photo,
    },
    stroke: null,
    layout: {
      mode: 'NONE',
      width,
      height,
      clipsContent: true,
    },
    ...extra,
  });
  const column = (name, children, extra = {}) =>
    frame(
      name,
      {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'spacing/0',
        align: 'MIN',
      },
      children,
      extra
    );
  const cardLimits = [
    'Plain unlinked title, flat summary and an independent editorial button only; source linked title/inline fragment focus/chevron, rich HTML and motion are not represented.',
    'Book/HorizontalBook, Icon/Stats cards, equal-height galleries, arbitrary widths, RTL and native raster/font-file equivalence remain pending.',
    'Horizontal image visibility is fixed because removing source media changes grid columns; vertical image visibility is editable.',
    'Measured source browser geometry uses UNDRR. All-brand token/style values are exported, not visually accepted.',
  ];
  const heroLimits = [
    'Unlinked Section h2 and bounded Page h1, Default size, two editorial actions and existing sample image only. Page h1 retains source .02em letter spacing; Page Split is limited to default2/3 Desktop and stacked Mobile. Linked heading focus, logo, rich HTML, video/HTML media, no-media Split, Immersive/contained/Child, RTL and arbitrary responsive widths remain pending.',
    'Background Desktop image/veil is a finite measured-height preset. Edited copy may grow beyond it; gradients are bounded geometry, not live CSS viewport functions.',
    'Exact Condensed fonts are required; no substitution. Native gradient/crop/paint order, action style propagation and edited text acceptance are pending.',
    'Four source tones are represented. Secondary uses a leading8px rule, not an orange text-bearing surface.',
  ];
  const family = (id, name, sourceRef, limits) => ({
    id,
    name,
    kind: 'component-set',
    source: sourceRef,
    sourceRefs: refs,
    asset: photoSource,
    description: limits.join(' '),
    limitations: limits,
    variants: [],
    review: {
      genericLabels: false,
      preserveVariantSizing: true,
      width: 1280,
      specimens: [],
    },
  });
  const cardVertical = family(
    'card-vertical',
    'Mangrove/Card/Vertical',
    source(cardFile, /&__vc/),
    cardLimits
  );
  const cardHorizontal = family(
    'card-horizontal',
    'Mangrove/Card/Horizontal',
    source(cardFile, /&__hc/),
    cardLimits
  );
  const cardOptional = {
    'Show labels': {
      nodeName: 'mg-card__meta',
      defaultValue: true,
    },
    'Show summary': {
      nodeName: 'mg-card__summary box',
      defaultValue: true,
    },
    'Show CTA': {
      nodeName: 'mg-card / editorial action',
      defaultValue: true,
    },
  };
  cardVertical.optionalProperties = {
    ...cardOptional,
    'Show image': {
      nodeName: 'mg-card__visual',
      defaultValue: true,
    },
  };
  cardHorizontal.optionalProperties = {
    ...cardOptional,
  };
  const cardContent = horizontal =>
    column('mg-card__content', [
      frame(
        'mg-card__meta',
        {
          mode: 'HORIZONTAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/50',
          align: 'MIN',
        },
        [
          text(
            'mg-card__label 1',
            'Label 1',
            'Label 1',
            typography.cardLabel,
            'color/tag',
            {
              layout: {
                width: 'HUG',
                height: 'HUG',
              },
            }
          ),
          text(
            'mg-card__label 2',
            'Label 2',
            'Label 2',
            typography.cardLabel,
            'color/tag',
            {
              layout: {
                width: 'HUG',
                height: 'HUG',
              },
            }
          ),
        ],
        {
          visibilityProperty: 'Show labels',
        }
      ),
      column(
        'mg-card__title',
        [
          text(
            'mg-card / plain title',
            'Title',
            'Title in large size',
            typography.cardTitle,
            'color/text',
            {
              textWrap: 'BALANCE',
            }
          ),
        ],
        {
          bindings: {
            paddingTop: 'spacing/100',
            paddingBottom: 'spacing/75',
          },
        }
      ),
      column(
        'mg-card__summary box',
        [
          text(
            'mg-card__summary',
            'Summary',
            'Climate change affects vulnerable communities. Practical guidance can help protect health and strengthen resilience.',
            typography.cardSummary,
            'color/text',
            {
              textWrap: 'PRETTY',
            }
          ),
        ],
        {
          visibilityProperty: 'Show summary',
          bindings: {
            paddingBottom: geometry.paragraphBottom,
          },
        }
      ),
      action(
        'mg-card / editorial action',
        'Primary action',
        'Base',
        horizontal ? 'FILL' : 'HUG',
        {
          visibilityProperty: 'Show CTA',
        }
      ),
    ]);
  function cardVariant(target, tone, viewport, horizontal) {
    const { secondary, mobile, visualW, visualH, bottomPadding } =
      cardPresets.get(`${tone}/${viewport}/${horizontal}`);
    const visual = image('mg-card__visual', visualW, visualH, {
      stroke: paints.hairline,
      strokeAlign: 'OUTSIDE',
      bindings: {
        cornerRadius: geometry.visualRadius,
        strokeWeight: geometry.hairline,
      },
      ...(horizontal
        ? {}
        : {
            visibilityProperty: 'Show image',
          }),
    });
    const content = cardContent(mobile);
    const body = frame(
      'mg-card / source layout',
      {
        mode: horizontal && !mobile ? 'HORIZONTAL' : 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: horizontal ? 'spacing/100' : 'spacing/50',
        align: 'MIN',
        ...(horizontal && !mobile
          ? {
              minHeight: geometry.desktopMediaMin,
            }
          : {}),
      },
      [visual, content],
      {
        bindings: {
          paddingTop: 'card/padding',
          paddingBottom: bottomPadding,
          paddingLeft: 'card/padding',
          paddingRight: 'card/padding',
        },
      }
    );
    const children = secondary
      ? [
          frame(
            'mg-card / leading secondary rule',
            {
              mode: 'NONE',
              width: geometry.cardRule,
              height: 'FILL',
            },
            [],
            {
              fill: 'color/secondary',
            }
          ),
          body,
        ]
      : [body];
    const properties = {
      Tone: tone,
      Viewport: String(viewport),
      Link: 'Unlinked',
      CTA: 'ButtonOnly',
      State: 'Default',
    };
    const id = `${target.id}.${tone.toLowerCase()}.${viewport}.unlinked.buttononly.default`;
    target.variants.push({
      id,
      name: Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
      properties,
      tree: frame(
        'mg-card mg-card--no-link',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
          clipsContent: true,
        },
        children,
        {
          fill: 'card/background',
          effectStyle: 'shadow.raised',
          bindings: {
            cornerRadius: 'card/border-radius',
          },
        }
      ),
    });
  }
  for (const tone of tones) {
    for (const w of [300, 240]) cardVariant(cardVertical, tone, w, false);
    for (const w of [1280, 390]) cardVariant(cardHorizontal, tone, w, true);
  }
  const background = family(
    'hero-background',
    'Mangrove/Hero/Background',
    source(heroFile, /\.mg-hero\s*{/),
    heroLimits
  );
  const split = family(
    'hero-split',
    'Mangrove/Hero/Split',
    source(heroFile, /\.mg-hero--split\s*{/),
    heroLimits
  );
  const heroOptional = {
    'Show label': {
      nodeName: 'mg-hero__label box',
      defaultValue: true,
    },
    'Show detail': {
      nodeName: 'mg-hero__detail box',
      defaultValue: true,
    },
    'Show actions': {
      nodeName: 'mg-hero__buttons',
      defaultValue: true,
    },
    'Show second action': {
      nodeName: 'mg-hero / second action',
      defaultValue: true,
    },
  };
  background.optionalProperties = {
    ...heroOptional,
  };
  split.optionalProperties = {
    ...heroOptional,
  };
  const heroContent = (tone, mobile, isSplit, heading = 'Section') => {
    const context =
      tone === 'Tertiary'
        ? 'HeroTertiary'
        : tone === 'Quaternary'
          ? 'HeroQuaternary'
          : 'HeroPrimary';
    const label = column(
      'mg-hero__label box',
      [
        text(
          'mg-hero__label',
          'Label',
          'Guidance for resilient systems',
          typography.heroLabel,
          'color/neutral-0'
        ),
      ],
      {
        visibilityProperty: 'Show label',
        bindings: {
          paddingTop: 'spacing/25',
          paddingBottom: 'spacing/25',
          paddingRight: 'spacing/25',
        },
      }
    );
    const detail = column(
      'mg-hero__detail box',
      [
        text(
          'mg-hero__label detail',
          'Detail',
          '72-page publication',
          typography.heroDetail,
          'color/neutral-0'
        ),
      ],
      {
        visibilityProperty: 'Show detail',
        bindings: {
          paddingTop: 'spacing/25',
          paddingBottom: 'spacing/25',
          paddingRight: 'spacing/25',
        },
      }
    );
    return frame(
      'mg-hero__content',
      {
        mode: 'VERTICAL',
        width: 'FILL',
        height: 'HUG',
        gap: 'spacing/100',
        align: 'MIN',
      },
      [
        column('mg-hero__meta', [label], {
          bindings: {
            paddingBottom: 'spacing/25',
          },
        }),
        column(
          'mg-hero__title box',
          [
            text(
              heading === 'Page' ? 'mg-hero__title h1' : 'mg-hero__title h2',
              'Title',
              'Principles for resilient infrastructure',
              heading === 'Page'
                ? mobile
                  ? typography.heroPageTitleMobile
                  : typography.heroPageTitleDesktop
                : mobile
                  ? typography.heroTitleMobile
                  : typography.heroTitleDesktop,
              'color/hero-title',
              {
                textWrap: 'BALANCE',
              }
            ),
          ],
          {
            bindings: {
              paddingTop: 'spacing/100',
              paddingBottom: 'spacing/25',
            },
          }
        ),
        column(
          'mg-hero__summaryText box',
          [
            text(
              'mg-hero__summaryText',
              'Summary',
              'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.',
              typography.heroSummary,
              'color/neutral-0',
              {
                textWrap: 'PRETTY',
              }
            ),
          ],
          {
            bindings: {
              paddingBottom: 'spacing/25',
            },
          }
        ),
        column('mg-hero__meta meta-detail', [detail], {
          bindings: {
            paddingBottom: 'spacing/25',
          },
        }),
        frame(
          'mg-hero__buttons',
          {
            mode: mobile ? 'VERTICAL' : 'HORIZONTAL',
            width: 'FILL',
            height: 'HUG',
            gap: mobile ? 'spacing/100' : 'spacing/250',
            align: 'MIN',
            ...(!mobile
              ? {
                  wrap: 'WRAP',
                  counterGap: 'spacing/100',
                }
              : {}),
          },
          [
            action('mg-hero / first action', 'Read the principles', context),
            action(
              'mg-hero / second action',
              'Explore infrastructure resilience',
              context,
              'HUG',
              {
                visibilityProperty: 'Show second action',
              }
            ),
          ],
          {
            visibilityProperty: 'Show actions',
            bindings: {
              paddingTop: 'spacing/75',
              paddingBottom: 'spacing/50',
            },
          }
        ),
      ],
      {
        bindings: {
          paddingTop: isSplit
            ? geometry.splitContentTop
            : geometry.heroContentTop,
          ...(isSplit
            ? {
                paddingBottom: 'spacing/200',
              }
            : {}),
        },
      }
    );
  };
  function heroVariant(
    target,
    tone,
    mobile,
    ratio = 'Background',
    heading = 'Section'
  ) {
    const viewport = mobile ? 390 : 1280,
      secondary = tone === 'Secondary',
      isSplit = target === split;
    const properties = {
      Tone: tone,
      Viewport: String(viewport),
      Layout: isSplit ? (mobile ? 'Stacked' : ratio) : 'Background',
      Heading: heading,
      State: 'Default',
    };
    const id = `${target.id}.${tone.toLowerCase()}.${viewport}.${properties.Layout.toLowerCase().replace('/', '-')}.${heading.toLowerCase()}.default`;
    const desktopHeight =
      heading === 'Page'
        ? geometry.backgroundPageDesktopHeight
        : geometry.backgroundDesktopHeight;
    let tree;
    if (isSplit) {
      const { cw, mw, mh } = heroPresets.get(`${tone}/${mobile}/true/${ratio}`);
      const content = heroContent(tone, mobile, true, heading);
      content.layout.width = cw;
      const grid = frame(
        'mg-hero__split-grid mg-container',
        {
          mode: mobile ? 'VERTICAL' : 'HORIZONTAL',
          width: mobile ? 'FILL' : geometry.containerWidth,
          height: 'HUG',
          gap: mobile ? 'spacing/0' : 'spacing/200',
          align: 'MIN',
        },
        [content, image('mg-hero__media', mw, mh)],
        {
          bindings: {
            paddingLeft: 'spacing/100',
            paddingRight: 'spacing/100',
          },
        }
      );
      tree = frame(
        'mg-hero mg-hero--split',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          justify: 'CENTER',
          align: 'MIN',
        },
        secondary
          ? [
              frame(
                'mg-hero / leading secondary rule',
                {
                  mode: 'NONE',
                  width: geometry.heroRule,
                  height: 'FILL',
                },
                [],
                {
                  fill: 'color/hero--secondary',
                }
              ),
              frame(
                'mg-hero / centered split region',
                {
                  mode: 'HORIZONTAL',
                  width: 'FILL',
                  height: 'HUG',
                  gap: 'spacing/0',
                  justify: 'CENTER',
                  align: 'MIN',
                },
                [grid]
              ),
            ]
          : [grid],
        {
          fill: surface(tone),
        }
      );
    } else if (mobile) {
      const p = gradientPaints[tone === 'Secondary' ? 'Primary' : tone];
      const panel = frame(
        'mg-hero__overlay',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [heroContent(tone, true, false, heading)],
        {
          fill: p.panel,
          bindings: {
            paddingTop: 'hero-overlay/padding',
            paddingBottom: 'hero-overlay/padding',
            paddingLeft: 'hero-overlay/padding',
            paddingRight: 'hero-overlay/padding',
          },
        }
      );
      const panelRow = frame(
        'mg-hero / mobile panel region',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [panel],
        {
          fill: p.panel,
          bindings: {
            paddingLeft: 'spacing/100',
          },
        }
      );
      const stack = frame(
        'mg-hero / mobile composition',
        {
          mode: 'VERTICAL',
          width: 'FILL',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [
          image('mg-hero / banner image', 'FILL', geometry.bannerHeight),
          panelRow,
        ],
        {
          fill: p.panel,
        }
      );
      tree = frame(
        'mg-hero',
        {
          mode: 'HORIZONTAL',
          width: widths[viewport],
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        secondary
          ? [
              frame(
                'mg-hero / leading secondary rule',
                {
                  mode: 'NONE',
                  width: geometry.heroRule,
                  height: 'FILL',
                },
                [],
                {
                  fill: 'color/hero--secondary',
                }
              ),
              stack,
            ]
          : [stack],
        {
          fill: p.panel,
        }
      );
    } else {
      const toneKey = tone === 'Secondary' ? 'Primary' : tone,
        p = gradientPaints[toneKey];
      // Fixed source viewport geometry. Token-bound panel width/padding remains live,
      // but gradient stop geometry is a finite source specimen, not CSS calc().
      const undrr = modes.find(m => m.id === 'undrr') || modes[0],
        start = (viewport - 1164) / 2,
        copyEnd = Math.min(
          viewport,
          start + value('hero-overlay/max-width', undrr)
        ),
        fade = value('hero-scrim/fade', undrr);
      const { veilWidth } = heroPresets.get(`${tone}/${mobile}/false/${ratio}`);
      const paintWidth = value(veilWidth, undrr);
      const veil = frame(
        'mg-hero / source veil',
        {
          mode: 'NONE',
          width: veilWidth,
          height: desktopHeight,
          clipsContent: true,
        },
        [],
        {
          position: {
            x: secondary ? heroRule : 0,
            y: 0,
          },
          gradient: {
            layers: [
              {
                stops: [
                  {
                    position: 0,
                    color: paints.scrimClear,
                  },
                  {
                    position: 0,
                    color: paints.scrim,
                  },
                  {
                    position: copyEnd / paintWidth,
                    color: paints.scrim,
                  },
                  {
                    position: Math.min(1, (copyEnd + fade) / paintWidth),
                    color: paints.scrimClear,
                  },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
              {
                stops: [
                  {
                    position: 0,
                    color: p.clear,
                  },
                  {
                    position: 0,
                    color: p.start,
                  },
                  {
                    position: copyEnd / paintWidth,
                    color: p.middle,
                  },
                  {
                    position: 1,
                    color: p.end,
                  },
                ],
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        }
      );
      const overlay = frame(
        'mg-hero__overlay',
        {
          mode: 'VERTICAL',
          width: 'hero-overlay/max-width',
          height: 'HUG',
          gap: 'spacing/0',
          align: 'MIN',
        },
        [heroContent(tone, false, false, heading)],
        {
          position: {
            x: start + (secondary ? heroRule : 0),
            y: 0,
          },
          bindings: {
            paddingTop: 'hero-overlay/padding',
            paddingBottom: 'hero-overlay/padding',
            paddingLeft: 'hero-overlay/padding',
            paddingRight: 'hero-overlay/padding',
          },
        }
      );
      tree = frame(
        'mg-hero',
        {
          mode: 'NONE',
          width: widths[viewport],
          height: desktopHeight,
          clipsContent: false,
        },
        [
          image('mg-hero / background image', veilWidth, desktopHeight, {
            position: {
              x: secondary ? heroRule : 0,
              y: 0,
            },
          }),
          veil,
          ...(secondary
            ? [
                frame(
                  'mg-hero / leading secondary rule',
                  {
                    mode: 'NONE',
                    width: geometry.heroRule,
                    height: desktopHeight,
                  },
                  [],
                  {
                    fill: 'color/hero--secondary',
                    position: {
                      x: 0,
                      y: 0,
                    },
                  }
                ),
              ]
            : []),
          overlay,
        ],
        {
          fill: surface(tone),
        }
      );
    }
    target.variants.push({
      id,
      name: Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
      properties,
      tree,
    });
  }
  for (const tone of tones) {
    for (const mobile of [false, true]) heroVariant(background, tone, mobile);
    for (const ratio of ['2/3', '1/2', '1/3'])
      heroVariant(split, tone, false, ratio);
    heroVariant(split, tone, true);
  }
  for (const tone of tones) {
    for (const mobile of [false, true])
      heroVariant(background, tone, mobile, 'Background', 'Page');
    heroVariant(split, tone, false, '2/3', 'Page');
    heroVariant(split, tone, true, 'Background', 'Page');
  }
  for (const f of [cardVertical, cardHorizontal, background, split]) {
    f.review.specimens = [
      {
        id: 'editable-plain-copy',
        name: 'Editable plain source copy',
        width: Number(f.variants[0].properties.Viewport),
        instanceWidth: widths[Number(f.variants[0].properties.Viewport)],
        variant: {
          ...f.variants[0].properties,
        },
        properties: {
          Title: f.id.startsWith('hero')
            ? 'Principles for resilient infrastructure'
            : 'Title in large size',
          Summary: f.id.startsWith('hero')
            ? 'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.'
            : 'Climate change affects vulnerable communities. Practical guidance can help protect health and strengthen resilience.',
        },
      },
    ];
  }
  return [cardVertical, cardHorizontal, background, split];
}
module.exports = {
  buildCardHeroRecipes,
};
