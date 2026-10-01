# Sharing an interactive view

In a matrix, circular, or node-link view, open **Download chart → Interactive HTML**.
Send the downloaded `.html` file to another user. They can open it directly in a
browser, including offline; no VAFCA installation or dataset import is required.

The file captures the rendered view, including its current layout, zoom, colors,
and selections. It includes values for the rendered cells/links and the active
grouping legend. Hover a node to highlight its connections, or a link/cell to see
its value. Click to pin highlighting; press Escape or Clear highlighting to clear
it. Keyboard users can focus marks with Tab and pin them with Enter or Space.

This is a snapshot: it does not recalculate networks or expose editing, filtering,
or layout controls. 3D views are not included. The file contains the displayed
labels and values, so recipients can read them without the original dataset.

Runnable interaction and metadata check: `node scripts/check-interactive-export.mjs`.
