import * as React from "react";
import {
    Button, Icon, Modal, Grid, Input, InputOnChangeData, Label,
    Transition, Dimmer, Loader, Divider, Checkbox, CheckboxProps, Radio, List
} from "semantic-ui-react";
import { observer, inject } from "mobx-react";
import { ILocalizeActions } from '../store/Localize';
import { Authentication, IAuthenticationActions } from "../utils/Authentication";
import { FacebookLoginButton } from "react-social-login-buttons";
import { Facebook, Deferred } from "../store/facebook-class"
import { Google } from "../store/google-class"
import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { Member, IMemberActions } from "../store/model/Member";
import ReCAPTCHA from "react-google-recaptcha";
import { googleConfig } from "conf";
import { Captcha } from "../components/Captcha";
import { makeCancelable } from "../utils/DataLoader";

interface ILoginModalProps {
    showWindowExternal?: boolean;
    showTrigger?: boolean;
    authentication?: Authentication;
    parentCallback?(parent: any): void;
    parent?: any;
    localize?: ILocalizeActions;
    fb?: Facebook;
    google?: Google;
    signup?: boolean;
    memberCommon?: Member,
    onCancelLoginModal?(parent: any): void;
}

interface ILoginState {
    emailValue: string;
    passValue: string;
    passText: string; // todo: mask  password value
    errLblEmail: boolean;
    errLblPass: boolean;
    errLblWrongAuth: boolean;
    errLblWrongCaptcha: boolean;
    siginProc: boolean;
    checkedRememberMe: boolean;
    errLblName: boolean;
    errNameValidator: boolean;
    nameValue: string;
    genderMr: boolean;
    genderMiss: boolean;
    errEmailValidator: boolean;
    confirmEmailValue: string;
    errLblConfirmEmail: boolean;
    errConfirmEmailValidator: boolean;
    errLblCompareEmail: boolean;
    errLblConfirmPass: boolean;
    errComparePassValidator: boolean;
    confirmPassValue: string;
    signUp: boolean;
    isCaptchaVerified: boolean;
    tokenCaptcha: string;
}

@inject("localize", "fb", "authentication", "memberCommon", "google")
@observer
export class LoginModal extends React.Component<ILoginModalProps, ILoginState> {

    constructor(props: any) {
        super(props);
        this.state = {
            emailValue: "alex@youprint.com.tw", //default value vasily@dummysite.com
            passValue: "qpCpSrpzxrRYkK62", //default value vasily
            passText: "",
            errLblEmail: false,
            errLblPass: false,
            errLblWrongAuth: false,
            errLblWrongCaptcha: false,
            siginProc: false,
            checkedRememberMe: true,
            errLblName: false,
            errNameValidator: false,
            nameValue: "",
            genderMr: false,
            genderMiss: false,
            errEmailValidator: false,
            confirmEmailValue: "",
            errLblConfirmEmail: false,
            errConfirmEmailValidator: false,
            errLblCompareEmail: false,
            errLblConfirmPass: false,
            errComparePassValidator: false,
            confirmPassValue: "",
            signUp: false,
            isCaptchaVerified: false,
            tokenCaptcha: ""
    };
    }

