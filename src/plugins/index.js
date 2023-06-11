/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import pinia from '../store'

export function registerPlugins (app) {
  app.use(pinia)
}
