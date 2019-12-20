import { GoogleLogin } from "react-google-login"
import { googleConfig } from "conf";
import { Google } from "../store/google-class"
import { observer, inject } from "mobx-react";
import { ILocalizeActions } from '../store/Localize';
import { Authentication, IAuthenticationActions } from "../utils/Authentication";
import * as React from "react";
import * as $ from 'jquery';
import { Grid } from 'semantic-ui-react';

interface IGoogleLoginButtonProps {
    authentication?: Authentication;
    parentCallback?(parent: any): void;
    parent?: any;
    localize?: ILocalizeActions;
    google?: Google;
    parentClickCallback?(parent: any): void;
    smallSize?: boolean;
    smallTitle?: string;
    failureGoogle?(parent: any): void;
}

interface IGoogleLoginButtonState {
    classNameMain: string;
}

@inject("localize", "google", "authentication")
@observer
export class GoogleLoginButton extends React.Component<IGoogleLoginButtonProps, IGoogleLoginButtonState> {

    constructor(props: any) {
        super(props);
        this.state = {
            classNameMain: "google-login-btn-main"
        };
    }


    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    componentWillMount() {

    }

    componentDidMount() {

        let intervalId = setInterval(() => {

            //spinner on 
            let parentElement = $('#parent_google_login_btn');
            if (parentElement && parentElement.length > 0) {
                parentElement.on("click",
                    () => {
                        if (this.props.parentClickCallback)
                            this.props.parentClickCallback(this.props.parent);
                    });

                clearInterval(intervalId);
            }
        },
            1000);
    }

    responseGoogle = (response: any) => {

        if (response) {
            this.props.google!.setGoogleAuthObject(response);

            let self = this;
            if (this.props.google!.getAccessToken() !== "") {
                localStorage.setItem("RememberMe", "true");
                self.props.parentCallback!(self.props.parent!);
            }
        }
    }

    responseFailureGoogle = (response: any) => {
        if (this.props.failureGoogle)
            this.props.failureGoogle(this.props.parent);
    }

    handleLeaveGoogleButton = () => {
        this.setState({ classNameMain: "google-login-btn-main" });
    }

    handleOverGoogleButton = () => {
        this.setState({ classNameMain: "google-login-btn-main-active" });
    }

    handleClickGoogleButton = () => {

    }


    render() {

        if (this.props.smallSize) {
            return <div>
                       <GoogleLogin
                           clientId={googleConfig.clientId}
                           onSuccess={this.responseGoogle}
                           onFailure={this.responseFailureGoogle}
                           className="google-login-small-btn-main"
                           type=""
                           tag="div">
                           <Grid>
                               <Grid.Row>
                                   <Grid.Column width={6} className="google-login-small-btn-clm-img">
                                       <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" className="google-login-small-btn-logo">
                                           <g>
                                               <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                               <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                               <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                               <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                               <path fill="none" d="M0 0h48v48H0z"/>
                                           </g>
                                       </svg>
                                   </Grid.Column>
                                   <Grid.Column width={10} className="google-login-btn-small-title">
                                       { this.props.smallTitle
                                           ? this.props.smallTitle
                                           : this.translate('loginModal.loginGoogleSmallButton').toString()
                                       }
                                   </Grid.Column>
                               </Grid.Row>
                           </Grid>
                       </GoogleLogin>
                   </div>;
        }

        return <div id="parent_google_login_btn"
            onMouseLeave={(e: any) => this.handleLeaveGoogleButton()}
            onMouseOver={(e: any) => this.handleOverGoogleButton()}>
            <GoogleLogin
                clientId={googleConfig.clientId}
                onSuccess={this.responseGoogle}
                onFailure={this.responseFailureGoogle}
                className={this.state.classNameMain}
                type=""
                tag="div">
                <div className="google-login-btn-area">
                    <div className="google-login-btn-logo">
                        <svg width="26px" height="26px" xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 50 50">
                            <path d="M25.996 48C13.313 48 2.992 37.684 2.992 25S13.312 2 25.996 2a22.954 22.954 0 0 1 15.492 5.996l.774.707-7.586 7.586-.703-.602a12.277 12.277 0 0 0-7.977-2.957c-6.766 0-12.273 5.504-12.273 12.27s5.507 12.27 12.273 12.27c4.879 0 8.734-2.493 10.55-6.739h-11.55V20.176l22.55.031.169.793c1.176 5.582.234 13.793-4.531 19.668C39.238 45.531 33.457 48 25.996 48z"></path>
                        </svg>
                    </div>
                    <div className="google-login-btn-empty-delimiter"></div>
                    <div className="google-login-btn-title">
                        {this.translate('loginModal.loginGoogleButton').toString()}
                    </div>
                </div>
            </GoogleLogin>
        </div>;
    }
}