    private showWindow: boolean = false;
    private isLoging: boolean = false;
    private nameRegexTemplate = new RegExp(/[!@%#№^\-\$\&\+\*\(\)_=\{\}\[\]\\|/:;"'`~“‘<>,\?]/);
    private checkedToken: Deferred = new Deferred();
    private storingToken: string ="";

    private cancelableSignInProc: any;
    private cancelIgnoreSigninProcess: any;

    private validateEmail(email: string) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    componentWillMount() {
        if (!this.isLoging && this.props.showWindowExternal) {
            this.showWindow = this.props.showWindowExternal;
        } else {
            this.openDialogHandler(false);
            if (this.props.parentCallback && this.props.parent) {
                this.props.parentCallback(this.props.parent);
            }
            //this.forceUpdate();
        }
        this.setState({ signUp: (this.props.signup) ? this.props.signup : false });
        if (this.props.signup) {
            this.props.google!.loadLangCaptcha();
        }

        localStorage.setItem("RememberMe", this.state.checkedRememberMe ? "true" : "false");
    }

    componentDidMount() {
        this.cancelableSignInProc = makeCancelable(
            new Promise(r => {
                this.setState({ siginProc: false });
                this.setState({ errLblWrongAuth: false, errLblEmail: false, errLblPass: false });
            })
        );

        this.cancelIgnoreSigninProcess = makeCancelable(
            new Promise(r => {
                this.setState({ errLblWrongAuth: false, siginProc: false });
            })
        );
    }

    componentWillUpdate(nextProps: any, nextState: any) {
        if (nextProps.showWindowExternal && !this.props.showWindowExternal) {
            this.showWindow = true;
        }
    }

    componentWillUnmount() {
        this.cancelableSignInProc.cancel();
        this.cancelIgnoreSigninProcess.cancel();
    }

    private openDialogHandler(isOpen: boolean = true) {
        this.showWindow = isOpen;
        this.forceUpdate();
    }

    private renderTriggerElement() {
        return this.props.showTrigger
            ? <Button animated="vertical"
                      onClick={(e) => this.openDialogHandler()}>
                  <Button.Content visible>Sign in</Button.Content>
                  <Button.Content hidden>
                      <Icon name="sign in"/>
                  </Button.Content>
              </Button>
            : <div></div>;
    }

    private resetErrLbl() {
        this.setState({ errLblEmail: false, errEmailValidator: false, errLblName: false, errNameValidator: false });
        this.setState({ errLblWrongAuth: false, errLblWrongCaptcha: false, errLblPass: false, errLblConfirmPass: false, errComparePassValidator: false });
        this.setState({ errLblCompareEmail: false, errLblConfirmEmail: false, errConfirmEmailValidator: false });
    }

    private clearValues() {
        this.setState({
            nameValue: "",
            emailValue: "",
            confirmEmailValue: "",
            passValue: "",
            confirmPassValue: "",
            isCaptchaVerified: false,
            tokenCaptcha: "",
            genderMr: false,
            genderMiss: false
        });
    }

    private onChangeName(data: InputOnChangeData) {
        this.setState({ nameValue: data.value });
        this.resetErrLbl();
    }

    private changeEmailHandler(data: InputOnChangeData) {
        this.setState({ emailValue: data.value });
        this.resetErrLbl();
    }

    private onChangeConfirmEmail(data: InputOnChangeData) {
        this.setState({ confirmEmailValue: data.value, });
        this.resetErrLbl();
    }

    private changePassHandler(data: InputOnChangeData) {
        this.setState({ passValue: data.value });
        this.resetErrLbl();
    }

    private onChangeConfirmPass(data: InputOnChangeData) {
        this.setState({ confirmPassValue: data.value, });
        this.resetErrLbl();
    }

    private handleClickCancel() {        

        this.isLoging = true;
        let self = this;
        this.checkToken();
        this.checkedToken.promise.then(() => {

            if (self.storingToken) {
                (self.props.authentication as any as IAuthenticationActions)
                    .isAnonymousUser(self.storingToken).then((isAnonymous) => {
                        if (isAnonymous) {
                            console.log("Can't re-create anonymous token!");
                            self.closeModalWnd(self);
                        } else {
                            // unless we have an anonymous token.
                            // but we have 'magic behavior' and we need to remove the anonymous token and create an anonymous token
                            self.generateAnonymousToken(self);
                        }
                    });
            } else {
                // not have anon token
                self.generateAnonymousToken(self);
            }
        });
    }

    private generateAnonymousToken(self: any) {

        (this.props.authentication as any as IAuthenticationActions).login("", "").then(() => {
            let token = localStorage.getItem("token");
            if (token == null) {
                console.log('Cant generated anonymous token!');
            }

            self.closeModalWnd(self);
        });
    }

    private closeModalWnd(self: any) {
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.showWindow = false;
        self.isLoging = false;

        if (self.props.onCancelLoginModal && self.props.parent) {
            self.props.onCancelLoginModal(self.props.parent);
        }

        self.cancelIgnoreSigninProcess.promise.then(() => { })
            .catch((reason: any) => console.log('LoginModal:ignore signin isCanceled', reason.isCanceled));
    }


    private onChangeCaptcha(token: string | null, parent: any) {
        const hasToken = (token !== null || token !== "");
        parent.setState({ isCaptchaVerified: hasToken, tokenCaptcha: (token) ? token : "" });
    }

    private onExpiredCaptcha(parent: any) {
        parent.setState({ isCaptchaVerified: false, tokenCaptcha: "" });
    }

    private checkToken(): void {
        let token = localStorage.getItem('token');
        if (token != null) {
            let self = this;
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                if (valid) {
                    self.storingToken = token!;
                }
                self.checkedToken.resolve();
            });
        } else {
            this.checkedToken.resolve();
        }
    }

