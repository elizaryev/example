import { types, flow } from 'mobx-state-tree';
import { mst, shim, action } from 'classy-mst';
import { servicesConfig } from "conf";
import Axios from 'axios';
import * as Logger from "js-logger";

export interface IMember {
    memberKey: number;
    emailAddr: string;
    memberNickName: string;
    dateMember: string;
    profileHtml: string;
    employeeMemberFlg: string;
    memberRating: number;
}

const MemberData = types.model<IMember>("Member",
    {
        memberKey: types.optional(types.number, 0),
        emailAddr: types.optional(types.string, ""),
        memberNickName: types.optional(types.string, ""),
        dateMember: types.optional(types.string, ""),
        profileHtml: types.optional(types.string, ""),
        employeeMemberFlg: types.optional(types.string, "No"),
        memberRating: types.optional(types.number, 0)
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

export interface IMemberActions {
    load(): Promise<IMember>;
    loadByMember(member?: number): Promise<{}>;
    clear(): void;
    createMember(email: string, pass: string, name: string, gender: string): Promise<boolean>;
}

class MemberCode extends shim(MemberData) implements IMemberActions {

    @action
    clear() {
        const self = this;
        self.memberKey = -1;
        self.emailAddr = "";
        self.dateMember = "";
        self.memberNickName = "";
        self.profileHtml = "";
        self.employeeMemberFlg = "";
    }

    @action
    load() {
        const self = this;
        this.isLoading = true;
        this.isLoaded = this.isError = false;

        function* loadMemberInternal() {
            try {
                
                const token = localStorage.getItem('token');
                const result: any = yield Axios.get(servicesConfig.WDMGatewayRootUrl + "api/member", {
                    headers: {
                        'token': token
                    }
                });
                
                self.isLoaded = true;
                let member = result.data.value;
                self.memberKey = member.memberKey;
                self.emailAddr = member.emailAddr;
                self.dateMember = member.dateMember;
                self.memberNickName = member.memberNickName;
                self.profileHtml = member.profileHtml;
                self.employeeMemberFlg = member.employeeMemberFlg;
                self.memberRating = member.memberRating;
            } catch (error) {
                Logger.error(error);
                self.isError = true;
            } finally {
                self.isLoading = false;
            }
            return Promise.resolve(self as any as IMember);
        }

        return (flow<IMember>(loadMemberInternal)());
    }

    @action
    createMember(email: string, pass: string, name: string, gender: string) {
        const self = this;
        this.isLoading = true;
        this.isLoaded = this.isError = false;

        function* createAsync() {
            let created = false;
            try {

                const sendingData =
                {
                    email: email,
                    pass: pass,
                    name: name,
                    gender: gender
                };

                const result: any = yield Axios.post(servicesConfig.WDMGatewayRootUrl + "api/member/create", sendingData);

                self.isLoaded = true;
                created = (result.data.value as boolean);
            } catch (error) {
                Logger.error(error);
                self.isError = true;
            } finally {
                self.isLoading = false;
            }
            return Promise.resolve(created);
        }

        return (flow<boolean>(createAsync)());
    }

    @action
    loadByMember(member?: number) {

        const self = this;
        this.isLoading = true;
        this.isLoaded = this.isError = false;

        function* loadMemberInternal() {
            try {

                const result: any = yield Axios.get(servicesConfig.WDMGatewayRootUrl + "api/member/?member=" + member, {
                    headers: {
                        'token': localStorage.getItem('token')
                    }
                });
                self.isLoaded = true;
                let memberData = result.data.value;
                self.memberKey = (memberData.memberKey as number);
                self.emailAddr = (memberData.emailAddr as string);
                self.dateMember = (memberData.dateMember as string);
                self.memberNickName = (memberData.memberNickName as string);
                self.profileHtml = (memberData.profileHtml as string);
                self.employeeMemberFlg = (memberData.employeeMemberFlg as string);
                self.memberRating = (memberData.memberRating as number);
            } catch (error) {
                Logger.error(error);
                self.isError = true;
            } finally {
                self.isLoading = false;
            }
            return Promise.resolve(self as any as IMember);
        }

        return (flow(loadMemberInternal)());
    }
}

export const Member = mst(MemberCode, MemberData);
export type Member = typeof Member.Type;
export const memberCommon = (Member.create() as any as IMember);
//------------------------------------ Member ----------------------------------------

//------------------------------------ WdmMember ----------------------------------------

export interface IWdmMember {
    wdmMemberKey: number;
    member: number;
    memberRating: number;
}

const WdmMemberData = types.model<IWdmMember>("WdmMember",
    {
        wdmMemberKey: types.optional(types.number, -1),
        member: types.optional(types.number, -1),
        memberRating: types.optional(types.number, 0),
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

export interface IWdmMemberActions {
    loadByMember(member: number): Promise<IWdmMember>;
    updateWdmMember(wdmMember: IWdmMember): Promise<boolean>;
}

class WdmMemberCode extends shim(WdmMemberData) implements IWdmMemberActions {

    @action
    updateWdmMember(wdmMember: IWdmMember) {
        function* updateWdmMemberInternal() {
            try {
                
                const result: any = yield Axios.post(servicesConfig.WDMGatewayRootUrl + "api/wdmmember/update", wdmMember, {
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

        return (flow<boolean>(updateWdmMemberInternal)());
    }

    @action
    loadByMember(member: number) {
        const self = this;
        this.isLoading = true;
        this.isLoaded = this.isError = false;

        function* loadWdmMemberInternal() {
            try {
               
                const result: any = yield Axios.get(servicesConfig.WDMGatewayRootUrl + "api/wdmmember/?member=" + member, {
                    headers: {
                        'token': localStorage.getItem('token')
                    }
                });
                self.isLoaded = true;
                let wdmMemberValue = result.data.value;
                self.memberRating = (wdmMemberValue.memberRating as number);
                self.wdmMemberKey = (wdmMemberValue.wdmMemberKey as number);
                self.member = (wdmMemberValue.member as number);
            } catch (error) {
                Logger.error(error);
                self.isError = true;
            } finally {
                self.isLoading = false;
            }
            return Promise.resolve(self as any as IWdmMember);
        }

        return (flow<IWdmMember>(loadWdmMemberInternal)());
    }
}

export const WdmMember = mst(WdmMemberCode, WdmMemberData);
export type WdmMember = typeof Member.Type;
export const wdmMemberCommon = (WdmMember.create() as any as IWdmMember);

//------------------------------------ WdmMember ----------------------------------------
