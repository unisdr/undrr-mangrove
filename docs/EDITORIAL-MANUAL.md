# Editorial manual for Mangrove

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/EDITORIAL-MANUAL.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-editorial-manual--docs).

This guide covers mechanical style rules — capitalization, punctuation, numbers and dates, abbreviations, italics, and spelling — for UI copy, component docs, and Storybook pages. It is derived from, and credits, two UN system sources:

- [UN Geneva Web Style Guide](https://www.ungeneva.org/en/styleguide) — written for web content, and the primary reference below.
- [UN Editorial Manual](https://www.un.org/dgacm/en/content/editorial-manual) ([Style section](https://www.un.org/dgacm/en/content/editorial-manual)) — written for formal UN documents; used as a fallback where the web style guide doesn't cover a case, and adapted for web/UI where a document-writing rule doesn't translate directly.

For UX writing principles — plain language, inclusive language, front-loading, writing for two audiences — see [Writing guidelines](WRITING.md) instead. This doc doesn't repeat those.

## Capitalization

- **Page and heading titles**: sentence case — capitalize only the first word and proper nouns. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide)) This matches Mangrove's existing "sentence case for all headings and titles" rule in [Writing guidelines](WRITING.md).
- **Menu items and nav labels**: capitalize each major word (skip articles, conjunctions, prepositions) — this is the one case where UN Geneva's web guide departs from sentence case, so use it specifically for menu/nav-style labels, not page headings. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Buttons, card links, captions**: capitalize the first word and proper nouns only, same as page headings. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Table cells**: capitalize the first word in every cell. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Generic terms stay lowercase** unless they're part of an official name — "press release", "human rights" are lowercase; "Summit of the Future" is capitalized because it names a specific event. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Titles/roles are capitalized only when concrete**, not generic: "the Director's" role and office are lowercase in general reference; "Project Director, Strategic Heritage Plan" is capitalized as an actual title. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide); [UN Editorial Manual, Capitalization](https://www.un.org/dgacm/en/content/editorial-manual/capitalization))
- **Small-letter proper nouns and product names stay lowercase even at the start of a heading** — e.g. `iSeek`, `eLUNa`. In component names and prop values, this means don't force-capitalize a brand or product string that's deliberately lowercase-led. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))

## Punctuation

- **Colon and semicolon**: no space before them; continue with a lower-case letter after. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide))
- **Comma**: no serial (Oxford) comma before "and" in a simple list — "organs, organizations and bodies", not "organs, organizations, and bodies". ([UN Editorial Manual, Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation))
- **Ampersand (`&`)**: fine in UI chrome (buttons, menu items) but avoid in running text unless it's part of a title; put a space on both sides. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide))
- **Slash (`/`)**: no space on either side when used to separate words. The UN Editorial Manual goes further for prose and discourages it outright in favor of "and"/"or" since its meaning is unclear — worth applying that stricter rule in component prop docs and error copy, where ambiguity is costly. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide); [UN Editorial Manual, Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation))
- **Full stop at the end of UI text**: skip it for short style elements — accordion headings, button/link text, list items in short lists — unless the item is a full sentence. Do use one to end running text/body copy. Never end a link or button with a full stop or exclamation mark unless it's the end of a complete sentence in running text. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide) and [Links](https://www.ungeneva.org/en/styleguide))
- **Quotation marks**: use only for actual quotes, not to "flag" a word. A full stop goes inside the closing quotation mark only if the entire sentence is inside the quote; otherwise it goes outside. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide))
- **En dash for ranges**: `2–4 per cent`, `3–6 p.m.`, `23 May–1 June 2026` — en dash (`–`), not a hyphen. ([UN Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))
- **Lists**: no punctuation after short list items; a full stop after each item only if items are full sentences; never a semicolon between items; no "and"/"or" tacked onto the last item; capitalize an item's first word only if the item is a full sentence. ([UN Geneva style guide, Lists](https://www.ungeneva.org/en/styleguide))

## Numbers and dates

