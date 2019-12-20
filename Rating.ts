import { types, flow } from 'mobx-state-tree';
import { mst, shim, action } from 'classy-mst';
import { servicesConfig } from "conf";
import Axios from 'axios';
import * as Logger from "js-logger";

export interface IRating {
    wdmRatingKey: number;
    rateAgainst: string;
    wdmItemIdOrMember: string;
    raterMemberOrUniqId: string;
    rating: number;
    raterIsMemberFlg: string;
}

const RatingData = types.model<IRating>("Rating",
    {
        wdmRatingKey: types.optional(types.number, 0),
        rateAgainst: types.optional(types.string, ""),
        wdmItemIdOrMember: types.optional(types.string, ""),
        raterMemberOrUniqId: types.optional(types.string, ""),
        rating: types.optional(types.number, 0),
        raterIsMemberFlg: types.optional(types.string, "No")

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

export interface IRatingActions {
    save(ratingData: IRating): Promise<number>;
    getRating(raterMemberOrUniqId: string, wdmItemIdOrMember: string): Promise<IRating>;
    updateRating(ratingData: IRating): Promise<boolean>;
    setRatingValues(wdmItemIdOrMember: string, raterMemberOrUniqId: string, rating: number,
        rateAgainst: string, raterIsMemberFlg: string): void;
}

export class RatingCode extends shim(RatingData) implements IRatingActions {

    @action
    setRatingValues(wdmItemIdOrMember: string, raterMemberOrUniqId: string, rating: number,
        rateAgainst: string, raterIsMemberFlg: string) {

        this.raterMemberOrUniqId = raterMemberOrUniqId;
        this.wdmItemIdOrMember = wdmItemIdOrMember;
        this.rateAgainst = rateAgainst;
        this.rating = rating;
        this.raterIsMemberFlg = raterIsMemberFlg;
    }

    @action
    updateRating(ratingData: IRating) {
        function* updateRatingInternal() {
            try {
                const result: any = yield Axios.post(servicesConfig.WDMGatewayRootUrl + "api/Rating", ratingData, {
                    headers: {
                        'token': localStorage.getItem('token')
                    }
                });
                const updated = result.data.value;
                return Promise.resolve(updated as any as boolean);
            } catch (error) {
                Logger.error(error);
                return Promise.resolve(false);
            }
        }

        return (flow<boolean>(updateRatingInternal)());
    }

    @action
    getRating(raterMemberOrUniqId: string, wdmItemIdOrMember: string) {
        const self = this;
        this.isLoading = true;
        this.isLoaded = this.isError = false;

        function* getRatingInternal() {
            try {
                const result: any = yield Axios.get(servicesConfig.WDMGatewayRootUrl + `api/rating/${wdmItemIdOrMember}/${raterMemberOrUniqId}`, {
                    headers: {
                        'token': localStorage.getItem('token')
                    }
                });
                self.isLoaded = true;
                const rating = (result.data.value as any as IRating);
                self.rateAgainst = rating.rateAgainst;
                self.raterIsMemberFlg = rating.raterIsMemberFlg;
                self.raterMemberOrUniqId = rating.raterMemberOrUniqId;
                self.rating = rating.rating;
                self.wdmItemIdOrMember = rating.wdmItemIdOrMember;
                self.wdmRatingKey = rating.wdmRatingKey;

            } catch (error) {
                Logger.error(error);
                self.isError = true;
            } finally {
                self.isLoading = false;
            }
            return Promise.resolve(self as any as IRating);
        }

        return (flow<IRating>(getRatingInternal)());
    }


    @action
    save(ratingData: IRating) {
        
        function* saveInternal() {
            try {

                let result: any = yield Axios.post(servicesConfig.WDMGatewayRootUrl + "api/Rating/create", ratingData,
                        {
                            headers: {
                                "token": localStorage.getItem("token"),
                            }
                        });

                return Promise.resolve(result.data.value as any as number);
            } catch (error) {
                console.log(error);
                return Promise.resolve(-1);
            } 
        }

        return (flow<number>(saveInternal)());
    }
    
}

export const RatingType = mst(RatingCode, RatingData);
export type RatingType = typeof RatingType.Type;

//------------------------------------ Rating ----------------------------------------