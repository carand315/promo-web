// Polyfill browser globals para el contexto SSR/prerender (Node.js)
if (typeof window === 'undefined') {
  (globalThis as unknown as Record<string, unknown>)['window'] = globalThis;
}

import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
