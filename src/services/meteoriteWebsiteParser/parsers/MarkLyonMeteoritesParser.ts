import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";

const API_BASE = 'https://marklyonmeteorites.com/products.json';
const PER_PAGE = 250;

type ShopifyProduct = {
    title: string;
    variants: Array<{
        price: string;
    }>;
};

type ShopifyResponse = {
    products: ShopifyProduct[];
};

export default class MarkLyonMeteoritesParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];

        for (let page = 1; ; page++) {
            const response = await axios.get<ShopifyResponse>(API_BASE, {
                params: {limit: PER_PAGE, page},
            });

            const products = response.data.products;
            results.push(...this.parseProducts(products));

            if (products.length < PER_PAGE) break;
        }

        return results;
    }

    private parseProducts(products: ShopifyProduct[]): Array<MeteoritePrice> {
        return products.flatMap((p) => {
            const parsed = this.parseProduct(p);
            return parsed ? [parsed] : [];
        });
    }

    private parseProduct(product: ShopifyProduct): MeteoritePrice | null {
        // Weight always in title: "NWA 13351 1.23kg End Piece", "Jikharra 001 2.54kg End Piece"
        const weightMatch = product.title.match(/([\d.]+)\s*(kg|g)\b/i);
        if (!weightMatch) return null;

        const val = parseFloat(weightMatch[1]);
        const weight = weightMatch[2].toLowerCase() === 'kg' ? val * 1000 : val;
        if (isNaN(weight) || weight <= 0) return null;

        const price = parseFloat(product.variants[0]?.price ?? '0');
        if (isNaN(price) || price <= 0) return null;

        const weightIdx = product.title.search(/([\d.]+)\s*(kg|g)\b/i);
        const name = product.title.slice(0, weightIdx).replace(/[-–\s]+$/, '').trim();
        if (!name) return null;

        return {name, weight, price, currency: Currency.USD};
    }
}
