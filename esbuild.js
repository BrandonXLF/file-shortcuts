const { build, context } = require('esbuild');

const args = process.argv.slice(2);
const PROD = args.includes('--production');

// @ts-check
/** @typedef {import('esbuild').BuildOptions} BuildOptions **/

// https://github.com/connor4312/esbuild-problem-matchers#esbuild-via-js
/** @type {import('esbuild').Plugin} */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });

        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });

            console.log('[watch] build finished');
        });
    },
};

/** @type BuildOptions */
const baseConfig = {
    bundle: true,
    minify: PROD,
    sourcemap: !PROD,
};

// Config for extension source code (to be run in a Node-based context)
/** @type BuildOptions */
const extensionConfig = {
    ...baseConfig,
    platform: 'node',
    mainFields: ['module', 'main'],
    format: 'cjs',
    entryPoints: ['./src/extension.ts'],
    outfile: './out/extension.js',
    external: ['vscode'],
};

/** @type BuildOptions */
const watchConfig = {
    plugins: [esbuildProblemMatcherPlugin],
};

// Build script
(async () => {
    try {
        if (args.includes('--watch')) {
            // Build and watch extension and webview code
            const ctx = await context({
                ...extensionConfig,
                ...watchConfig,
            });
            await ctx.watch();
        } else {
            // Build extension and webview code
            await build(extensionConfig);
            console.log('build complete');
        }
    } catch (err) {
        process.stderr.write(err.stderr);
        process.exit(1);
    }
})();
