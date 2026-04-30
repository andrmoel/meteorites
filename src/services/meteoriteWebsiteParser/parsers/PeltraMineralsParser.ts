import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const BASE_URL = 'https://www.peltramminerals.com';
const START_URL = `${BASE_URL}/en/meteorites/`;

export default class PeltraMineralsParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];
        let url: string | null = START_URL;

        while (url) {
            const response = await axios.get<string>(url);
            const $ = cheerio.load(response.data);
            results.push(...this.parseProductsFromPage($));
            url = this.getNextPageUrl($);
        }

        return results;
    }

    private getNextPageUrl($: CheerioAPI): string | null {
        const href = $('link[rel="next"]').attr('href');
        if (!href) return null;
        return href.startsWith('http') ? href : `${BASE_URL}${href}`;
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('div.product').each((_, el) => {
            const fullName = $(el).find('a.name span').first().text().trim();

            // Name format: "Lunar meteorite Ash Shaqqah 002 – 1g – Libya"
            // Decimal separator is comma: "0,3g"
            const weightMatch = fullName.match(/[–-]\s*([\d,]+)\s*(kg|g)\b/i);
            if (!weightMatch) return;

            const weightValue = parseFloat(weightMatch[1].replace(',', '.'));
            if (isNaN(weightValue) || weightValue <= 0) return;
            const weight = weightMatch[2].toLowerCase() === 'kg' ? weightValue * 1000 : weightValue;

            // data-micro-price is the clean numeric price in USD
            const priceAttr = $(el).find('[data-micro="offer"]').attr('data-micro-price');
            if (!priceAttr) return;
            const price = parseFloat(priceAttr);
            if (isNaN(price) || price <= 0) return;

            const name = fullName.replace(/\s*[–-]\s*[\d,]+\s*(?:kg|g)\b.*/i, '').trim();
            if (!name) return;

            meteorites.push({name, weight, price, currency: Currency.USD});
        });

        return meteorites;
    }
}
