import { types, flow } from 'mobx-state-tree';
import { mst, shim, action } from 'classy-mst';
import { servicesConfig } from "conf";
import Axios from 'axios';
import * as Logger from "js-logger";

export interface IPrice {
    price: number;
    optionPrice: number;
    hasPrice?: boolean;
    hasOptnPrice?: boolean;
}

const PriceData = types.model<IPrice>("Price",
    {
        price: types.number,
        optionPrice: types.number,
        hasPrice: types.optional(types.boolean, false),
        hasOptnPrice: types.optional(types.boolean, false)

    }).volatile((self) => (<{
        //Volatile variables
        isLoaded: boolean | undefined,
        isLoading: boolean | undefined,
        isError: boolean | undefined;
    }>{
            isLoaded: undefined,
            isLoading: undefined,
            isError: undefined
        }));

export interface IPriceActions {
    loadSingle(prodTypeKey: string, material: string, qty: string, sizeDimension: string, prodTypeOptnDtlKey: string, sideCount: number, force?: boolean): Promise<any>;
    getTotalPrice(): number | undefined;
    setPriceValues(price: number, optionPrice: number): void;
}

class PriceCode extends shim(PriceData) implements IPriceActions {

    @action
    setPriceValues(price: number, optionPrice: number) {
        this.price = price;
        this.optionPrice = optionPrice;
    }

    @action
    getTotalPrice() {
        return this.price + this.optionPrice;
    }

    @action
    loadSingle(prodTypeKey: string, material: string, qty: string, sizeDimension: string, prodTypeOptnDtlKey: string, sideCount: number, force?: boolean) {
        const _this = this;
        function* getPrice() {
            if (!force && _this.isLoaded) return Promise.resolve(_this);
            _this.isLoading = true;
            _this.isLoaded = false;
            try {

                const requestData =
                {
                    prodTypeKey: prodTypeKey,
                    material: material,
                    qty: qty,
                    sizeDimension: sizeDimension,
                    prodTypeOptnDtlKey: prodTypeOptnDtlKey,
                    sideCount: sideCount
                };
                const result: any = yield Axios.post(servicesConfig.WDMProductUrl + `price/single`, requestData);

                _this.price = result.data.value.price;
                _this.optionPrice = result.data.value.optnPrice;
                _this.hasPrice = result.data.value.hasPrice;
                _this.hasOptnPrice = result.data.value.hasOptnPrice;

            } catch (error) {
                Logger.error(error);
                _this.isLoaded = false;
                _this.isError = true;
                _this.isLoading = false;
                return Promise.reject(error);
            }
            _this.isLoading = false;
            _this.isLoaded = true;

            return Promise.resolve(_this);
        }
        return (flow(getPrice)());
    }

}

export const PriceType = mst(PriceCode, PriceData);
export type PriceType = typeof PriceType.Type;
export const price = PriceType.create({ price: 0, optionPrice: 0 });

//------------------------------------ Price ----------------------------------------