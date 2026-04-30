export default function cleanMeteoriteName(name: string): string {
    return name
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\bNor[dt]h?\s*West\s+Africa\b/gi, 'NWA')
        .replace(/\S*(meteorit|mond|lunar|mars|moon|individual|complete|stone|slice|fragment)\S*/gi, '')
        .replace(/\s*-\s*Main\s+Mass\b.*/gi, '')
        .replace(/^\d+\s+/, '')
        .replace(/\s*-+\s*$/, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/(\d+)\s+\S*[a-zA-Z].*$/, '$1')
        .replace(/\b([A-Z]{2,})\b/g, (word) => word === 'NWA' || word === 'NEA' ? word : word[0] + word.slice(1).toLowerCase())
        .trim();
}
