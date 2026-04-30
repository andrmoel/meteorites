import {MeteoritePrice} from "../priceParser/types/MeteoritePriceTypes";

type Result = {
    meteoriteName: string;
    averagePricePerGramm: string;
    currency: 'EUR' | 'USD';
    sampleCount: number;
}

export default function getAveragePricePerMeteorite(meteoritePrices: Array<MeteoritePrice>): Array<Result> {
    const groups = new Map<string, Array<MeteoritePrice>>();

    for (const entry of meteoritePrices) {
        const key = `${entry.name}__${entry.currency}`;
        const group = groups.get(key) ?? [];
        group.push(entry);
        groups.set(key, group);
    }

    return Array.from(groups.entries()).map(([key, entries]) => {
        const currency = key.split('__')[1] as 'EUR' | 'USD';
        const pricesPerGramm = entries.map(e => e.pricePerGramm ?? e.price / e.weight);
        const average = pricesPerGramm.reduce((sum, p) => sum + p, 0) / pricesPerGramm.length;

        return {
            meteoriteName: entries[0].name,
            averagePricePerGramm: average.toFixed(2),
            currency,
            sampleCount: entries.length,
        };
    });
}
