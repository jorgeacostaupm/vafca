import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: DataSummarySection } = await server.ssrLoadModule('/src/components/management/components/DataSummarySection.tsx');
  const { initialDatasetState } = await server.ssrLoadModule('/src/store/slices/dataset/datasetTypes.ts');
  const render = dataset => renderToStaticMarkup(createElement(Provider, {
    store: configureStore({ reducer: () => ({ dataset }) }),
  }, createElement(DataSummarySection)));
  assert.match(render(initialDatasetState), /No dataset loaded yet/);
  const dataset = {
    ...initialDatasetState, id: 'test', label: 'Test', nodeSet: { nodes: [] },
    catalogs: {
      sources: { control: { label: 'Control', kind: 'population' }, patient: { label: 'Patients', kind: 'population' }, s1: { label: 'Subject 1', kind: 'subject' } },
      measures: { plv: { label: 'PLV' } }, statistics: { mean: { label: 'Mean' } },
      aspects: [{ id: 'band', label: 'Frequency band' }, { id: 'session', label: 'Session' }],
      aspectCatalogs: { band: { alpha: { label: 'Alpha' }, beta: { label: 'Beta' } } },
    },
  };
  const html = render(dataset);
  assert.match(html, /Data summary/);
  for (const [label, names] of [
    ['Populations', 'Control, Patients'], ['Subjects', 'Subject 1'], ['Measures', 'PLV'],
    ['Statistics', 'Mean'], ['Frequency band', 'Alpha, Beta'], ['Session', 'None'],
  ]) assert.ok(html.includes(`<dt>${label}:</dt> <dd>${names}</dd>`), `${label}: ${names}`);
  assert.doesNotMatch(html, /Download JSON|Matrix summary|Comparisons:/);
  console.log('Data summary checks passed: names, aspect layers, source kinds and empty data.');
} finally { await server.close(); }
