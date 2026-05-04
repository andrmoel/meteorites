import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const BASE_URL = 'https://www.mhmeteorites.com/';

export default class MhMeteoritesParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const response = await axios.get<string>(BASE_URL);
        const $ = cheerio.load(response.data);
        return this.parseProductsFromPage($);
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        // Each product is in a div.card container
        $('div.card').each((_, cardEl) => {
            const name = $(cardEl).find('h4').first().text().trim();
            if (!name) return;

            // Weight in description paragraph: "1457 grams", "300 gram slice", "75 gram slice"
            const desc = $(cardEl).find('p').first().text().trim();
            const weightMatch = desc.match(/([\d.]+)\s*(kg|g(?:rams?)?)\b/i);
            if (!weightMatch) return;

            const weightVal = parseFloat(weightMatch[1]);
            const weight = weightMatch[2].toLowerCase() === 'kg' ? weightVal * 1000 : weightVal;
            if (isNaN(weight) || weight <= 0) return;

            // Price in <a href="order.html">$7000</a> – skip "Inquire" entries
            const priceText = $(cardEl).find('a[href="order.html"]').first().text().trim();
            const priceMatch = priceText.match(/\$([\d,]+(?:\.\d+)?)/);
            if (!priceMatch) return;

            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (isNaN(price) || price <= 0) return;

            meteorites.push({name, weight, price, currency: Currency.USD});
        });

        return meteorites;
    }
}
