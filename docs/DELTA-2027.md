# Delta 2027 theme

Delta 2027 adds the visual language supplied by Anders in the v0.7.2 handoff. The existing Delta theme keeps its name, stylesheet and appearance. This is an implementation for review, not approval of the redesigned application.

## Try it

Use the [local review guide](DELTA-2027-LOCAL-REVIEW.md) for an interactive comparison of the same components in both themes.

Load `css/style-delta-2027.css` and add `mg-theme-delta-2027` to the body or a wrapper. For pages switching between brands, load `css/style-all.css` instead. The source entry is `stories/assets/scss/style-delta-2027.scss`; the npm Sass entry is `scss/assets/scss/style-delta-2027.scss`.

Use separate wrappers or isolated frames for different brands. Nesting another brand inside Delta 2027 does not reset its component geometry. A theme class must also reach portal content; setting it on a wrapper does not automatically theme a popup appended to the body.

## Tokens and mappings

`tokens/delta-2027.tokens.json` is the editable source. It keeps the supplied taxonomy under `delta-2027` and maps it to Mangrove's existing roles. Extra Delta roles remain available without requiring every component to use them.

The handoff contains 112 `$value` entries. Of these, 111 describe typed values. The remaining entry, “WCAG 2.2 AA”, is an accessibility target, so it is retained as metadata rather than represented as an invented DTCG type. Two additional semantic aliases, selected action and toast surface, come from the supplied component descriptions. The source records the original file's SHA-256 and retains the supplied component specifications as metadata.

The build exports a complete document at `tokens/delta-2027.tokens.json` in the npm package and `dist/tokens/delta-2027.tokens.json` in build output. These are composed exchange documents; the similarly named repository authoring file depends on inherited Mangrove values. See [the token guide](DESIGN-TOKENS.md).

Delta colour properties such as `--mg-delta-2027-semantic-action-default` contain complete CSS colours. Existing properties such as `--mg-color-interactive` keep their channel contract. Do not wrap a complete colour in another `rgb()`. Adapters from complete colours to channels currently resolve at build time. Editing and rebuilding the source updates them; overriding only the complete-colour property at runtime does not update the materialised channel adapter.

## What this implements

Existing Mangrove components receive the warm page surface, new accent, Inter typography, compact controls, pill tabs, status dots, quieter cards and tables, and related dialog and notification surfaces. Component behaviour and public markup remain shared. The component recipes live in `_delta-2027-components.scss`; the supplied prose contains geometry that is not itself a token.

The supplied handoff also describes components and variants that Mangrove does not currently expose. This change does not add all of those components. In particular, a native Select retains its native popup; it cannot promise the handoff's checkmark-only custom menu. New text-button ghost and destructive variants require a separate component API decision. Existing toast placement and lifecycle remain unchanged.

The React Aria ComboBox pilot in #1088 remains a separate integration step. Its checkmark selection, popup theme inheritance and focus treatment need validation with the new theme before claiming parity.

## Accessibility and fonts

Actual field placeholders use the readable secondary text colour. The handoff's pale placeholder colour remains available for its intended decorative or disabled use. Normal status labels use the supplied 8px dot with visible text; forced-colours mode retains Mangrove's distinguishing status shapes. Field focus uses the inset treatment with a system-colour outline in forced-colours mode.

Inter and IBM Plex Mono are self-hosted under `fonts/delta-2027/` in the npm package, next to `css/`. The source folder contains OFL licences, original download URLs and checksums. Sass consumers with another output layout can configure `$font-path-delta-2027`. Arabic script routing continues to use Mangrove's Noto families; Latin islands return to Inter.

Visual review, automated checks and remaining limitations are recorded in the local review guide. Approval against the Figma designs and validation in the consuming Delta application remain separate from these implementation checks.
