import * as React from 'react';
import { Icon, Modal, Grid, Input, Button, InputOnChangeData, Label, Transition, List } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup";
import { Published, IPublishedDesignActions } from "../../store/Gallery/Published";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";

interface IRejectRevokeReasonModalProps {
    operationPopup: GalleryItemOperationPopup;
    onCloseParent?(self: GalleryItemOperationPopup): void;
    handleShowPopupOperation?(self: GalleryItemOperationPopup): void;
    handleHidePopupOperation?(self: GalleryItemOperationPopup): void;
    wdmItem?: string;
    reject: boolean;
    localize?: ILocalizeActions;
    galleryItemOperationModel?: GalleryItemOperationModel;
    disabledMyCloudBlock?: boolean;
}

interface IRejectRevokeReasonState {
    showWindow: boolean,
    reasonValue: string,
    errReasonLbl: boolean;
    loadingPublishOperation: boolean;
}

@inject("localize", "galleryItemOperationModel")
@observer
export class RejectRevokeReasonModal extends React.Component<IRejectRevokeReasonModalProps, IRejectRevokeReasonState> {

    constructor(props: any) {
        super(props);
        this.state = {
            showWindow: false,
            reasonValue: "",
            errReasonLbl: false,
            loadingPublishOperation: false
        };
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    private openDialogHandler(isOpen: boolean = true) {
        this.setState({ showWindow: isOpen });

        if (isOpen && this.props.handleHidePopupOperation) {
            this.props.handleHidePopupOperation(this.props.operationPopup);
        }
        if (!isOpen && this.props.handleShowPopupOperation) {
            this.props.handleShowPopupOperation(this.props.operationPopup);
        }
    }

    private renderTriggerElement() {
        return <Button size="tiny" className="wdm-btn large white" disabled={this.props.disabledMyCloudBlock}
                        onClick={(event, data) => { this.openDialogHandler(true); }}>
                   <List horizontal>
                       <List.Item>
                           <Icon className="icon-YP1_book cancel2"/>
                       </List.Item>
                       <List.Item className="gallery-item-publish-btns-title">
                            {this.props.reject 
                                ? this.translate('rejectRevokeReasonModal.rejectTitle').toString()
                                : this.translate('rejectRevokeReasonModal.revokeTitle').toString()}
                       </List.Item>
                   </List>
               </Button>;
        
    }

    private handleClick() {

        if (this.state.reasonValue === "") {
            this.setState({ errReasonLbl: true });
            return;
        }

        let self = this;
        if (this.props.wdmItem) {
            let publishedDesign = Published.create();
            this.setState({ loadingPublishOperation: true });
            if (this.props.reject) {
                (publishedDesign as any as IPublishedDesignActions)
                    .rejectOperation(this.props.wdmItem, this.state.reasonValue)
                    .then((result) => {
                        self.setState({ loadingPublishOperation: false });
                        if (result) {
                            (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publish");
                            self.openDialogHandler(false);

                            if (this.props.onCloseParent)
                                this.props.onCloseParent(this.props.operationPopup);
                        } else {
                            // todo: show dialog info
                            console.log("error reject operation");
                        }
                    });
            } else {
                (publishedDesign as any as IPublishedDesignActions)
                    .revokeOperation(this.props.wdmItem, this.state.reasonValue)
                    .then((result) => {
                        self.setState({ loadingPublishOperation: false });
                        if (result) {
                            (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publish");
                            self.openDialogHandler(false);

                            if (this.props.onCloseParent)
                                this.props.onCloseParent(this.props.operationPopup);
                        } else {
                            // todo: show dialog info
                            console.log("error revoke operation");
                        }
                    });
            }
        }
    }

    private changeValueHandler(data: InputOnChangeData) {
        this.setState({ reasonValue: data.value, errReasonLbl: false });
    }
    

    public render() {
        return <Modal trigger={this.renderTriggerElement()} open={this.state.showWindow}
                      closeOnDimmerClick={true} closeIcon={true} size="small"
                      onClose={(e) => this.openDialogHandler(false)}>
                   <Modal.Header>
                        <Icon className="icon-YP1_book cancel1" /> 
                        {this.props.reject 
                            ? this.translate('rejectRevokeReasonModal.rejectPublishingTitle').toString()
                            : this.translate('rejectRevokeReasonModal.revokePublishedTitle').toString()} 
                    </Modal.Header>
                   <Modal.Content>
                       <Grid>
                           <Grid.Row>
                               <Grid.Column width={2} className="gallery-item-reject-revoke-title">
                                    {this.translate('rejectRevokeReasonModal.reasonTitle').toString()}:
                               </Grid.Column>
                               <Grid.Column width={14}>
                                    <Input value={this.state.reasonValue} className="wdm gallery-item-reject-revoke-input"
                                          onChange={(event: React.SyntheticEvent<HTMLElement>,
                                              data: InputOnChangeData) => this.changeValueHandler(data)}/>
                                   <Transition visible={this.state.errReasonLbl} duration={1} animation={"fade"}>
                                       <Label basic color="red" pointing="left">
                                            {this.translate('rejectRevokeReasonModal.reasonText').toString()}
                                            {this.props.reject
                                                ? this.translate('rejectRevokeReasonModal.rejectionTitle').toString()
                                                : this.translate('rejectRevokeReasonModal.revocationTitle').toString()}
                                       </Label>
                                   </Transition>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Modal.Content>
                   <Modal.Actions>
                        <Button 
                            className="wdm-btn gray large secondary"
                            content={this.translate('rejectRevokeReasonModal.cancelTitle').toString()}
                            onClick={(e) => this.openDialogHandler(false)}/>
                        <Button className="wdm-btn green large primary"
                            content={this.props.reject
                                ? this.translate('rejectRevokeReasonModal.rejectTitle').toString()
                                : this.translate('rejectRevokeReasonModal.revokeTitle').toString()}
                            onClick={(e) => this.handleClick()}
                            disabled={this.state.loadingPublishOperation}
                            loading={this.state.loadingPublishOperation}/>
                   </Modal.Actions>
               </Modal>;
    }
}

