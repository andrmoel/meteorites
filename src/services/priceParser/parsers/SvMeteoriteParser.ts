import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

export default class SvMeteoriteParser implements Parser {
    private readonly baseUrl = 'https://sv-meteorites.com/meteorites/';

    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];

        const firstResponse = await axios.get<string>(this.baseUrl);
        let $ = cheerio.load(firstResponse.data);

        results.push(...this.parseProductsFromPage($));

        while (true) {
            const nextTarget = this.getNextPageEventTarget($);
            if (!nextTarget) break;

            const body = new URLSearchParams({
                __EVENTTARGET: nextTarget,
                __EVENTARGUMENT: '',
                __VIEWSTATE: ($('input[name="__VIEWSTATE"]').val() as string) ?? '',
                __VIEWSTATEGENERATOR: ($('input[name="__VIEWSTATEGENERATOR"]').val() as string) ?? '',
                __EVENTVALIDATION: ($('input[name="__EVENTVALIDATION"]').val() as string) ?? '',
            });

            const response = await axios.post<string>(this.baseUrl, body.toString(), {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            });

            $ = cheerio.load(response.data);
            results.push(...this.parseProductsFromPage($));
        }

        return results;
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('div.card.h-100').each((_, el) => {
            const name = $(el).find('div.card-header strong').text().trim();
            if (!name) return;

            const weightText = $(el).find('div.text small')
                .filter((_, s) => $(s).text().includes('Weight:'))
                .text();
            const weightMatch = weightText.match(/([\d.]+)\s*gr/i);
            if (!weightMatch) return;
            const weight = parseFloat(weightMatch[1]);
            if (isNaN(weight)) return;

            // Discounted items show final price in text-success; regular items use text-primary
            const priceSpan = $(el).find('span.text-success, span.text-primary').last();
            const priceMatch = priceSpan.text().match(/US\$\s*([\d,]+\.?\d*)/);
            if (!priceMatch) return;
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (isNaN(price)) return;

            meteorites.push({name, weight, price, currency: 'USD'});
        });

        return meteorites;
    }

    // Finds the "next page" chevron button and returns its __doPostBack event target.
    // Returns null when the current page is the last page (button is disabled/absent).
    private getNextPageEventTarget($: CheerioAPI): string | null {
        let target: string | null = null;
        $('a[href*="doPostBack"]').each((_, el) => {
            const inner = $(el).html() ?? '';
            if (inner.includes('bi-chevron-right') && !inner.includes('bi-chevron-double-right')) {
                const match = ($(el).attr('href') ?? '').match(/__doPostBack\('([^']+)'/);
                if (match) target = match[1];
            }
        });
        return target;
    }
}
