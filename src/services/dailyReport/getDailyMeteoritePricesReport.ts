import {MeteoritePrice} from "../meteoriteWebsiteParser/types/MeteoritePriceTypes";
import getExchangeRates from "../currency/getExchangeRates";
import {DailyMeteoritePrice} from "../meteoriteWebsiteParser/types/MeteoritePriceTypes";
import round from "lodash/round";
import dayjs from "dayjs";

export default async function getDailyMeteoritePricesReport(
    meteoriteWebsitePrices: Array<MeteoritePrice>
): Promise<Array<DailyMeteoritePrice>> {
    const exchangeRates = await getExchangeRates();
    const dateToday = dayjs().format('YYYY-MM-DD');

    const groups = new Map<string, Array<number>>();

    for (const entry of meteoriteWebsitePrices) {
        const pricePerGramm = entry.pricePerGramm ?? entry.price / entry.weight;
        const toUsd = exchangeRates.get(entry.currency) ?? 1;
        const pricePerGrammInUsd = pricePerGramm * toUsd;

        const group = groups.get(entry.name) ?? [];
        group.push(pricePerGrammInUsd);
        groups.set(entry.name, group);
    }

    return Array.from(groups.entries()).map(([meteoriteName, prices]) => {
        const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;

        return {
            meteoriteName,
            date: dateToday,
            averagePricePerGrammInUsd: round(average, 2),
            pricePerGrammHigh: round(Math.max(...prices), 2),
            pricePerGrammLow: round(Math.min(...prices), 2),
        };
    });
}
