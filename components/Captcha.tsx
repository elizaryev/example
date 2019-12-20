import * as React from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { googleConfig } from "conf";
import { ILocalizeActions } from '../store/Localize';
import { inject } from "mobx-react";

export interface ICaptchaProps {
    onChange?(token: string | null, parent: any): void;
    onExpired?(parent:any): void;
    parent?: any;
    localize?: ILocalizeActions;
};

interface ICaptchaState {
   
}

@inject("localize")
export class Captcha extends React.Component<ICaptchaProps, ICaptchaState> {

    constructor(props: any) {
        super(props);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {
    }


    private onChangeCaptcha(token: string | null, self: any) {
        const hasToken = (token !== null || token !== "");
        if (hasToken && self.props.onChange) {
            self.props.onChange(token, this.props.parent);
        }
    }

    private onExpiredCaptcha(self: any) {
        if (self.props.onExpired)
            self.props.onExpired(this.props.parent);
    }

    render() {
        return <ReCAPTCHA
                   sitekey={googleConfig.captchaKey}
                   onExpired={() => this.onExpiredCaptcha(this)}
                   onChange={(token: string | null) => this.onChangeCaptcha(token, this)}/>;
    }
}

