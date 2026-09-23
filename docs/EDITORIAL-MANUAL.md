# Editorial manual for Mangrove

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/EDITORIAL-MANUAL.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-editorial-manual--docs).

This guide covers mechanical style rules – capitalization, punctuation, numbers and dates, abbreviations, italics, spelling, UNDRR-specific terminology, disability inclusive language and gender-inclusive language – for UI copy, component docs and Storybook pages. It is derived from, and credits, five sources (each fetched and checked against this doc on **23 September 2026** – see [Keeping this updated](#keeping-this-updated) for when to re-check):

- **UNDRR Publications SOP** (internal, UNDRR Communications team; `SOP_Publication-2026.docx`, fetched 23 September 2026) – the house style UNDRR uses for its own publications. Authoritative for anything UNDRR-specific: named entities (Sendai Framework targets/priorities/indicators, GAR, campaigns), terminology conventions and gender language choices. Not publicly linkable (UNDRR SharePoint); contact the Communications team for the current version.
- [UN Geneva Web Style Guide](https://www.ungeneva.org/en/styleguide) (fetched 23 September 2026) – written for web content; the primary reference for general web/UI mechanics not covered by the SOP.
- [United Nations Editorial Manual](https://www.un.org/dgacm/en/content/editorial-manual) (fetched 23 September 2026) – written for formal United Nations documents; used as a fallback where neither of the above covers a case, and adapted for web/UI where a document-writing rule doesn't translate directly. The UNDRR Publications SOP itself is built on this manual.
- [United Nations Disability-Inclusive Communications Guidelines](https://www.un.org/sites/un2.un.org/files/un_disability-inclusive_communication_guidelines.pdf) (Department of Global Communications, March 2022; fetched 23 September 2026) – authoritative for disability inclusive language and terminology specifically. Its own terminology table is itself sourced from the Disability-Inclusive Language Guidelines of the United Nations Office at Geneva.
- **DPI Gender Checklist for Content Creators** (Focal Points for Women and Gender, Department of Public Information, 2018; not confirmed to have a stable public URL – a copy was provided directly, checked 23 September 2026) – a one-page checklist for editorial teams; only its word-level "Check your words" guidance is in scope here. The rest of the checklist (narrative balance, image diversity, quantitative speaking-time checks) is content-strategy guidance for editorial teams producing stories, photography and video, not a mechanical style rule for a component library, so it isn't reproduced in this doc.

For UX writing principles – plain language, inclusive language, front-loading, writing for two audiences – see [Writing guidelines](WRITING.md) instead. This doc doesn't repeat those.

## Where these rules apply

The UNDRR Publications SOP and the United Nations Editorial Manual are written for publications and formal documents. Their rules apply to long-form content (reports, articles, docs prose, page body copy) and to interface microcopy (button labels, error and status messages, form help text) alike. Where a print rule doesn't translate to the web, the rule says so and gives the web/UI equivalent – as for list punctuation and italics.

## Capitalization

- **Page and heading titles**: sentence case – capitalize only the first word and proper nouns. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide)) This matches Mangrove's existing "sentence case for all headings and titles" rule in [Writing guidelines](WRITING.md).
- **Menu items and nav labels**: capitalize each major word (skip articles, conjunctions, prepositions) – this is the one case where UN Geneva's web guide departs from sentence case, so use it specifically for menu/nav-style labels, not page headings. un.org follows the same convention, and the MegaMenu story data already does. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Buttons, card links, captions**: capitalize the first word and proper nouns only, same as page headings. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Table cells**: capitalize the first word in every cell. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Generic terms stay lowercase** unless they're part of an official name – "press release", "human rights" are lowercase; "Summit of the Future" is capitalized because it names a specific event. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))
- **Titles/roles are capitalized only when concrete**, not generic: "the Director's" role and office are lowercase in general reference; "Project Director, Strategic Heritage Plan" is capitalized as an actual title. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide); [United Nations Editorial Manual, Capitalization](https://www.un.org/dgacm/en/content/editorial-manual/capitalization))
- **Small-letter proper nouns and product names stay lowercase even at the start of a heading** – for example `e-subscription` and `iSeek`. In component names and prop values, this means don't force-capitalize a brand or product string that's deliberately lowercase-led. ([UN Geneva style guide, Capitalization](https://www.ungeneva.org/en/styleguide))

## Punctuation

- **Colon and semicolon**: no space before them; continue with a lower-case letter after. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide))
- **Comma**: no serial (Oxford) comma before "and" in a simple list – "organs, organizations and bodies", not "organs, organizations, and bodies". ([United Nations Editorial Manual, Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation))
- **Ampersand (`&`)**: fine in UI chrome (buttons, menu items) but avoid in running text unless it's part of a title; put a space on both sides. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide))
- **Slash (`/`)**: no space on either side when used to separate words. The United Nations Editorial Manual goes further for prose and discourages it outright in favour of "and"/"or" since its meaning is unclear – worth applying that stricter rule in component prop docs and error copy, where ambiguity is costly. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide); [United Nations Editorial Manual, Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation))
- **Full stop at the end of UI text**: skip it for short style elements – accordion headings, button/link text, list items in short lists – unless the item is a full sentence. Do use one to end running text/body copy. Never end a link or button with a full stop or exclamation mark unless it's the end of a complete sentence in running text. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide) and [Links](https://www.ungeneva.org/en/styleguide))
- **Quotation marks**: use only for actual quotes, not to "flag" a word. A full stop goes inside the closing quotation mark only if the entire sentence is inside the quote; otherwise it goes outside. ([UN Geneva style guide, Punctuation](https://www.ungeneva.org/en/styleguide)) The UNDRR Publications SOP allows one specific exception – double quotation marks around a specialized term the first time it's introduced (e.g. defining "residual risk" in body copy or a glossary entry). That's the only UI case where quoting a single word is correct; don't extend it to ordinary emphasis. (UNDRR Publications SOP, Quotations)
- **En dash for ranges, pairs and asides**: number/year/date ranges (`2–4 per cent`, `2015–2030`, `11–13 December`), joined pairs (`cost–benefit ratio`) and a parenthetical aside, spaced on both sides (`The way in which such changes – including hazard intensity – affect human activity...`), all take an en dash (`–`), not a hyphen or an em dash. ([United Nations Editorial Manual, Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation); UNDRR Publications SOP, Punctuation)
- **No apostrophe on an abbreviation's plural**: `NGOs`, not `NGO's`. (UNDRR Publications SOP, Punctuation)
- **Lists**: no punctuation after short list items; a full stop after each item only if items are full sentences; never a semicolon between items in UI lists; no "and"/"or" tacked onto the last item; capitalize an item's first word only if the item is a full sentence. ([UN Geneva style guide, Lists](https://www.ungeneva.org/en/styleguide)) The UNDRR Publications SOP uses a semicolon between items for print/document lists – that's a print convention for long-form documents, not the UI rule above; don't apply it to Mangrove component lists.

## Numbers and dates

- **Words vs. figures**: spell out numbers below 10 ("eight children"); use figures from 10 up, and always use figures for percentages, decimals, ratios, measurements, temperatures, money, ages and voting results (e.g. "1% increase", "10.5°C", "$6.50", "15 votes to none"). ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide); [United Nations Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))
- **Large numbers**: pair millions/billions/trillions with a decimal numeral – "1.5 million", not "1,500,000" in running copy. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide)) Where a figure is shown in full rather than abbreviated (a table cell, a stat card), use a comma for four digits or more – "1,000", "12,452" – and always a decimal point, never a decimal comma. (UNDRR Publications SOP, Numbers, dates and time)
- **Percentages**: figure directly followed by `%` with no space – "25%" – except at the start of a sentence, where both are spelled out – "Twenty-five per cent". The United Nations Editorial Manual writes "per cent" in running text (as in its `2–4 per cent` range example above); in Mangrove UI copy and UNDRR content, follow the SOP and use `%`. (UNDRR Publications SOP, Numbers, dates and time)
- **Space between a number and its unit**: `10 cm`, `2 m`, `4 kg` – a space always separates them, except the percentage and degree symbols, which are closed up to the number (`25%`, `1.5°C`, `90°N`). This is a common miss in stat cards and measurement labels. (UNDRR Publications SOP, Numbers, dates and time; United Nations Editorial Manual, Numbers, dates and time)
- **Dates**: day, then month spelled out, then year, no punctuation – "12 January 2026", not "Jan 12, 2026" or "12/01/2026". This matches Mangrove's existing "10 October 2025" example in [Writing guidelines](WRITING.md); this doc gives the rule behind that example. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide))
- **Decades**: "the 1990s" – no apostrophe. ([United Nations Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))
- **Time**: 12-hour clock, `a.m.`/`p.m.`, a point (not a colon) between hours and minutes, no minutes shown on the hour – "9 a.m.", "8.30 p.m.". A UI component showing a machine-readable timestamp (e.g. a `<time>` element's `datetime` attribute) should still use ISO 8601 internally; this rule is for the human-readable label. ([UN Geneva style guide, Numbers, dates & times](https://www.ungeneva.org/en/styleguide))
- **Avoid relative date references** ("this year", "last month") in copy that might be read outside its original context (cached pages, exported PDFs, translated content) – use the specific date or year instead. ([United Nations Editorial Manual, Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time))

## Abbreviations

- **Use sparingly** – a UI dense with unfamiliar abbreviations is harder to scan, not easier. ([UN Geneva style guide, Abbreviations](https://www.ungeneva.org/en/styleguide))
- **Spell out on first use, abbreviation in parentheses after** – for example "United Nations Office for Disaster Risk Reduction (UNDRR)" – and only introduce the abbreviation if it's actually used again later in the same content. ([UN Geneva style guide, Abbreviations](https://www.ungeneva.org/en/styleguide))
- **No periods in abbreviations** – "UNDRR", not "U.N.D.R.R.". ([United Nations Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))
- **Don't abbreviate in headings or titles.** ([United Nations Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))
- **Units of measure abbreviate without periods**: `cm`, `kg`, `km`, `ha`, `kW` and data units like `GB`/`TB`. ([United Nations Editorial Manual, Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations))
- **Spell out "United Nations" in full in running text** – don't shorten it to "UN" in a sentence, including inside otherwise-abbreviated UI copy. Official names that contain "UN" (UN Women, UN-Habitat, UN Geneva) keep their own form. (UNDRR Publications SOP, Abbreviations and acronyms)
- **No "the" before an abbreviation or acronym, and never a possessive form of one** – not "the UNDRR", not "UNDRR's mandate". Rephrase instead: "the mandate of UNDRR". (UNDRR Publications SOP, Abbreviations and acronyms)
- **Avoid "e.g.", "i.e." and "etc." in running text** – spell out "for example" / "that is" / "and so on", or move the aside into a parenthetical or footnote where the Latin abbreviations are acceptable. (UNDRR Publications SOP, Abbreviations and acronyms)

## Italics and emphasis

The United Nations Editorial Manual's italics rules are written for print/PDF documents; the web/UI equivalents below translate them for HTML and component docs:

- **Titles of published works** (books, publications, periodicals, films) → italicize with `<em>` or Markdown `_..._` in running text and docs prose. ([United Nations Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Foreign words not in general English use** → italicize; a word common enough to appear in the online Oxford Dictionary (or the Editorial Manual's own spelling list) doesn't need it. ([United Nations Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Scientific names** (genus/species) → italicize, including a species name rendered in a data-viz label or table cell. ([United Nations Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Italics are never used for emphasis** in either source – not in prose, and not in UI copy. For UI emphasis, use a `<strong>`/bold treatment sparingly (see below), a callout/notice component or better copy that doesn't need typographic emphasis at all. ([United Nations Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics); [UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Non-English organization names are never italicized.** ([United Nations Editorial Manual, Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics))
- **Bold** is reserved for references to official United Nations documents, labels/categories, subheadings and sparing highlighted text – not general emphasis. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **Underline** is reserved for subheadings and introducing named entities – never for emphasizing running text (and on the web, avoid it outright outside of links, since an underline reads as a link affordance). ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))
- **No ALL CAPS** for emphasis anywhere in content; where a design system displays a label in caps (e.g. a `text-transform: uppercase` chip or eyebrow style), the *authored* copy is still written in sentence case – the transform is presentation, not content. ([UN Geneva style guide, Formatting content](https://www.ungeneva.org/en/styleguide))

## Spelling

This is the section most likely to catch out a contributor, since these terms come up in real UNDRR UI copy and docs.

- **Base dictionary**: British English, per the online Oxford Dictionary – same standard [Writing guidelines](WRITING.md) already assumes. This covers user-facing copy and docs prose; code identifiers, CSS properties and API names keep their own spelling (`color`, `center`). ([United Nations Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))
- **"organization", "organize"** – `-ize`/`-ization`, not `-ise`/`-isation` (Oxford spelling, not `-ise` British spelling some other UK style guides use). Exceptions that always take `-yse`: "analyse", "catalyse". ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide); UNDRR Publications SOP, Spellings)
- **"programme"** for a plan of activities (the programmes UNDRR runs, funding programmes), reserving "program" only for software. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"Member State"/"Member States"** capitalized when referring to United Nations Member States; lowercase "state"/"states" otherwise. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"email"** – one word, no hyphen (an explicit exception to the general "e-" prefix hyphenation rule). ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"website", "web page"** – one word for "website", two for "web page". ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"human rights"**, **"civil society organization" (CSO)**, **"fundamental freedoms"** – lowercase as general terms. ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **"disability inclusion", "disability inclusive language"** – lowercase, no hyphen in either. Formal titles keep their own form ("United Nations Disability-Inclusive Communications Guidelines"). ([UN Geneva style guide, Spelling](https://www.ungeneva.org/en/styleguide))
- **Fractions in prose**: words, no hyphen – "one third of the total" – except when used as a compound adjective, which does take a hyphen: "a one-third share". ([United Nations Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))
- **`-ly` adverb + adjective compounds are never hyphenated** – "environmentally sustainable growth", not "environmentally-sustainable growth". This is a common one to get wrong in marketing-style card copy. ([United Nations Editorial Manual, Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling))

> **Note:** The UN Geneva style guide's spelling list above is a small excerpt of general-interest terms. It also lists entities specific to UN Geneva (Palais des Nations gates, internal systems like `gDoc`/`gMeets`) that aren't relevant to UNDRR content – those are intentionally left out here. If you hit a spelling question this list doesn't answer, check the [UN Geneva style guide's full A–Z list](https://www.ungeneva.org/en/styleguide) or the [United Nations Editorial Manual's spelling list](https://www.un.org/dgacm/en/content/editorial-manual/spelling) before guessing.

## UNDRR-specific terminology

Rules and named entities that only make sense in UNDRR content – pulled from the UNDRR Publications SOP, the internal UNDRR house style built on top of the United Nations Editorial Manual. The SOP is the source for every rule here unless another source is cited inline.

- **"data" is plural** – "the data show", not "the data shows".
- **Be consistent about singular vs. plural "risk"** – decide per-document/per-component whether you mean the general concept ("risk") or countable instances ("risks"), and don't switch within the same piece of copy.
- **Avoid the first person** – no "we", "us", "our" or "I" in UNDRR content, including UI microcopy; write from a third-person or user-directed voice instead. In interface messages, name the thing that happened rather than who did it: "Your changes couldn't be saved", not "We couldn't save your changes"; "This page can't be found", not "We can't find the page". Addressing the user as "you" is still fine.
- **Sendai Framework references**: "Target A", "Target B" ... (not "target a" or "Target 1"); "Priority 1", "Priority 2" ...; "Indicator A-1", "Indicator B-2" ... for the 38 monitoring indicators. Capitalize the word (Target/Priority/Indicator) as part of the name.
- **Named entities – exact form, abbreviate only after first mention**: "Global Assessment Report on Disaster Risk Reduction 20XX (GAR20XX)"; "Sendai Framework for Disaster Risk Reduction 2015–2030" (then "Sendai Framework"); "Addis Ababa Action Agenda on Financing for Development" (then "Addis Ababa Action Agenda" or "AAAA"); "Transforming our world: the 2030 Agenda for Sustainable Development" (then "2030 Agenda"); "Sustainable Development Goals" (then "SDG"/"SDGs"); "MCR2030" for the current initiative (Making Cities Resilient 2030) and for Mangrove's MCR2030 theme – it's the initiative's own name, so use it as is rather than treating it as an abbreviation to expand; it succeeded the "Making Cities Resilient Campaign" (2010–2020), so don't use one name for the other; "Special Representative of the Secretary-General for Disaster Risk Reduction" – never abbreviated, no matter how often it recurs.
- **Country names**: use the UNTERM short form (e.g. "United States of America", shortened to "United States" after first mention) – never an abbreviation or acronym. Alphabetize country names in a list unless there's a specific reason not to.
- **Gender-neutral terms UNDRR has chosen**: "Chair" or "Chairperson" (not "Chairman"); "he/she" or "they"; "humankind"; "human-made". "Man-made" is reserved for direct quotations from paragraph 15 of the Sendai Framework resolution (A/RES/69/283) – never use it in original UNDRR copy.
- **Avoid gendered-default constructions and unnecessary gender-marking**: don't default a role to one gender and mark the other as an exception (e.g. "farmer" implying male, "farmer's wife" for the female case) or add a gender qualifier where it isn't relevant to the content ("female athlete" when the person's sex has no bearing on the story). **"Flip it to test it"**: when copy names or describes a person, mentally swap the gender – if the result reads strange or the example no longer makes sense, that's a sign of an unexamined bias worth fixing. (DPI [Department of Public Information] Gender Checklist for Content Creators, 2018, "Check your words")
- **Source attribution for data, charts and figures**: `*Source*: United Nations Office for Disaster Risk Reduction (YYYY)` (italicized "Source"), with a full citation in APA style where a references list exists. For a Mangrove component that renders a data source line (chart footers, stat cards), use this exact pattern rather than inventing a new one.

## Disability inclusive language

This section is scoped to terminology and copy – for keyboard/screen-reader/contrast requirements, see [Accessibility](ACCESSIBILITY.md), which this doc doesn't repeat. ([United Nations Disability-Inclusive Communications Guidelines](https://www.un.org/sites/un2.un.org/files/un_disability-inclusive_communication_guidelines.pdf))

- **Use person-first language**: "person with disability", "person with [type of impairment]", not identity-first phrasing ("disabled person"). In line with the CRPD (Convention on the Rights of Persons with Disabilities), this is the convention the United Nations has chosen and UNDRR content should follow it. The guide's own table makes an exception for "deaf person" and "blind person", which it lists as appropriate alongside the person-first forms. ("Written storytelling – Use person-first language")
- **Never use a euphemism or a term that implies pity, heroism or abnormality** – not "differently abled", "special needs", "people of determination", "handicapped" or "suffers from [condition]". These read as more polite but do the opposite: they distance the reader from calling disability what it is. ("Avoid pejorative language")
- **Avoid ableist language**, including using a disability term as a metaphor or adjective for something unrelated (e.g. "that's so OCD", "are you blind?"). ("Ableism in language")
- **"Persons with disabilities" is the correct term on its own** – it doesn't need to be softened or modified further.

**Recommended terms and terms to avoid** (a representative subset of the guide's full table – check the source PDF's Table 1 for the complete list, which also covers short stature, Down syndrome, albinism, leprosy and communication-device users):

| Use | Avoid |
|---|---|
| person with disability / persons with disabilities | disabled person, handicapped, differently abled, people of determination, special needs |
| person(s) without impairment, broader population | normal, healthy, able-bodied |
| person with an intellectual disability/impairment | retarded, slow, mentally handicapped |
| person with a psychosocial disability | insane, crazy, psycho, mentally ill |
| deaf person / person who is deaf / hard-of-hearing person | the deaf, hearing impaired, deaf and dumb |
| blind person / person who is blind / person with low vision | the blind, partially sighted |
| person with a physical disability/impairment | crippled, invalid, handicapped, physically challenged |
| wheelchair user / person who uses a wheelchair | confined to a wheelchair, wheelchair-bound |
| accessible parking / accessible bathroom | disabled parking, handicapped bathroom |

("Table 1: Appropriate and pejorative language", itself credited in the source to the Disability-Inclusive Language Guidelines of the United Nations Office at Geneva)

## Keeping this updated

**Sources last verified: 23 September 2026.** Every rule and citation above was checked against the live/current text of all five sources on that date. Update this date whenever the doc is re-checked, so a reader can tell at a glance how stale the citations might be.

This is a **derived, curated subset** of the five sources above – not a verbatim copy, and not exhaustive. All five cover far more than is reproduced here (full A–Z spelling lists, document/resolution formatting, indirect speech, quotations, image and map policy, publication process, visual storytelling and accessible-format guidance, narrative/imagery content-strategy checks). Go to the source directly for anything not covered:

- **UNDRR Publications SOP** (internal – UNDRR Communications team; not publicly linkable)
- [UN Geneva Web Style Guide](https://www.ungeneva.org/en/styleguide)
- [United Nations Editorial Manual – Style section](https://www.un.org/dgacm/en/content/editorial-manual): [Abbreviations](https://www.un.org/dgacm/en/content/editorial-manual/abbreviations), [Capitalization](https://www.un.org/dgacm/en/content/editorial-manual/capitalization), [Italics and bold print](https://www.un.org/dgacm/en/content/editorial-manual/italics), [Numbers, dates and time](https://www.un.org/dgacm/en/content/editorial-manual/numbers-dates-time), [Punctuation](https://www.un.org/dgacm/en/content/editorial-manual/punctuation), [Spelling](https://www.un.org/dgacm/en/content/editorial-manual/spelling)
- [United Nations Disability-Inclusive Communications Guidelines](https://www.un.org/sites/un2.un.org/files/un_disability-inclusive_communication_guidelines.pdf) (PDF)
- **DPI Gender Checklist for Content Creators** (2018; not publicly linkable – request a copy from the gender focal points in the Department of Global Communications, formerly DPI)

**When there's a conflict between the sources**, in priority order:

1. **UNDRR Publications SOP** wins for anything UNDRR-specific – named entities (Sendai Framework targets/priorities/indicators, GAR, campaigns), UNDRR terminology conventions and gender language choices – since it's the UNDRR house style.
2. **United Nations Disability-Inclusive Communications Guidelines** wins for disability terminology and framing specifically – it's the specialist United Nations system-wide source on that one topic.
3. **DPI Gender Checklist for Content Creators** wins for gender-bias review technique specifically (the "flip it to test it" check and avoiding gendered-default constructions) – it's the specialist source on that one topic.
4. **UN Geneva Web Style Guide** wins for general web/UI mechanics none of the above address, since it's written for the web specifically and the SOP is written for print/PDF publications.
5. **United Nations Editorial Manual** is the fallback where none of the above covers a case.

Translate a document-writing rule to its web/UI equivalent explicitly (as this doc does for italics and print-only list punctuation) rather than applying it literally to component markup.

**When to revisit this doc**:

- When UI copy introduces a new United Nations-specific or UNDRR-specific term, acronym, named entity or programme name not covered above – check the SOP and source spelling lists rather than guessing, and add it here if it's likely to recur.
- When a component's copy needs a capitalization, punctuation or number-formatting call this doc doesn't cover – check the source pages first, then add the rule here with its citation.
- When content references a type of disability or impairment not in the terminology table above – check the source PDF's full Table 1 before guessing at a term.
- When the UNDRR Publications SOP is updated (it's dated by year, e.g. "SOP_Publication-2026") – confirm the rules above still match and update citations to the current version.
- Periodically alongside major Mangrove releases, to confirm the source URLs and rules above still match the live UN Geneva style guide and Editorial Manual (both can and do change without notice – the style guide's own last-updated date is at the bottom of its page). Update the "Sources last verified" date above whenever this check happens, whether or not anything actually changed.

## Related documentation

- [Writing guidelines](WRITING.md) – UX writing principles, tone, inclusive language and the "write for two audiences" model
- [Writing quick reference](WRITING-SHORT.md) – compact summary for AI tools and quick lookups