- **Words vs. figures**: spell out numbers below 10 ("eight children"); use figures from 10 up, and always use figures for percentages, decimals, ratios, measurements, temperatures, money, ages, and voting results (e.g. "1% increase", "10.5°C", "$6.50", "15 votes to none"). ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide); [UN Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))
- **Large numbers**: pair millions/billions/trillions with a decimal numeral — "1.5 million", not "1,500,000" in running copy. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide))
- **Dates**: day, then month spelled out, then year, no punctuation — "12 January 2026", not "Jan 12, 2026" or "12/01/2026". This matches Mangrove's existing "10 October 2025" example in [Writing guidelines](WRITING.md); this doc gives the rule behind that example. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide))
- **Decades**: "the 1990s" — no apostrophe. ([UN Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))
- **Time**: 12-hour clock, `a.m.`/`p.m.`, a point (not a colon) between hours and minutes, no minutes shown on the hour — "9 a.m.", "8.30 p.m.". A UI component showing a machine-readable timestamp (e.g. a `<time>` element's `datetime` attribute) should still use ISO 8601 internally; this rule is for the human-readable label. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide))
- **Avoid relative date references** ("this year", "last month") in copy that might be read outside its original context (cached pages, exported PDFs, translated content) — use the specific date or year instead. ([UN Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))

## Abbreviations

- **Use sparingly** — a UI dense with unfamiliar abbreviations is harder to scan, not easier. ([UN Geneva style guide, Abbreviations](https://www.ungeneva.org/en/styleguide))
- **Spell out on first use, abbreviation in parentheses after** — e.g. "United Nations Office for Disaster Risk Reduction (UNDRR)" — and only introduce the abbreviation if it's actually used again later in the same content. ([UN Geneva style guide, Abbreviations](https://www.ungeneva.org/en/styleguide))
- **No periods in abbreviations** — "UNDRR", not "U.N.D.R.R.". ([UN Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))
- **Don't abbreviate in headings or titles.** ([UN Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))
- **Units of measure abbreviate without periods**: `cm`, `kg`, `km`, `ha`, `kW`, and data units like `GB`/`TB`. ([UN Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))

## Italics and emphasis

The UN Editorial Manual's italics rules are written for print/PDF documents; the web/UI equivalents below translate them for HTML and component docs:

- **Titles of published works** (books, publications, periodicals, films) → italicize with `<em>` or Markdown `_..._` in running text and docs prose. ([UN Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Foreign words not in general English use** → italicize on first use; a word common enough to appear in standard dictionaries doesn't need it. ([UN Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Scientific names** (genus/species) → italicize, e.g. rendering a species name in a data-viz label or table cell. ([UN Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Italics are never used for emphasis** in either source — not in prose, and not in UI copy. For UI emphasis, use a `<strong>`/bold treatment sparingly (see below), a callout/notice component, or better copy that doesn't need typographic emphasis at all. ([UN Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics); [UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Non-English organization names are never italicized.** ([UN Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Bold** is reserved for references to official UN documents, labels/categories, subheadings, and sparing highlighted text — not general emphasis. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Underline** is reserved for subheadings and introducing named entities — never for emphasizing running text (and on the web, avoid it outright outside of links, since an underline reads as a link affordance). ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **No ALL CAPS** for emphasis anywhere in content; where a design system displays a label in caps (e.g. a `text-transform: uppercase` chip or eyebrow style), the *authored* copy is still written in sentence case — the transform is presentation, not content. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))

## Spelling

This is the section most likely to catch out a contributor, since these terms come up in real UNDRR UI copy and docs.

- **Base dictionary**: British English, per the online Oxford Dictionary — same standard [Writing guidelines](WRITING.md) already assumes. ([UN Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))
- **"organization", "organize"** — `-ize`/`-ization`, not `-ise`/`-isation` (Oxford spelling, not `-ise` British spelling some other UK style guides use). ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"programme"** for a plan of activities (UNDRR's own programmes, funding programmes), reserving "program" only for software. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"Member State"/"Member States"** capitalized when referring to UN Member States; lowercase "state"/"states" otherwise. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"email"** — one word, no hyphen (an explicit exception to the general "e-" prefix hyphenation rule). ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"website", "web page"** — one word for "website", two for "web page". ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"human rights"**, **"civil society organization" (CSO)**, **"fundamental freedoms"** — lowercase as general terms. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"disability inclusion", "disability inclusive language"** — lowercase, no hyphen in "disability inclusion" as a noun phrase. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **Fractions in prose**: words, no hyphen — "one third of the total" — except when used as a compound adjective, which does take a hyphen: "a one-third share". ([UN Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))
- **`-ly` adverb + adjective compounds are never hyphenated** — "environmentally sustainable growth", not "environmentally-sustainable growth". This is a common one to get wrong in marketing-style card copy. ([UN Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))

> **Note:** The UN Geneva style guide's spelling list above is a small excerpt of general-interest terms. It also lists UN-Geneva-specific entities (Palais des Nations gates, internal systems like `gDoc`/`gMeets`) that are UNOG-specific and not relevant to UNDRR content — those are intentionally left out here. If you hit a spelling question this list doesn't answer, check the [UN Geneva style guide's full A–Z list](https://www.ungeneva.org/en/styleguide) or the [UN Editorial Manual's spelling list](https://www.un.org/dgacm/en/content/editorial-manual/spelling) before guessing.

## Keeping this updated

This is a **derived, curated subset** of the two UN sources above — not a verbatim copy, and not exhaustive. Both sources cover far more than is reproduced here (full A–Z spelling lists, document/resolution formatting, indirect speech, quotations, country names). Go to the source directly for anything not covered:

- [UN Geneva Web Style Guide](https://www.ungeneva.org/en/styleguide)
- [UN Editorial Manual — Style section](https://www.un.org/dgacm/en/content/editorial-manual): [Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations), [Capitalization](https://www.un.org/dgacm/en/content/editorial-manual/capitalization), [Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics), [Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time), [Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation), [Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling)

**When there's a conflict between the two sources**: the UN Geneva Web Style Guide wins for anything it addresses, since it's written for the web specifically. Fall back to the Editorial Manual only where the web style guide is silent, and translate document-writing rules to their web/UI equivalent explicitly (as this doc does for italics) rather than applying them literally to component markup.

**When to revisit this doc**:

- When UI copy introduces a new UN-specific term, acronym, or programme name not covered above — check the source spelling lists rather than guessing, and add it here if it's likely to recur.
- When a component's copy needs a capitalization, punctuation, or number-formatting call this doc doesn't cover — check the source pages first, then add the rule here with its citation.
- Periodically alongside major Mangrove releases, to confirm the source URLs and rules above still match the live UN Geneva style guide and Editorial Manual (both can and do change without notice — the style guide's own last-updated date is at the bottom of its page).

## Related documentation

- [Writing guidelines](WRITING.md) — UX writing principles, tone, inclusive language, and the "write for two audiences" model
- [Writing quick reference](WRITING-SHORT.md) — compact summary for AI tools and quick lookups
