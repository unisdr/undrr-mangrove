# SVG viewport native Float32 readback

The source SVG import guard accepts a FRAME only when each native viewport dimension is finite and positive and equals its explicit source double or exactly `Math.fround(sourceDimension)`. Width and height are checked independently. No tolerance, nearby value or nonnumeric field is accepted.

The actual isolated English logo probe imported the 442 by 63.9 source viewport as 442 by 63.900001525878906. The latter is exactly the Float32 representation of 63.9. The previous absolute 0.000001 tolerance rejected this legitimate native readback. Evidence is preserved externally in `/tmp/mangrove-source-svg-viewport-diagnostic-20261006/import-viewport-tool.json` and its independent `viewport-field-independent-verdict.json`.

This change affects the fresh import acceptance guard only. It does not rescale paths, change layout or position rules, alter existing SVG ownership guards, or address the recovery section layout drift. Source/native crop, path topology and raster equivalence remain independent gates.

The dedicated SVG harness retains the existing source checkmark, paint, ownership and refusal coverage. An explicit 442 by 63.9 viewport fixture checks both exact double and exact Float32 height readbacks across all five brands. Two zero-create repeats retain wrapper/vector identities, paths and geometry without a rescale call. Adjacent Float32 values, nearby width/height values below the old tolerance, string/NaN/Infinity dimensions, zero/Infinity Float32 readbacks of finite positive tiny/huge source viewports and a non-FRAME import are refused. This fixture checks viewport fields and lifecycle, not the actual logo paths or native rendering.
