// The shared check server (tools/check_server.sh, port 5190): the project's config with HMR off, so other agents'
// edits in web/ never reload a page in the middle of a check; each new page load still gets the latest files.
import base from './vite.config.js';

export default { ...base, server: { ...(base.server || {}), hmr: false } };
