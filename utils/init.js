import { readFile } from 'fs/promises';
const pkg = JSON.parse(
    await readFile(
        new URL('./../package.json',
            import.meta.url)
    )
);
import welcome from 'cli-welcome'
import unhandled from 'cli-handle-unhandled'

export default function() {
    unhandled();
    welcome({
        title: `DuckDuckGo Mail`,
        tagLine: `by lemons`,
        description: pkg.description,
        version: pkg.version,
        bgColor: '#36BB09',
        color: '#000000',
        bold: true,
        clear: false
    });
};