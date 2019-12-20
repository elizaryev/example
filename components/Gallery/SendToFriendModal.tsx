import * as React from 'react';
import {
    Icon,Modal,Grid,Input,Button,InputOnChangeData,Label,Transition,List,ButtonProps,
    Segment,TextArea,TextAreaProps} from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup";
import { GalleryItemSharePopup } from "../../components/Gallery/GalleryItemSharePopup";

declare let window: any;

interface ISendToFriendModalProps {
    operationPopup?: GalleryItemOperationPopup;
    handleShowPopupOperation?(self: GalleryItemOperationPopup): void;
    handleHidePopupOperation?(self: GalleryItemOperationPopup): void;
    sharePopup?: GalleryItemSharePopup;
    handleShowSharePopup?(self: GalleryItemSharePopup): void;
    handleHideSharePopup?(self: GalleryItemSharePopup): void;
    localize?: ILocalizeActions;
}

interface ISendToFriendState {
    showWindow: boolean,
    toEmailValue: string,
    errToEmailLbl: boolean,
    contentValue: string,
    errContentLbl: boolean,
    emails: string[],
    errSendTitle: boolean,
    desableSendBtn: boolean;
}

@inject("localize")
@observer
export class SendToFriendModal extends React.Component<ISendToFriendModalProps, ISendToFriendState> {

    constructor(props: any) {
        super(props);
        this.state = {
            showWindow: false,
            toEmailValue: "",
            errToEmailLbl: false,
            contentValue: "",
            errContentLbl: false,
            emails: [],
            errSendTitle: false,
            desableSendBtn: true
        };
    }

    private validateEmail(email: string) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    private openDialogHandler(isOpen: boolean = true) {
        this.setState({ showWindow: isOpen });

        if (isOpen && this.props.handleHidePopupOperation) {
            this.props.handleHidePopupOperation(this.props.operationPopup!);
        }
        if (!isOpen && this.props.handleShowPopupOperation) {
            this.props.handleShowPopupOperation(this.props.operationPopup!);
        }

        if (isOpen && this.props.handleHideSharePopup) {
            this.props.handleHideSharePopup(this.props.sharePopup!);
        }
        if (!isOpen && this.props.handleShowSharePopup) {
            this.props.handleShowSharePopup(this.props.sharePopup!);
        }

    }

    private renderTriggerElement() {
        return <Icon name='mail' size='huge' color="grey"
                     onClick={(e: any) => this.openDialogHandler()}/>;

    }

    private handleClick() {

        if (this.state.emails.length === 0 || this.state.contentValue === "") {
            this.setState({ errSendTitle: true });
            return;
        }

        window.open(`mailto:${this.state.emails.join(",")}?&body=${this.state.contentValue}`);
    }

    private changeToEmailValueHandler(data: InputOnChangeData) {
        this.setState({ toEmailValue: data.value, errToEmailLbl: false });
    }

    private changeContentValueHandler(event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) {

        if (data.value) {
            this.setState({ contentValue: data.value.toString(), errContentLbl: false, errSendTitle: false });

            if (this.state.emails.length > 0) {
                this.setState({ desableSendBtn: false });
            }

            return;
        }

        this.setState({ contentValue: "", errContentLbl: true, desableSendBtn: true });
    }

