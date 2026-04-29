import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";

export default class SvMeteoriteParser implements Parser {
    private readonly url = 'https://sv-meteorites.com/Meteorites';

    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        // TODO Implement
    }
}