    private generationTokenAction(action: string, fbAccessToken: string) {
         
        let self = this;
        this.checkToken();
        this.checkedToken.promise.then(() => {

            let getAnonymousStatePromise: Promise<boolean>;
            if (self.storingToken) {
                getAnonymousStatePromise =
                    (self.props.authentication as any as IAuthenticationActions)
                        .isAnonymousUser(self.storingToken);
            }


            var actionPromise: any;
            if (action === "facebook")
                actionPromise = (self.props.authentication as any as IAuthenticationActions).loginByFacebookAccessToken(fbAccessToken);
            else if (action === "google")
                actionPromise = (this.props.authentication as any as IAuthenticationActions)
                    .loginByGoogle(this.props.google!.getAccessToken(), this.props.google!.getOpenId());
            else
                actionPromise = (self.props.authentication as any as IAuthenticationActions)
                    .login(self.state.emailValue, self.state.passValue);
            
            actionPromise.then(() => {
                let token = localStorage.getItem("token");
                if (token != null) {
                    // if before was having token then must check on anonymous state 
                    // and if we need then remove anon token from tokenmanager storage
                    if (getAnonymousStatePromise) {
                        getAnonymousStatePromise.then((isAnonymous) => {
                            if (isAnonymous) {
                                (self.props.authentication as any as IAuthenticationActions)
                                    .removeToken(self.storingToken)
                                    .then((result) => {
                                        if (!result) {
                                            console.log('Cant remove token!');
                                        }
                                    });
                            }
                        });
                    }
                    self.setSuccess(self);
                    return;
                } else {
                    //if anonymous state then need restore anonymous token
                    if (getAnonymousStatePromise) {
                        getAnonymousStatePromise.then((isAnonymous) => {
                            if (isAnonymous) {
                                localStorage.setItem("token", self.storingToken);
                            }
                        });
                    }
                    self.setState({ errLblWrongAuth: true });
                }
                localStorage.setItem("RememberMe", self.state.checkedRememberMe ? "true" : "false");
                self.setState({ siginProc: false });
            });
        });
    }

    private handleClickSignIn() {

        if (this.state.passValue === "") {
            this.setState({ errLblPass: true });
            return;
        }
        if (this.state.emailValue === "") {
            this.setState({ errLblEmail: true });
            return;
        }

        this.setState({ siginProc: true });
        this.isLoging = true;
        this.generationTokenAction("", "");
    }

    private handleClickSignUp() {
        if (this.state.nameValue === "") {
            this.setState({ errLblName: true });
            return;
        }
        if (this.nameRegexTemplate.test(this.state.nameValue)) {
            this.setState({ errNameValidator: true });
            return;
        }
        if (this.state.emailValue === "") {
            this.setState({ errLblEmail: true });
            return;
        }
        if (!this.validateEmail(this.state.emailValue)) {
            this.setState({ errEmailValidator: true });
            return;
        }
        if (this.state.confirmEmailValue === "") {
            this.setState({ errLblConfirmEmail: true });
            return;
        }
        if (!this.validateEmail(this.state.confirmEmailValue)) {
            this.setState({ errConfirmEmailValidator: true });
            return;
        }
        if (this.state.confirmEmailValue !== this.state.emailValue) {
            this.setState({ errLblCompareEmail: true });
            return;
        }
        if (this.state.passValue === "") {
            this.setState({ errLblPass: true });
            return;
        }
        if (this.state.confirmPassValue === "") {
            this.setState({ errLblConfirmPass: true });
            return;
        }
        if (this.state.confirmPassValue !== this.state.passValue) {
            this.setState({ errComparePassValidator: true });
            return;
        }
        if (!this.state.isCaptchaVerified) {
            this.setState({ errLblWrongCaptcha: true });
            return;
        }

        this.setState({ siginProc: true });
        //generation new member
        let self = this;

        let gender = this.state.genderMr ? "mr" : this.state.genderMiss ? "miss" : "";
        (this.props.memberCommon! as any as IMemberActions).createMember(this.state.emailValue,
                this.state.passValue,
                this.state.nameValue,
                gender
                )
            .then((created) => {
                if (created) {
                    this.generationTokenAction("", "");
                } else {
                    self.setState({ errLblWrongAuth: true, siginProc: false });
                    console.log("Cant create new member!");
                }
            });
    }

