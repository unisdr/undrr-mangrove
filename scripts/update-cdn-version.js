#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`Updating CDN links to use version ${version}...`);

// Files to update with their patterns
const filesToUpdate = [
  {
    path: 'README.md',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      },
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Documentation/GettingStarted.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Documentation/VanillaHtmlCss.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Documentation/Intro.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Components/Accordion/Accordion.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Components/StatsCardSlider/StatsCardSlider.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Components/LanguageSwitcher/LanguageSwitcher.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Utilities/ShowMore/ShowMore.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'stories/Atom/Layout/Grid/Grid.mdx',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  },
  {
    path: 'docs/RELEASES.md',
    patterns: [
      {
        from: /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/latest\//g,
        to: `https://assets.undrr.org/static/mangrove/${version}/`
      }
    ]
  }
];

// Update each file
filesToUpdate.forEach(fileConfig => {
  const filePath = fileConfig.path;

  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File ${filePath} not found, skipping...`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  fileConfig.patterns.forEach(pattern => {
    const newContent = content.replace(pattern.from, pattern.to);
    if (newContent !== content) {
      content = newContent;
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
  }
});

console.log(`\n🎉 CDN links updated to version ${version}!`);
console.log(`\nNote: The following files were updated to use tagged releases:`);
console.log(`- All documentation files now point to https://assets.undrr.org/static/mangrove/${version}/`);
console.log(`- Removed references to 'latest' and 'testing' endpoints`);
console.log(`- Users should now use stable, versioned assets instead of bleeding-edge ones`);