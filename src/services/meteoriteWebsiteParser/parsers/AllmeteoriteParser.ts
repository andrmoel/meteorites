import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";
import * as cheerio from "cheerio";

const API_BASE = 'https://allmeteorite.com/wp-json/wc/store/v1/products';
const PER_PAGE = 100;

type WcProduct = {
    name: string;
    prices: {
        price: string;
        currency_code: string;
        currency_minor_unit: number;
    };
};

const RETRIES = 3;

export default class AllmeteoriteParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const firstResponse = await this.get(1);

        const totalPages = parseInt(firstResponse.headers['x-wp-totalpages'] ?? '1', 10);
        const results: Array<MeteoritePrice> = this.parseProducts(firstResponse.data);

        for (let page = 2; page <= totalPages; page++) {
            const response = await this.get(page);
            results.push(...this.parseProducts(response.data));
        }

        return results;
    }

    private async get(page: number, attempt = 1): Promise<Awaited<ReturnType<typeof axios.get<WcProduct[]>>>> {
        try {
            return await axios.get<WcProduct[]>(API_BASE, {params: {per_page: PER_PAGE, page}});
        } catch (err) {
            if (attempt >= RETRIES) throw err;
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            return this.get(page, attempt + 1);
        }
    }

    private parseProducts(products: WcProduct[]): Array<MeteoritePrice> {
        return products.flatMap((p) => {
            const parsed = this.parseProduct(p);
            return parsed ? [parsed] : [];
        });
    }

    private parseProduct(product: WcProduct): MeteoritePrice | null {
        // Name contains HTML entities, e.g. "Gyarub Zangbo 001 Pallasite #29 &#8211; 10,5 g"
        const rawName = cheerio.load(`<span>${product.name}</span>`)('span').text();

        // Weight is after an en-dash at end of name: "– 10,5 g" (comma as decimal separator)
        const weightMatch = rawName.match(/[–-]\s*([\d,]+)\s*g\s*$/);
        if (!weightMatch) return null;

        const weight = parseFloat(weightMatch[1].replace(',', '.'));
        if (isNaN(weight) || weight <= 0) return null;

        // Price is in minor currency units (cents for EUR, minor_unit=2)
        const price = parseInt(product.prices.price, 10) / Math.pow(10, product.prices.currency_minor_unit);
        if (isNaN(price) || price <= 0) return null;

        const currency = product.prices.currency_code === 'USD' ? Currency.USD : Currency.EUR;

        const name = rawName.replace(/\s*[–-]\s*[\d,]+\s*g\s*$/, '').trim();
        if (!name) return null;

        return {name, weight, price, currency};
    }
}