    private setSuccess(self: any) {
        if (self.props.parentCallback && self.props.parent) {
            self.props.parentCallback(self.props.parent);
        }

        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.showWindow = false;
        self.isLoging = false;

        self.cancelableSignInProc.promise.then(() => {}).catch((reason: any) => console.log('LoginModal:sigin isCanceled', reason.isCanceled));
    }

    fbClicked = () => {
        let self = this;
        this.setState({ siginProc: true });
        this.props.fb!.getStatusAsync().promise.then(() => {
            const accessToken = self.props.fb!.getAccessToken();
            if (accessToken !== "") {
                localStorage.setItem("RememberMe", "true");
                this.generationTokenAction("facebook", accessToken);
            } else {
                self.setState({ siginProc: false, errLblWrongAuth: true });
            }
        });
    }

    googleClicked = (self: this) => {
        self.setState({ siginProc: true });
    }

    failureGoogle = (self: this) => {
        self.setState({ siginProc: false, errLblWrongAuth: true });
    }

    onChangeRememberMe = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
        localStorage.setItem("RememberMe", data.checked ? "true" : "false");
        this.setState({ checkedRememberMe: data.checked! });
    }

    onChangeGenderMr = () => {
       this.setState({ genderMr: true, genderMiss: false });
    }

    onChangeGenderMiss = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
        this.setState({ genderMr: false, genderMiss: true });
    }

    private onSwitchToSignIn() {
        this.setState({ signUp: false });
        this.resetErrLbl();
        this.clearValues();
    }

    private onSwitchToSignUp() {
        this.setState({ signUp: true });
        this.clearValues();
        this.resetErrLbl();
    }

    public googleCallback(self: any) {
        self.generationTokenAction("google", "");
    }


    private renderSignIn() {
        return <Grid>
                   <Grid.Row>
                       <Grid.Column width={4} className="login-modal-title">
                           {this.translate('loginModal.emailTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={10} className="login-modal-input">
                           <Input error={this.state.errLblEmail} value={this.state.emailValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                            this.changeEmailHandler(data)}/>
                           <Transition visible={this.state.errLblEmail} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing="left"attached="top" className="login-modal-err-lbl">
                                   {this.translate('loginModal.enterEmailText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={4} className="login-modal-title">
                           {this.translate('loginModal.passwordTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={10} className="login-modal-input">
                           <Input error={this.state.errLblPass} value={this.state.passValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                            this.changePassHandler(data)}/>
                           <Transition visible={this.state.errLblPass} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing="left"attached="top" className="login-modal-err-lbl">
                                   {this.translate('loginModal.enterPassTitle').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={4}/>
                       <Grid.Column width={10}>
                           <Checkbox label={this.translate('loginModal.rememberMeText').toString()} defaultChecked
                                     onChange={(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => this
                            .onChangeRememberMe(event, data)}/>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={4}/>
                       <Grid.Column width={10}>
                           <Button className="login-modal-submit"
                                   primary icon="blind"
                                   content={this.translate('loginModal.siginTitle').toString()}
                                   onClick={(e) => this.handleClickSignIn()}/>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={4} />
                       <Grid.Column width={10}>
                           {this.translate('loginModal.switchToSignUpTitle').toString()}
                           <span className="login-modal-link" onClick={() => this.onSwitchToSignUp()}>
                               {this.translate('loginModal.switchToSignUpLinkTitle').toString()}
                           </span>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={16}>
                            <Transition visible={this.state.errLblWrongAuth} duration={1} animation={"fade"}>
                               <Label basic color="red" attached="bottom">
                                   {this.translate('loginModal.errorAuthText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>
               </Grid>;
    }

    private renderSignUp() {
        return <Grid>
                    <Grid.Row>
                        <Grid.Column width={5} className="login-modal-title">
                            {this.translate('loginModal.nameTitle').toString()}:
                        </Grid.Column>
                        <Grid.Column>
                            <Input error={this.state.errLblName || this.state.errNameValidator} value={this.state.nameValue}
                                   onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                                       this.onChangeName(data)} />
                            <Transition visible={this.state.errLblName} duration={1} animation={"fade"}>
                                <Label basic color="red" pointing className="login-modal-err-lbl">
                                    {this.translate('loginModal.requiredNameText').toString()}
                                </Label>
                            </Transition>
                            <Transition visible={this.state.errNameValidator} duration={1} animation={"fade"}>
                                <Label basic color="red" pointing className="login-modal-err-lbl">
                                    {this.translate('loginModal.nameExpressionValidatorText').toString()}
                                </Label>
                            </Transition>
                        </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} className="login-modal-title">
                       </Grid.Column>
                        <Grid.Column width={11}>
                            <List horizontal>
                                <List.Item>
                                    <Radio
                                        label={this.translate('loginModal.genderMrTitle').toString()}
                                        name='radioGroupGenderMr'
                                        value='mr'
                                        checked={this.state.genderMr}
                                        onChange={this.onChangeGenderMr}
                                    />
                                </List.Item>
                                <List.Item>
                                    <Radio
                                        label={this.translate('loginModal.genderMissTitle').toString()}
                                        name='radioGroupGenderMiss'
                                        value='miss'
                                        checked={this.state.genderMiss}
                                        onChange={this.onChangeGenderMiss}
                                    />
                                </List.Item>
                            </List>
                        </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} className="login-modal-title">
                           {this.translate('loginModal.emailTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={11} className="login-modal-input">
                           <Input error={this.state.errLblEmail || this.state.errEmailValidator} value={this.state.emailValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                            this.changeEmailHandler(data)}/>
                           <Transition visible={this.state.errLblEmail} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.enterEmailText').toString()}
                               </Label>
                           </Transition>
                           <Transition visible={this.state.errEmailValidator} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.emailExpressionValidatorText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                    </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} className="login-modal-title">
                           {this.translate('loginModal.confirmEmailTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={11} className="login-modal-input">
                            <Input error={this.state.errLblConfirmEmail || this.state.errConfirmEmailValidator || this.state.errLblCompareEmail} 
                                    value={this.state.confirmEmailValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                                      this.onChangeConfirmEmail(data)} />
                           <Transition visible={this.state.errLblConfirmEmail} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                    {this.translate('loginModal.requiredConfirmEmailText').toString()}
                               </Label>
                           </Transition>
                           <Transition visible={this.state.errConfirmEmailValidator} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.confirmEmailExpressionValidatorText').toString()}
                               </Label>
                           </Transition>
                           <Transition visible={this.state.errLblCompareEmail} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.compareEmailValidatorText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} className="login-modal-title">
                           {this.translate('loginModal.passwordTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={11} className="login-modal-input">
                           <Input error={this.state.errLblPass} value={this.state.passValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                            this.changePassHandler(data)}/>
                           <Transition visible={this.state.errLblPass} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.enterPassTitle').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                    </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} className="login-modal-title">
                           {this.translate('loginModal.confirmPassTitle').toString()}:
                       </Grid.Column>
                       <Grid.Column width={11} className="login-modal-input">
                            <Input error={this.state.errLblConfirmPass || this.state.errComparePassValidator || this.state.errLblCompareEmail}
                                  value={this.state.confirmPassValue}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                                      this.onChangeConfirmPass(data)} />
                            <Transition visible={this.state.errLblConfirmPass} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.requiredConfirmPassText').toString()}
                               </Label>
                           </Transition>
                           <Transition visible={this.state.errComparePassValidator} duration={1} animation={"fade"}>
                               <Label basic color="red" pointing className="login-modal-err-lbl">
                                   {this.translate('loginModal.comparePassValidatorText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>

                   <Grid.Row>
                       <Grid.Column width={16}>
                           {this.translate('loginModal.verificationTitle').toString()}
                            <div>
                                <Captcha
                                    onExpired={this.onExpiredCaptcha}
                                    onChange={this.onChangeCaptcha}
                                    parent={this}
                                />
                            </div>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5}/>
                       <Grid.Column width={11}>
                           <Button className="login-modal-submit"
                                   disabled={!this.state.isCaptchaVerified}
                                   primary icon="blind"
                                   content={this.translate('loginModal.signUpTitle').toString()}
                                   onClick={(e) => this.handleClickSignUp()}/>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={5} />
                        <Grid.Column width={11}>
                                {this.translate('loginModal.switchToSignInTitle').toString()}
                                <span className="login-modal-link" onClick={() => this.onSwitchToSignIn()}>
                                    {this.translate('loginModal.switchToSignInLinkTitle').toString()}
                                </span>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={16}>
                            <Transition visible={this.state.errLblWrongAuth} duration={1} animation={"fade"}>
                               <Label basic color="red" attached="bottom">
                                   {this.translate('loginModal.errorAuthText').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                    </Grid.Row>
                   <Grid.Row>
                       <Grid.Column width={16}>
                            <Transition visible={this.state.errLblWrongCaptcha} duration={1} animation={"fade"}>
                               <Label basic color="red" attached="bottom">
                                   {this.translate('loginModal.reCaptchaErrorTitle').toString()}
                               </Label>
                           </Transition>
                       </Grid.Column>
                   </Grid.Row>
               </Grid>;
    }

    private renderSocialLoginButtons() {
        return <Grid>
                   <Grid.Row>
                       <Grid.Column width={16}>
                           {this.translate('loginModal.socialInfoText').toString()}
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row name="FB">
                       <Grid.Column width={14}>
                           <FacebookLoginButton
                               text={this.translate('loginModal.fbBtnTitle').toString()}
                               onClick={() => this.fbClicked()}/>
                       </Grid.Column>
                   </Grid.Row>
                   <Grid.Row name="Google">
                       <Grid.Column width={14}>
                           <GoogleLoginButton
                              parentCallback={this.googleCallback}
                               parentClickCallback={this.googleClicked}
                               parent={this}
                               failureGoogle={this.failureGoogle}/>
                       </Grid.Column>
                   </Grid.Row>
               </Grid>;
    }

    private onClickMainDiv(e: React.MouseEvent) {

        if (e.stopPropagation) {
            e.stopPropagation();   // W3C model
        } else {
            if (e.cancelBubble)
                e.cancelBubble = true; // IE model
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
    }

    render() {

        return <div onClick={(e: any) => this.onClickMainDiv(e)}>
                   <Modal trigger={this.renderTriggerElement()}
                          closeOnDimmerClick={true} closeIcon={true} size="small"
                          open={this.showWindow}
                          onClose={(e) => this.handleClickCancel()}>
                        <Modal.Header>
                            {this.state.signUp
                                ? <Icon name="signup" />
                                : <Icon name="sign in" />}
                            {this.state.signUp
                                ? this.translate('loginModal.memberSignUpTitle').toString()
                                : this.translate('loginModal.memberLoginTitle').toString()}
                       </Modal.Header>
                       <Modal.Content>
                           <Dimmer.Dimmable blurring dimmed={this.state.siginProc}>
                               <Dimmer active={this.state.siginProc}>
                                   <Loader>
                                       {this.state.signUp
                                            ? this.translate('loginModal.signUpText').toString()
                                            :  this.translate('loginModal.signinText').toString() }
                                   </Loader>
                               </Dimmer>
                               <Grid>
                                   <Grid.Row>
                                       <Grid.Column width={8}>
                                        { this.state.signUp
                                            ? this.renderSignUp()
                                            :this.renderSignIn() }
                                       </Grid.Column>
                                       <Grid.Column width={1}>
                                           <Divider vertical />
                                       </Grid.Column>
                                       <Grid.Column width={7}>
                                            {this.renderSocialLoginButtons()}
                                       </Grid.Column>
                                   </Grid.Row>
                               </Grid>
                           </Dimmer.Dimmable>
                       </Modal.Content>
                   </Modal>
               </div>;
    }
}