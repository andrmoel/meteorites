import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const BASE_URL = 'https://www.meteoriteandmore.com';

export default class MeteoriteAndMoreParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const response = await axios.get<string>(BASE_URL);
        const $ = cheerio.load(response.data);
        return this.parseProductsFromPage($);
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('div.card').each((_, el) => {
            const name = $(el).find('.card-header strong').text().trim();
            if (!name) return;

            // Weight: <small>Weight: <strong>47.7 gr</strong></small>
            const weightSmall = $(el).find('small').filter((_, s) => $(s).text().includes('Weight:'));
            const weightText = weightSmall.find('strong').first().text().trim();
            const weightMatch = weightText.match(/([\d.]+)\s*gr/i);
            if (!weightMatch) return;
            const weight = parseFloat(weightMatch[1]);
            if (isNaN(weight) || weight <= 0) return;

            // Price: <strong><i>EUR 2,400.00</i></strong>
            const priceText = $(el).find('strong i').text().trim();
            const priceMatch = priceText.match(/EUR\s*([\d,]+(?:\.\d+)?)/i);
            if (!priceMatch) return;
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (isNaN(price) || price <= 0) return;

            meteorites.push({name, weight, price, currency: Currency.EUR});
        });

        return meteorites;
    }
}