    private onAddEmail(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {

        if (this.state.toEmailValue === "") {
            this.setState({ errToEmailLbl: true, desableSendBtn: true });
            return;
        }

        if (!this.validateEmail(this.state.toEmailValue)) {
            this.setState({ errToEmailLbl: true, desableSendBtn: true });
            return;
        }

        const index = this.state.emails.findIndex(fi => fi === this.state.toEmailValue);
        if (index !== -1) {
            this.setState({ errToEmailLbl: true, desableSendBtn: true });
            return;
        }

        let emails = this.state.emails;
        emails.push(this.state.toEmailValue);
        this.setState({ emails: emails, toEmailValue: "", errSendTitle: false });

        if (data.value) {
            this.setState({ desableSendBtn: false });
        }
    }

    private anchorLabelClickHandler(data: object, value: string) {
        let emails = this.state.emails;
        const index = emails.findIndex(fi => fi === value);
        if (index === -1) return;
        //delete if have element
        emails.splice(index, 1);
        this.setState({ emails: emails });

        if (this.state.emails.length <= 0) {
            this.setState({ desableSendBtn: true });
        }
    }


    public render() {
        return <Modal trigger={this.renderTriggerElement()} open={this.state.showWindow}
                      closeOnDimmerClick={true} closeIcon={true} size="large"
                      onClose={(e) => this.openDialogHandler(false)}
                      className="gallery-item-send-to-friend-modal-main">
                   <Modal.Header><Icon className="icon-YP2_send"/> send to friend </Modal.Header>
                   <Modal.Content>
                       <Grid className="gic stf">
                            <Grid.Row className="gallery-item-row-no-padding">
                               <Grid.Column width={16} className="title">
                                   {this.translate('stfm.toEmailTitle').toString()}
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row  className="gallery-item-row-no-padding">
                               <Grid.Column width={16}>
                                   <List horizontal>
                                       <List.Item>
                                            <Input className="wdm gallery-item-sendtofriend-input-email"
                                                value={this.state.toEmailValue}
                                                onChange={(event: React.SyntheticEvent<HTMLElement>,
                                                    data: InputOnChangeData) => this.changeToEmailValueHandler(data)} />
                                       </List.Item>
                                       <List.Item>
                                            <Button className="wdm-btn small gray"
                                                    onClick={(event, data) => { this.onAddEmail(event, data); }}>
                                                <List horizontal>
                                                    <List.Item>
                                                        <Icon className="icon-YP2_plus" />
                                                    </List.Item>
                                                    <List.Item className="gallery-item-publish-btns-title">
                                                        {this.translate('stfm.newTitle').toString()}
                                                    </List.Item>
                                                </List>
                                            </Button>
                                       </List.Item>
                                   </List>
                               </Grid.Column>
                            </Grid.Row>
                           <Grid.Row  className="gallery-item-row-no-padding">
                              <Grid.Column width={16}>
                                   <Segment className="gallery-item-sendtofriend-email-segment">
                                       {this.state.emails.map((email, index) => (
                                            <Label key={index} className="wdm-tag" value={email} 
                                                onClick={(event: React.SyntheticEvent<HTMLElement>,data: object) => this.anchorLabelClickHandler(data, email)}>
                                                <List horizontal>
                                                    <List.Item>
                                                        <div className="text">{email}</div>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Icon className="icn icon-YP2_cancel cross"></Icon>
                                                    </List.Item>
                                                </List>
                                            </Label>
                                        ))}
                                    </Segment>
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row className="gallery-item-row-no-padding">
                               <Grid.Column width={16} className="gallery-item-tag-count">
                                   <List horizontal>
                                       <List.Item>
                                           {this.translate('stfm.emailCountTitle').toString()}
                                       </List.Item>
                                       <List.Item>
                                           {this.state.emails.length}
                                       </List.Item>
                                   </List>
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                                <Grid.Column width={16}>
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row  className="gallery-item-row-no-padding">
                               <Grid.Column width={16}  className="title">
                                   {this.translate('stfm.nameTitle').toString()}
                           </Grid.Column>
                           </Grid.Row>
                           <Grid.Row  className="gallery-item-row-no-padding">
                               <Grid.Column width={16}>
                                    <TextArea rows={4} placeholder={this.translate('stfm.contentTextAreaPlaceHolder').toString()}
                                        value={this.state.contentValue}
                                        className="gallery-item-sendtofriend-textarea"
                                            onChange={(event: React.FormEvent<HTMLTextAreaElement>,
                                                data: TextAreaProps) => this.changeContentValueHandler(event, data)}/>                                  
                               </Grid.Column>
                           </Grid.Row>
                            <Grid.Row>
                                <Grid.Column width={16}>
                                   <Transition visible={this.state.errToEmailLbl} duration={1} animation={"fade"}>
                                       <Label basic color="red" pointing="left">
                                           {this.translate('stfm.enterToEmailText').toString()}
                                       </Label>
                                    </Transition>
                                    <Transition visible={this.state.errContentLbl} duration={1} animation={"fade"}>
                                        <Label basic color="red" pointing="left">
                                            {this.translate('stfm.enterNameText').toString()}
                                        </Label>
                                    </Transition>
                                </Grid.Column>
                           </Grid.Row>
                           <Grid.Row className="gallery-item-row-no-padding">
                               <Grid.Column width={16}>
                                   <Transition visible={this.state.errSendTitle} duration={1} animation={"fade"}>
                                       <Label basic color="red">
                                            {this.translate('stfm.errSendTitle').toString()}
                                       </Label>
                                   </Transition>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Modal.Content>
                   <Modal.Actions>
                       <Button content={this.translate('stfm.cancelTitle').toString()}
                            onClick={(e) => this.openDialogHandler(false)} className="wdm-btn large dgray secondary"/>
                       <Button disabled={this.state.desableSendBtn}
                               content={this.translate('stfm.sendEmailTitle').toString()}
                               className="wdm-btn large green primary" onClick={(e) => this.handleClick()} />
                   </Modal.Actions>
               </Modal>;
    }
}

