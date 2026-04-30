import {MeteoritePrice} from "../types/MeteoritePriceTypes";

export default interface Parser {
    getMeteoritePrices(): Promise<Array<MeteoritePrice>>;
}
