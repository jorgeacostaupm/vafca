# Correlation-derived networks

In **Derive networks → Correlation**, select Network A and Network B and click **Derive**. One pair is calculated at a time. If the correlation already exists (including the reversed pair), a notice is shown and no duplicate network is created. Pearson is the initial supported method. Inputs must use the same connectivity measure, node set, and node ordering; their sources, statistics, and dimension contexts may differ.

The calculation uses only unique undirected links (`i < j`) with finite numeric values in both inputs. Diagonal entries are excluded. At least two valid pairs and nonzero variance in both inputs are required. Invalid calculations create no network.

For valid pairs, each contribution is `(xᵢ − mean(x)) / Sₓ × (yᵢ − mean(y)) / Sᵧ`, where each S is the square root of its centered sum of squares. The upper-triangle contributions sum to Pearson r. The matrix mirrors contributions across the diagonal; diagonal and excluded entries are `null`. Only numerical overshoots within 1e-12 are clamped to [-1, 1]. Inputs are scaled before centering to avoid overflow.

The result summary shows r, total links, valid links, and excluded links. These values and the method are retained in derivation and provenance metadata. Matrix, node-link, circular, and 3D link tooltips show the ROI pair, signed contribution, and both original input values. Relative percentages are not computed.

Run the focused check with `node scripts/check-correlation.mjs`.
