# Initial native plain TEXT source contract

`dev/native-source-text-contract.cjs` derives source expectations from validated component documents. It rejects duplicate source style IDs, duplicate managed TEXT keys and unknown style application values. The caller supplies an independently guarded native managed-key mapping and exact native style ownership map. This utility does not discover either mapping.

`validatePlainActual` checks nonempty native node identity, exact managed key and source characters, intended node and range style IDs, inherited or explicit decoration, contiguous UTF-16 coverage and each range’s exact characters. DIRECT template application expects a detached native style ID. Font, template paint, geometry, richer formatting, consumer ownership and complete native fields require additional gates.

The test reads the committed raw Book title diagnostic. It rejects both actual initial gaps: erased linked underline and the unlinked title’s linked style ID. Synthetic corrected rows prove gate mechanics only. UTF-16, foreign key, wrong copy, wrong range copy, missing ownership map and malformed source inputs are negative cases. No canvas repair or native rendering acceptance follows from a passing synthetic case.

Run `node examples/figma-plugin/dev/mock-native-source-text-contract.cjs`.

Before mode or repeat acceptance, compare every managed TEXT against its source contract. A stable repeated baseline can preserve an incorrect initial state. Load each operation’s exact concrete fonts and every applicable bound family before TEXT-affecting setters; validate all TEXT alias array entries separately from singleton style aliases. Retain complete attempted and affected IDs, font preparation, mode restoration and errors even when full snapshot encoding exceeds transport limits. Initial source fidelity, lifecycle stability, glyph metrics, pixels and publication are separate evidence.
