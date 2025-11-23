import React from 'react';
import { App } from './app';
import { createRoot } from 'react-dom/client';

declare const document: any;

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
