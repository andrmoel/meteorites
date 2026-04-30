import MeteorCenterParser from "./parsers/MeteorCenterParser";
import StrufeMeteoriteParser from "./parsers/StrufeMeteoriteParser";
import {MeteoritePrice} from "./types/MeteoritePriceTypes";
import DeckerMeteoriteParser from "./parsers/DeckerMeteoriteParser";
import Parser from "./parsers/Parser";
import SvMeteoriteParser from "./parsers/SvMeteoriteParser";
import SunOrgParser from "./parsers/SunOrgParser";
import AeroliteMeteoritesParser from "./parsers/AeroliteMeteoritesParser";
import PolandmetParser from "./parsers/PolandmetParser";
import AllmeteoriteParser from "./parsers/AllmeteoriteParser";
import MeteoloversParser from "./parsers/MeteoloversParser";
import IvesmirParser from "./parsers/IvesmirParser";
import MsgMeteoritesParser from "./parsers/MsgMeteoritesParser";
import IsaMeteoritesParser from "./parsers/IsaMeteoritesParser";
import PeltraMineralsParser from "./parsers/PeltraMineralsParser";
import cleanData from "./utils/cleanData";
import MeteoritesForSaleParser from "./parsers/MeteoritesForSaleParser";

export default async function getMeteoriteWebsitePrices(): Promise<Array<MeteoritePrice>> {
    const parsers: Array<Parser> = [
        new AeroliteMeteoritesParser(),
        new AllmeteoriteParser(),
        new DeckerMeteoriteParser(),
        new IsaMeteoritesParser(),
        new MeteorCenterParser(),
        new MeteoritesForSaleParser(),
        new MsgMeteoritesParser(),
        new PeltraMineralsParser(),
        new PolandmetParser(),
        new StrufeMeteoriteParser(),
        new SvMeteoriteParser(),
    ];

    const result = await Promise.all(
        parsers.map(async (parser) => {
            try {
                const result = await parser.getMeteoritePrices();

                console.log(`${parser.constructor.name}: ${result.length} results`);
                return result;
            } catch (error) {
                console.error(`Fail to parse ${parser.constructor.name}`);

                return [];
            }
        })
    );

    return cleanData(result.flat());
}
