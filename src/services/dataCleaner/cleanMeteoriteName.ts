export default function cleanMeteoriteName(name: string): string {
    return name
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\bNor[dt]h?\s*West\s+Africa\b/gi, 'NWA')
        .replace(/\S*(meteorit|mond|lunar|mars|moon)\S*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
