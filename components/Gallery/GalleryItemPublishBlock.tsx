import * as React from 'react';
import { Transition, Grid, Icon, Button, Popup, Message, Header, ButtonProps, List } from 'semantic-ui-react';
import { observer, inject} from 'mobx-react';
import { IGalleryItem, IGallery } from "../../store/Gallery/Gallery";
import { IInfoDialog } from "../../store/model/GalleryItemComponent";
import { GalleryItemStatusType } from "../../constants/enums";
import { Publishing } from "../../components/Gallery/Publishing";
import { IPublishingData } from "../../store/Gallery/Publishing";
import { IMember } from "../../store/model/Member";
import {GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup";
import { Published, IPublishedDesignActions } from "../../store/Gallery/Published";
import { RejectRevokeReasonModal } from "../../components/Gallery/RejectRevokeReasonModal";
import { ILocalizeActions } from '../../store/Localize';
import { PageContext, WDMSubConext } from "../../constants/enums";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";

interface IGalleryItemPublishBlockProps {
    memberOwner: boolean;
    employee: boolean;
    infoDialog: IInfoDialog;
    pageContext: PageContext;
    wdmSubConext: WDMSubConext;
    imgContent: string[];
    operationPopup: GalleryItemOperationPopup;
    publishingData: IPublishingData;
    parent: any; 

    wdmItem?: string;
    galleryItem?: IGalleryItem;
    gallery?: IGallery;
    member?: IMember;
    onPublish?(parent: any): void;
    localize?: ILocalizeActions;
    galleryItemOperationModel?: GalleryItemOperationModel;
    disabledMyCloudBlock?: boolean;
    modalDialogManager?: ModalDialogManager;
    mpDesignFolderHash?: string;

    handleShowPopupOperation?(self: GalleryItemOperationPopup): void;
    handleHidePopupOperation?(self: GalleryItemOperationPopup): void;
    onPublishingDataChanged?(self: GalleryItemOperationPopup, publishingData: IPublishingData): void;
    onCloseParent?(self: GalleryItemOperationPopup): void;
}

interface IGalleryItemPublishBlockState {
    publishStatus: string;
    showRequest: boolean;
    loadingPublishOperation: boolean;
}

@inject("localize", "galleryItemOperationModel", "modalDialogManager")
@observer
export class GalleryItemPublishBlock extends React.Component<IGalleryItemPublishBlockProps,
    IGalleryItemPublishBlockState> {

    constructor(props: any) {
        super(props);

        this.state = {
            publishStatus: "",
            showRequest: false,
            loadingPublishOperation: false
        };
    }

    private _isMounted: boolean = false;

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {
        const infoDialogParams = this.props.infoDialog;
        
        let showRequestVal = this.props.memberOwner &&
            (infoDialogParams.publishStatus === GalleryItemStatusType.None ||
                infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished ||
                infoDialogParams.publishStatus === GalleryItemStatusType.Cancel ||
                infoDialogParams.publishStatus === GalleryItemStatusType.Rejected ||
                infoDialogParams.publishStatus === GalleryItemStatusType.Revoked ); 

        showRequestVal = showRequestVal && this.props.gallery && this.props.gallery.canPublishFlg === "Yes";

        this.setState({
            publishStatus: infoDialogParams.publishStatus,
            showRequest: showRequestVal,
        });
    }

    public componentDidMount() {
        this._isMounted = true;
    }

    public componentWillUnmount() {
        this._isMounted = false;
    }

    private handleCancelClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        if (this.props.wdmItem) {
            let publishedDesign = Published.create();
            (publishedDesign as any as IPublishedDesignActions).removePublished(this.props.wdmItem);

            if (this.props.onCloseParent)
                this.props.onCloseParent(this.props.operationPopup);
        }
    }

    private handleUnpublishClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        if (!this.props.wdmItem)
            return;

        let self = this;
        let publishedDesign = Published.create();
        this.setState({ loadingPublishOperation: true });
        (publishedDesign as any as IPublishedDesignActions).unpublishedOperation(this.props.wdmItem).then(
            (result) => {
                if(self._isMounted)
                    self.setState({ loadingPublishOperation: false });
                if (result) {

                    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("unpublish");

                    if (self.props.onCloseParent)
                        self.props.onCloseParent(this.props.operationPopup);
                } else {
                    if (self._isMounted)
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate("Error.GalleryItemOperation.Unpublish").toString());
                }
            }).catch((error: any) => {
                // show error label and set error input
                if (self._isMounted)
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                Promise.reject(error);
        });
    }

    private handleSuspendClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;
        
        if (!this.props.wdmItem)
            return;

        let self = this;
        let publishedDesign = Published.create();
        if (self._isMounted)
            this.setState({ loadingPublishOperation: true });
        (publishedDesign as any as IPublishedDesignActions).suspendedOperation(this.props.wdmItem).then(
            (result) => {
                if (self._isMounted)
                    self.setState({ loadingPublishOperation: false });
                if (result) {

                    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("suspend");

                    if (self.props.onCloseParent)
                        self.props.onCloseParent(this.props.operationPopup);
                } else {
                    if (self._isMounted)
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate("Error.GalleryItemOperation.Suspend").toString());
                }
            }).catch((error: any) => {
            // show error label and set error input
                if (self._isMounted)
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
            Promise.reject(error);
        });

    }

    private handleResumedClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        if (!this.props.wdmItem)
            return;

        let self = this;
        let publishedDesign = Published.create();
        if (self._isMounted)
            this.setState({ loadingPublishOperation: true });
        (publishedDesign as any as IPublishedDesignActions).resumedOperation(this.props.wdmItem).then((result) => {
            if (self._isMounted)
                self.setState({ loadingPublishOperation: false });
            if (result) {

                (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("resume");

                if (self.props.onCloseParent)
                    self.props.onCloseParent(this.props.operationPopup);
            } else {
                if (self._isMounted)
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        self.translate("Error.GalleryItemOperation.Resume").toString());
            }
        }).catch((error: any) => {
            // show error label and set error input
            if (self._isMounted)
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
            Promise.reject(error);
        });

    }

    private handlePublishedClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        if (!this.props.wdmItem)
            return;

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        let self = this;
        let publishedDesign = Published.create();
        if (self._isMounted)
            this.setState({ loadingPublishOperation: true });
        (publishedDesign as any as IPublishedDesignActions).publishedOperation(this.props.wdmItem).then((result) => {
            if (self._isMounted)
                self.setState({ loadingPublishOperation: false });
            if (result) {

                (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publish");

                if (self.props.onCloseParent)
                    self.props.onCloseParent(this.props.operationPopup);
            } else {
                if (self._isMounted)
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        self.translate("Error.GalleryItemOperation.Publish").toString());
            }
        }).catch((error: any) => {
            // show error label and set error input
            if (self._isMounted)
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
            Promise.reject(error);
        });

    }

    private handleRevokeClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {

    }
    

    private onPublish(self: any) {
        if (self.props.onPublish)
            self.props.onPublish(self.props.parent);
    }

    public render() {

        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);

        // todo: now show only for employee = step 1
        // todo: it is stupid. 
        // All condition should be able editable in config json file.
        // But now we have what we can have! 
        // Because we not have time to impelement a better logic!
        if ((this.props.memberOwner || this.props.employee) &&
            (this.props.pageContext === PageContext.WDM && (this.props.wdmSubConext === WDMSubConext.MyCloud
                || this.props.wdmSubConext === WDMSubConext.MyPublish
                || this.props.wdmSubConext === WDMSubConext.MyUnPublish )))
            return <List horizontal className="gic po pbl-bnts">
                       {this.state.showRequest && this.props.employee
                            ? <List.Item>
                                       <Publishing btnTitle={this.translate('galleryItemPublishBlock.publishTitle').toString()}
                                                     disabledMyCloudBlock={this.props.disabledMyCloudBlock}
                                                     publishingData={this.props.publishingData}
                                                     imgContent={this.props.imgContent}
                                                     handleShowPopupOperation={this.props.handleShowPopupOperation}
                                                     handleHidePopupOperation={this.props.handleHidePopupOperation}
                                                     operationPopup={this.props.operationPopup}
                                                     onPublishingDataChanged={this.props.onPublishingDataChanged}
                                                     onCloseParent={this.props.onCloseParent}
                                                     parent={this}
                                                     onPublish={this.onPublish}
                                                     employee={(this.props.member.employeeMemberFlg === 'Yes')}
                                                     isMultiPage={this.props.galleryItem!.isMultiPage}
                                                     mpDesignFolderHash={this.props.mpDesignFolderHash}/>
                              </List.Item>
                            : ""}

                        {this.props.memberOwner && this.state.publishStatus === GalleryItemStatusType.Requested
                            ? <List.Item>
                                <Button size="tiny" className="wdm-btn large white"
                                                 onClick={(event: any, data: any) => { this.handleCancelClick(event, data); }}>
                                             <List horizontal>
                                                 <List.Item>
                                                     <Icon className="icon-YP1_book cancel1"/>
                                                 </List.Item>
                                                 <List.Item className="gallery-item-publish-btns-title">
                                                     {this.translate('galleryItemPublishBlock.cancelTitle').toString()}
                                                 </List.Item>
                                             </List>
                                </Button>
                              </List.Item>
                            :""}

                        {this.props.memberOwner && this.state.publishStatus === GalleryItemStatusType.Published
                            ? <List.Item>
                                <Button size="tiny" className="wdm-btn large white"
                                                 loading={this.state.loadingPublishOperation}
                                                 disabled={this.state.loadingPublishOperation || this.props.disabledMyCloudBlock}
                                                 onClick={(event: any, data: any) => { this.handleUnpublishClick(event, data); }}>
                                             <List horizontal>
                                                 <List.Item>
                                                     <Icon className="icon-YP1_book cancel"/>
                                                 </List.Item>
                                                 <List.Item className="gallery-item-publish-btns-title">
                                                     {this.translate('galleryItemPublishBlock.unpublishTitle').toString()}
                                                 </List.Item>
                                             </List>
                                </Button>
                              </List.Item>
                            : ""}
                      
                        {this.props.memberOwner && this.state.publishStatus === GalleryItemStatusType.Published
                            ? <List.Item>
                                <Button size="tiny" className="wdm-btn large white"
                                                 loading={this.state.loadingPublishOperation}
                                                 disabled={this.state.loadingPublishOperation || this.props.disabledMyCloudBlock}
                                                 onClick={(event: any, data: any) => { this.handleSuspendClick(event, data); }}>
                                             <List horizontal>
                                                 <List.Item>
                                                     <Icon className="icon-YP1_book pause"/>
                                                 </List.Item>
                                                 <List.Item className="gallery-item-publish-btns-title">
                                                     {this.translate('galleryItemPublishBlock.suspendTitle').toString()}
                                                 </List.Item>
                                             </List>
                                </Button>
                              </List.Item>
                            : ""}
                     
                        {this.props.memberOwner && this.state.publishStatus === GalleryItemStatusType.Suspended
                            ? <List.Item>
                                <Button size="tiny" className="wdm-btn large white"
                                                 loading={this.state.loadingPublishOperation}
                                                 disabled={this.state.loadingPublishOperation || this.props.disabledMyCloudBlock}
                                                 onClick={(event: any, data: any) => { this.handleResumedClick(event, data); }}>
                                             <List horizontal>
                                                 <List.Item>
                                                     <Icon className="icon-YP1_book play"/>
                                                 </List.Item>
                                                 <List.Item className="gallery-item-publish-btns-title">
                                                     {this.translate('galleryItemPublishBlock.resumeTitle').toString()}
                                                 </List.Item>
                                             </List>
                                </Button>
                              </List.Item>
                            : ""}
                      
                        {this.props.employee && this.state.publishStatus === GalleryItemStatusType.Requested
                            ? <List.Item>
                                <Button size="tiny" className="wdm-btn large white"
                                                 loading={this.state.loadingPublishOperation}
                                                 disabled={this.state.loadingPublishOperation || this.props.disabledMyCloudBlock}
                                                 onClick={(event: any, data: any) => { this.handlePublishedClick(event, data); }}>
                                             <List horizontal>
                                                 <List.Item>
                                                     <Icon className="icon-YP1_book play"/>
                                                 </List.Item>
                                                 <List.Item className="gallery-item-publish-btns-title">
                                                     {this.translate('galleryItemPublishBlock.approveTitle').toString()}
                                                 </List.Item>
                                             </List>
                                </Button>
                              </List.Item>
                            : ""}
                      
                        {this.props.employee && this.state.publishStatus ===  GalleryItemStatusType.Requested
                                    && !this.props.memberOwner
                            ? <List.Item><RejectRevokeReasonModal
                                             disabledMyCloudBlock={this.props.disabledMyCloudBlock}
                                             operationPopup={this.props.operationPopup}
                                             onCloseParent={this.props.onCloseParent}
                                             wdmItem={this.props.wdmItem}
                                             handleShowPopupOperation={this.props.handleShowPopupOperation}
                                             handleHidePopupOperation={this.props.handleHidePopupOperation}
                                reject={true} />
                              </List.Item>
                            :""}
                     
                       
                        {this.props.employee && this.state.publishStatus === GalleryItemStatusType.Published
                                   && !this.props.memberOwner
                            ? <List.Item>
                                <RejectRevokeReasonModal
                                             disabledMyCloudBlock={this.props.disabledMyCloudBlock}
                                             operationPopup={this.props.operationPopup}
                                             onCloseParent={this.props.onCloseParent}
                                             wdmItem={this.props.wdmItem}
                                             handleShowPopupOperation={this.props.handleShowPopupOperation}
                                             handleHidePopupOperation={this.props.handleHidePopupOperation}
                                    reject={false} />
                              </List.Item>
                            : ""}
                   </List>;
        else
            return <div></div>;
    }
}