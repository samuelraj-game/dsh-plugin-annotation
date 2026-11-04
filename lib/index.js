/**
 * dsh-plugin-annotation, node half.
 *
 * Pure browser plugin: this host-side row only needs to exist for the Loader,
 * while the browser half ships through `exports["./client"]` and is discovered
 * from the `dsh.client` declaration in package.json.
 */

/** Host plugin body — this package contributes browser UI only. */
function apply() {}

export { apply };
