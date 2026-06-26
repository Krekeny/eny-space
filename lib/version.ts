import pkg from "../package.json";

/** App version, sourced from package.json (bumped on each release/tag). */
export const APP_VERSION = pkg.version as string;
