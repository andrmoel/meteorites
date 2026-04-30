import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import {calculatePricePerGramm} from "./calculatePricePerGramm";
import cleanMeteoriteName from "./cleanMeteoriteName";

export default function cleanData(prices: Array<MeteoritePrice>): Array<MeteoritePrice> {
    return prices.map((price) => ({
        ...price,
        name: cleanMeteoriteName(price.name),
        pricePerGramm: calculatePricePerGramm(price.price, price.weight),
    }));
}
