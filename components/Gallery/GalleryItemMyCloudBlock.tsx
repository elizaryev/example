import * as React from 'react';
import { Transition, Grid, Icon, Button, Message, List, ButtonProps } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { IGalleryItem, IGalleryElementActions, IGallery } from "../../store/Gallery/Gallery";
import { InfoDialog } from "../../store/model/GalleryItemComponent";
import { PageContext, WDMSubConext, SaveToMyCloudModeType } from "../../constants/enums";
import { ILocalizeActions } from '../../store/Localize';
import { Deferred } from "../../store/facebook-class"
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";
import { LoginModal } from "../../components/LoginModal";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { ModalDialogManager, ModalDialogManagerEntry, ModalDialogButtons, ModalDialogResult } from "../../store/ModalDialog/ModalDialogManager";
import * as _ from 'lodash';
import { IPublishedDesignActions, IPublishedDesign } from "../../store/Gallery/Published";
import { MoveToDialog } from "../../containers/Gallery/MoveToDialog";
import EnhancedButton from "../../components/EnhancedButton";
import { MyCloudObjectType } from "../../store/MyCloudSaver";
import { EnumUtil } from "../../utils";

interface IGalleryItemMyCloudBlockProps {
    wdmItem?: string;
    galleryItem?: IGalleryItem;
    memberOwner: boolean;
    employee: boolean;
    infoDialog: InfoDialog;
    pageContext: PageContext;
    wdmSubConext: WDMSubConext;
    onDelete?(item?:IGalleryItem, disabled?: boolean, parent?: any): void;
    onMove?(ignore: boolean, parent?: any): void;
    onDublicate?(): void;
    onEdit?(): void;
    onAddToCart?(): void;
    localize?: ILocalizeActions;
    authentication?: Authentication;
    galleryItemOperationModel?: GalleryItemOperationModel;
    modalDialogManager?: ModalDialogManager;
    parent?: any;
    publishedDesign: IPublishedDesign;
    gallery?: IGallery;
}

interface IGalleryItemMyCloudBlockState {
    disableBtn?: boolean;
    loaderBtn?: boolean;
    loaderBtnName?: string;
    isSaveDialogOpened?: boolean;
    renderType?: MyCloudObjectType;
    showMoveBtn: boolean;
}

