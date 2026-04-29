import MeteorCenterParser from "./parsers/MeteorCenterParser";
import StrufeMeteoriteParser from "./parsers/StrufeMeteoriteParser";
import {MeteoritePrice} from "./types/MeteoritePriceTypes";

export default async function getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
    const parsers = [
        new MeteorCenterParser(),
        new StrufeMeteoriteParser(),
    ];

    const result = await Promise.all(
        parsers.map((parser) => parser.getMeteoritePrices())
    );

    return result.flat();
}
