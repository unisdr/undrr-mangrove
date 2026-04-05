# Writing guidelines for Mangrove

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/WRITING.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-writing-guidelines--docs).

This guide helps anyone contributing to Mangrove write interface copy, documentation, and developer messages that:

- Improve user experience
- Maintain consistency across the platform
- Are accessible and inclusive
- Can be understood and applied by both humans and AI assistants

## Improve the user experience

- Make flows simpler, actions clearer, and decisions easier.
- Prefer verbs that match the action (for example, “Save changes” instead of “OK”).
- Break down complex steps into smaller, scannable chunks.
- Example: Instead of “Form submission failed,” use “We couldn’t save your changes. Try again in a few minutes.”
- Reference: [GOV.UK content design principles — writing for services](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)

## Tell the truth

- Be clear and honest. Avoid misdirection and false urgency.
- State limits and constraints explicitly (for example, file size caps) and admit uncertainty when needed.
- Example: “This file is too large to upload (max 10MB)” is better than “Upload failed.”
- Reference: [Nielsen Norman Group — error message guidelines](https://www.nngroup.com/articles/error-message-guidelines/)

## Include everybody

- Use inclusive, respectful language for all genders, ethnicities, abilities, orientations, and backgrounds.
- Avoid idioms, colloquialisms, and culturally specific metaphors.
- Provide alt text and meaningful, descriptive link text.
- Reference: [Microsoft writing style guide — inclusive communication](https://learn.microsoft.com/style-guide/inclusive-communication/)

## Say the right thing at the right time

- Provide relevant information exactly when users need it.
- Front‑load the most important detail. Make the next action obvious.
- Example: On a tracking page, show “Arrives tomorrow” before “Order #123456.”
- Reference: [GOV.UK — front‑load your content](https://www.gov.uk/guidance/content-design/writing-for-gov-uk#front-load-your-content)

## Write for two audiences

Technical documentation — especially component docs — serves two distinct audiences with different needs. Confusing them produces documentation that serves neither.

**Consumers** (integrators, builders) scan like a menu. They want to know: does this component do what I need, and what props does it take? Give them a one-line description, a working example, and a props table. That is often enough. Resist the urge to explain your internals.

**Maintainers** (library contributors, on-call debuggers) need the full picture: why a prop exists, why there are two data sources, why a field is sometimes null, what a past breaking change affected. This context prevents future developers from “fixing” things that weren’t broken.

The failure mode is writing one document that tries to serve both equally — too deep to skim, not structured enough to dig into. Instead:

- Lead with what it does
- Follow with how to use it (example first, then props)
- Place the “why” at the end, or in a collapsed details block

> “Too much information and no information accomplish the same goal.”
> — Ibrahim Diallo, [How do we get developers to read the docs?](https://idiallo.com/blog/how-do-we-get-developers-to-read-the-docs)

Also apply this at the API/component design level: consistent naming patterns mean consumers can guess correctly without reading anything. When `/user/orders` works, `/user/orders/123` should just work too.

Reference: [Ibrahim Diallo — How do we get developers to read the docs?](https://idiallo.com/blog/how-do-we-get-developers-to-read-the-docs)

## Serve a functional purpose

- Every piece of copy should guide, explain, or prevent errors — never filler.
- Example: Replace “Welcome to Settings” with “Change your password and update your email here.”
- Reference: [Material Design — writing guidelines](https://m2.material.io/design/communication/writing.html)

## Sometimes, no writing is best

- Remove unnecessary words when design alone works.
- Example: Do not add a “Welcome” banner to a calculator app.
- Reference: [Nielsen Norman Group — minimalist writing](https://www.nngroup.com/articles/minimalist-writing/)

## Stay consistent

- Use a shared vocabulary and messaging framework.
- Keep terms and tone consistent across components, docs, and code comments.
- Reference: [Mailchimp content style guide](https://styleguide.mailchimp.com/)

## Be good writing

- Prefer active voice; use plain language and short sentences.
- Read copy aloud to check rhythm and clarity.
- Reference: [PlainLanguage.gov — guidelines](https://www.plainlanguage.gov/guidelines/)

---

## Practical standards

- Sentence case for all headings and titles (capitalize proper nouns and acronyms like “UNDRR,” “UX,” “API”).
- Use descriptive link text (for example, “Read the API reference” instead of “Click here”).
- Error messages: say what happened, why it happened (if known), what to do next.
- Empty states: explain what’s missing, why it matters, and how to add content.
- Success messages: confirm the action and next steps (for example, “Changes saved. View details”).
- Confirmation dialogs: put the consequence in the title, and the primary action on the safest choice.

## Language mechanics and patterns

- Use second person (“you”) and speak directly to the user. Keep sentences and paragraphs short for scannability. Aim to front‑load key information. References: [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk), [PlainLanguage.gov](https://www.plainlanguage.gov/guidelines/)
- Structure pages with meaningful headings and lists. Make one point per paragraph, and prefer bulleted lists for steps and options. Reference: [PlainLanguage.gov](https://www.plainlanguage.gov/guidelines/)
- Use descriptive link text and avoid “click here.” Put the action or destination in the link. Reference: [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)
- Prefer sentence case for UI labels and headings; capitalize proper nouns and acronyms. Reference: [Material Design — writing](https://m2.material.io/design/communication/writing.html)
- Contractions are acceptable when they improve clarity and tone. Avoid exclamation marks and overly casual slang. Reference: [Mailchimp content style guide](https://styleguide.mailchimp.com/)
- Make dates and times unambiguous by writing out the month (for example, “10 October 2025”). Use units and numerals consistently. Reference: [PlainLanguage.gov](https://www.plainlanguage.gov/guidelines/)

## Error message patterns

- Include three parts where useful: what happened, why (if it helps), and what to do next. Keep the tone calm and helpful. Reference: [Nielsen Norman Group — error message guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- Place validation messages near the related field and preserve the user’s input. Don’t blame the user or expose raw error codes.
- Use buttons and links that state the next action (for example, “Try again” or “Upload a smaller file”).

## Inclusive communication

- Use gender‑neutral and inclusive language. Avoid ableist terms and culturally specific idioms. Reference: [Microsoft — inclusive communication](https://learn.microsoft.com/style-guide/inclusive-communication/)
- Write alt text that conveys purpose, not just appearance, and ensure link text is meaningful out of context.
- Prefer people‑first or identity‑first language according to the community’s preference when relevant. Reference: [Microsoft — inclusive communication](https://learn.microsoft.com/style-guide/inclusive-communication/)

### UN guidance for gender‑inclusive English

- Follow the United Nations strategies for gender‑inclusive language in English, using gender‑neutral terms by default (for example, “chair,” “spokesperson,” “humankind”). Avoid gender‑biased expressions and stereotypes. References: [UN gender‑inclusive language — guidelines](https://www.un.org/en/gender-inclusive-language/guidelines.shtml)
- Make gender visible only when relevant to the communication. Prefer neutral constructions (plural antecedents, relative pronoun “who,” or rephrasing to omit gendered pronouns). Reference: [UN gender‑inclusive language — guidelines](https://www.un.org/en/gender-inclusive-language/guidelines.shtml)

### Disability‑inclusive communication

Reference: [UN disability‑inclusive communications guidelines (PDF)](https://digitallibrary.un.org/record/4042358/files/1401388-EN.pdf)

#### Foundational principles

- Person‑first approach: focus on the individual, not the impairment (for example, “persons with disabilities”). Respect identity‑first language if preferred by the group or individual.
- Respect diversity: represent differences in age, gender, ethnicity, culture, and impairment type.
- Human rights–based model: frame disability as arising from social barriers, not individual deficits.
- Reject stereotypes: avoid pitying, “superhuman,” dangerous, or burdensome portrayals.
- Intersectionality: recognize overlapping identities (for example, disability and gender or refugee status) that can compound discrimination.

#### Content development

- Inclusive representation: include persons with disabilities across all topics, not only disability‑specific content.
- Affirmative and solution‑oriented storytelling: highlight agency and realistic challenges; emphasize solutions and social change over charity or pity.
- Authenticity: portray everyday roles and relationships (for example, professionals, parents, students).
- Emotional range: reflect diverse emotions; avoid purely inspirational or tragic tones.
- Consultation: involve persons with disabilities and OPDs in planning and reviews.
- Accurate context: mention impairments only when relevant, with informed consent.

#### Language and tone

- Use person‑first language where appropriate (for example, “person with a vision impairment”).
- Avoid euphemisms (for example, “special needs,” “differently abled”) and ableist terms or metaphors (for example, “crazy,” “OCD”).
- Use plain language and logical structure with clear headings.
- Provide accessible multilingual formats as needed (for example, sign language, Braille, large print, easy‑to‑read versions).

#### Visual and audio design

- Focus on the person; do not center assistive devices unless relevant.
- Show visible and non‑visible impairments across diverse contexts.
- Provide alt text and longer descriptions where needed; meet contrast ratios (at least 4.5:1 for body text, 3:1 for large text).
- Avoid triggers such as flashing lights or sudden loud sounds.
- Provide audio description, captions, and sign language interpretation as appropriate.

#### Accessible digital practices

- Use multimodal delivery (text, audio, video, tactile) to suit different needs.
- Structure for assistive tech: semantic headings, unique slide titles, table headers, correct reading order.
- Author accessible documents and formats (for example, sans‑serif fonts, left alignment, spacing; properly tagged PDFs/EPUBs).
- Social media: add alt text, use CamelCase hashtags, avoid image‑only posts for critical information.

## Localization and internationalization

- Avoid idioms, jokes, and region‑specific metaphors. Leave space for text expansion and avoid concatenating strings. References: [Microsoft — inclusive communication](https://learn.microsoft.com/style-guide/inclusive-communication/), [PlainLanguage.gov](https://www.plainlanguage.gov/guidelines/)
- Use clear, unambiguous formats for numbers, dates, and times. Write month names to avoid numeric ambiguity. Reference: [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)

## For AI assistants

- Adhere to this document as the source of truth for tone and style.
- Prioritize the short version in `docs/WRITING-SHORT.md` when loading context to reduce token usage.
- Keep headings in sentence case, and preserve proper nouns and acronyms.
- Extract and reuse terminology from existing Mangrove documentation to maintain consistency.

## Related documentation

- [Writing guidelines (short)](WRITING-SHORT.md) — quick-reference version of these rules
- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component

## Acknowledgements and sources

- Originally inspired by Nick DiLallo’s “This is good Writing — Eight principles for every interface you’ll ever write” ([UX Collective, 2020](https://uxdesign.cc/this-is-good-ux-writing-10c4b956a6c3)).
- The “Write for two audiences” section is inspired by Ibrahim Diallo’s “[How do we get developers to read the docs?](https://idiallo.com/blog/how-do-we-get-developers-to-read-the-docs)” (2025).
- Additional references are listed above in each section.