@inject("localize", "authentication", "galleryItemOperationModel", "modalDialogManager")
@observer
export class GalleryItemMyCloudBlock extends React.Component<IGalleryItemMyCloudBlockProps,
    IGalleryItemMyCloudBlockState> {

    constructor(props: any) {
        super(props);

        this.state = {
            disableBtn: false,
            loaderBtn: false,
            loaderBtnName: "",
            renderType: MyCloudObjectType.Design,
            showMoveBtn: false
        };
    }

    private showLoginModal: boolean = false;
    private checkedToken: Deferred = new Deferred();
    private validToken: boolean = false;
    private _isMounted: boolean = false;
    private dlgId = "";
    
    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }
    
    componentWillMount() {

        const { gallery } = this.props;

        const showMoveBtn = gallery && EnumUtil.enumHasValue(MyCloudObjectType, gallery.type);
        console.log('Not show Move btn, because MyCloudObjectType not has gallery type:', gallery ? gallery.type : "unknow");
        const renderType = gallery && EnumUtil.enumByValue<MyCloudObjectType>(MyCloudObjectType, gallery.type); // as WritingMode;

        this.setState({ disableBtn: true, showMoveBtn: showMoveBtn, renderType: renderType });
        this.checkValidToken();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private checkValidToken() {
        let self = this;
        this.checkToken();
        this.checkedToken.promise.then(() => {
            self.setState({ disableBtn: false });
            // has token
            if (self.validToken) {
                let token = localStorage.getItem('token');
                (self.props.authentication as any as IAuthenticationActions)
                    .isAnonymousUser(token!)
                    .then((isAnonymous) => {
                        self.validToken = !isAnonymous;
                        if (self._isMounted)
                            self.forceUpdate();
                    });
            } else {
                if (self._isMounted)
                    self.forceUpdate();
            }
        });
    }

    private checkToken(): void {
        let token = localStorage.getItem('token');
        if (token != null) {
            let self = this;
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                self.validToken = valid;
                self.checkedToken.resolve();
            });
        } else {
            this.validToken = false;
            this.checkedToken.resolve();
        }
    }

    private handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        if (!this.validToken) {
            this.showLoginModal = true;
            this.forceUpdate();
        } else {

            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "warning sign",
                    header: translate("deleteGalleryItemButton.dlgAccept.header"),
                    content: translate("deleteGalleryItemButton.dlgAccept.content"),
                    size: "tiny",
                    type: ModalDialogButtons.Okay | ModalDialogButtons.Cancel,
                    autoClose: true,
                    onResult: (result) => this.onDialogDeleteResultHandler(result)
                }
            };

            if(modalDialogManager)
                this.dlgId = modalDialogManager.addDialog(entry);
            
        }
    }

    onDialogDeleteResultHandler(result?: number): boolean {

        const { modalDialogManager, galleryItem, parent } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;


        if (result === ModalDialogResult.Okay) {
            const self = this;

            // call parent method to disable publishing block - call without galleryitem value
            if (this.props.onDelete)
                this.props.onDelete(undefined, true, parent);

            this.setState({ disableBtn: true, loaderBtn: true, loaderBtnName: "delete" });
            (galleryItem as any as IGalleryElementActions).removeElement(galleryItem.hash)
                .then((result: boolean) => {
                    if (self._isMounted) {
                        self.setState({ disableBtn: false, loaderBtn: false, loaderBtnName: "" });
                    }
                    if (result) {
                        // if remove phisical folder has the success result then change status wdm_item in DB
                        const action = (this.props.publishedDesign as any as IPublishedDesignActions);
                        action.setStatusDisposition("delete");
                        action.updateWdmItem(this.props.publishedDesign)
                            .then((result: any) => {
                                if (!result.success) {
                                    // show error label and set error input
                                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                                        translate(result.errMsg));
                                }
                            }).catch((error: any) => {
                                // show error label and set error input
                                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                                    translateTemplate("defaultModalDlg.errorContent", error));
                                Promise.reject(error);
                            });

                        if (this.props.onDelete && galleryItem)
                            this.props.onDelete(galleryItem, false, this.props.parent);

                    } else {
                        // todo: mb neede
                        //if (this.props.onDelete)
                        //    this.props.onDelete(this.props.galleryItem, false, this.props.parent);

                        //show modal
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", translate("Error.GalleryItemOperation.ErrorRemoveItem")));
                    }
                }).catch((error: any) => {
                    // todo: mb neede
                    //if (this.props.onDelete)
                    //    this.props.onDelete(this.props.galleryItem, false, this.props.parent);

                    if (self._isMounted) {
                        self.setState({ disableBtn: false, loaderBtn: false, loaderBtnName: "" });
                    }
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                });
        }

        if (modalDialogManager)
            modalDialogManager.removeDialog(this.dlgId);
        return true;
    }

    private handleDublicateClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        if (!this.validToken) {
            this.showLoginModal = true;
            this.forceUpdate();
        } else {
            if (this.props.onDublicate)
                this.props.onDublicate();
        }
    }

    private handleEditClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        if (!this.validToken) {
            this.showLoginModal = true;
            this.forceUpdate();
        } else {
            if (this.props.onEdit)
                this.props.onEdit();
        }
    }

    private handleAddClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
        if (!this.validToken) {
            this.showLoginModal = true;
            this.forceUpdate();
        } else {
            if (this.props.onAddToCart)
                this.props.onAddToCart();
        }
    }

    private onCancelSiginMyCloud(self: any) {
        self.showLoginModal = false;
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.forceUpdate();
    }

    public onSigninMyCloud(self: any) {
        self.showLoginModal = false;
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);

        self.checkValidToken();
        self.forceUpdate();
    }

    saveToMyCloudDialogCloseHandler() {
        if (this._isMounted)
            this.setState({ isSaveDialogOpened: false });

        if (this.props.onMove)
            this.props.onMove(false, this.props.parent);

        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).setIgnoreCloseEventHandler(false);
    }

    saveToMyCloudDialogOpenHandler() {
        if (this._isMounted)
            this.setState({ isSaveDialogOpened: true });

        if (this.props.onMove)
            this.props.onMove(true, this.props.parent);

        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).setIgnoreCloseEventHandler(true);
    }

    public render() {

        // if not sign in then need login
        if (this.showLoginModal) {
            return <div>
                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.showLoginModal}
                                   onCancelLoginModal={this.onCancelSiginMyCloud}
                                   parentCallback={this.onSigninMyCloud} parent={this} />
                   </div>;
        }

        // hack to hide element if not have config params to it
        const show = false;
        const { galleryItem, memberOwner, pageContext, wdmSubConext } = this.props;
        const { disableBtn, loaderBtn, loaderBtnName, isSaveDialogOpened, showMoveBtn, renderType} = this.state;
        
        return <Message className="gallery-item-popup-no-padding-message">
                   <Message.Content>
                       <Grid>
                           <Grid.Row className="gallery-item-popup-row">
                               <Grid.Column width={16}>
                                    <Transition className="gallery-item-popup-mycloud-block-transition"
                                        duration={1} animation={"fade"}>
                                        <List horizontal>
                                            <List.Item>
                                                {memberOwner && pageContext === PageContext.WDM
                                                    && (wdmSubConext === WDMSubConext.MyCloud ||
                                                            wdmSubConext === WDMSubConext.MyUnPublish)
                                                    ? <EnhancedButton size="large" basic
                                                        disabled={disableBtn}
                                                        loading={loaderBtn && loaderBtnName === "delete"}
                                                        ypIcon="icon-YP3_trash"
                                                        className="wdm-btn large white"
                                                        popup={this.translate('galleryItemMyCloudBlock.deleteTitle').toString()}
                                                        labelPosition="left"
                                                        onClick={(event: any, data: any) => { this.handleDeleteClick(event, data); }}>
                                                        {this.translate('galleryItemMyCloudBlock.deleteTitle').toString()}
                                                    </EnhancedButton>
                                                    :""}
                                            </List.Item>
                                            <List.Item>
                                                {memberOwner && pageContext === PageContext.WDM
                                                    && wdmSubConext === WDMSubConext.MyUnPublish
                                                    && showMoveBtn
                                                    ? <MoveToDialog
                                                        disabledTriggerBtn={disableBtn}
                                                        renderType={renderType}
                                                        movingItem={galleryItem}
                                                        open={isSaveDialogOpened}
                                                        onOpenDialog={() => this.saveToMyCloudDialogOpenHandler()}
                                                        onCloseDialog={() => this.saveToMyCloudDialogCloseHandler()} />			
                                                    :""}
                                            </List.Item>
                                            <List.Item>
                                                { show // you need to add rules to show the item
                                                    ?<Button className="wdm-btn large white" disabled={disableBtn}
                                                            onClick={(event: any, data: any) => { this.handleDublicateClick(event, data); }}>
                                                        <List horizontal>
                                                            <List.Item>
                                                                <Icon className="icon-YP3_duplicate" />
                                                            </List.Item>
                                                            <List.Item className="gallery-item-publish-btns-title">
                                                                {this.translate('galleryItemMyCloudBlock.dublicateTitle').toString()}
                                                            </List.Item>
                                                        </List>
                                                    </Button>: ""}
                                            </List.Item>
                                            <List.Item>
                                                { show // you need to add rules to show the item
                                                    ?<Button className="wdm-btn large white" disabled={disableBtn}
                                                                onClick={(event: any, data: any) => { this.handleEditClick(event, data); }}>
                                                            <List horizontal>
                                                                <List.Item>
                                                                    <Icon className="icon-YP2_edit" />
                                                                </List.Item>
                                                                <List.Item className="gallery-item-publish-btns-title">
                                                                    {this.translate('galleryItemMyCloudBlock.editDesign').toString()}
                                                                </List.Item>
                                                            </List>
                                                        </Button> : ""}
                                            </List.Item>
                                            <List.Item>
                                                {show // you need to add rules to show the item
                                                    ?<Button className="wdm-btn large white" disabled={disableBtn}
                                                                onClick={(event: any, data: any) => { this.handleAddClick(event, data); }}>
                                                            <List horizontal>
                                                                <List.Item>
                                                                    <Icon className="icon-YP1_cart" />
                                                                </List.Item>
                                                                <List.Item className="gallery-item-publish-btns-title">
                                                                    {this.translate('galleryItemMyCloudBlock.addToCart').toString()}
                                                                </List.Item>
                                                            </List>
                                                    </Button> : ""}
                                            </List.Item>
                                        </List>
                                   </Transition>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Message.Content>
               </Message>;
    }
}