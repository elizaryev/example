import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Button, Icon, Popup } from 'semantic-ui-react';
import { ILocalizeActions } from "../../store/Localize";
import { IMyCloudSaver, IMyCloudSaverActions, MyCloudObjectType } from "../../store/MyCloudSaver";
import { IWITDoc } from "../../store/WITDoc";
import EnhancedButton from "../EnhancedButton";
import { IRenderSize } from '../../store/model/RenderFormat';
import { Rectangle } from '../../store/model';
import { ILayerActions } from "../../store/Layer";
import {
    IGalleryItem, IGalleryItemActions, IGalleryModel, IGallery, IGalleryActions, GalleryItemType,
    IGalleryContainerActions
} from "../../store/Gallery/Gallery";
import { publishedConfig } from "conf";
import { Deferred } from "../../store/facebook-class"
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { IPublishingData, PublishingData, publishingProcess, IPublishingProcessActions } from "../../store/Gallery/Publishing";
import { DesignSpec } from "../../store/model/DesignSpec";
import { ISubCategoryList, SubCategoryList, ISubCategoryListActions, ISubCategory, SubCategory, ISubCategoryActions }
    from "../../store/model/SubCategory";
import { IMember } from "../../store/model/Member";
import { LoginModal } from "../../components/LoginModal"
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";
import { ModalDialogManager, ModalDialogManagerEntry, ModalDialogButtons } from "../../store/ModalDialog/ModalDialogManager";

interface IPublishingButtonProps {
    witdoc?: IWITDoc;
    localize?: ILocalizeActions;
    myCloudSaver?: IMyCloudSaver & IMyCloudSaverActions;
    galleryModel?: IGalleryModel;
    galleryItemOperationModel?: GalleryItemOperationModel;
    designSpec?: DesignSpec;
    memberCommon?: IMember;
    authentication?: Authentication;
    modalDialogManager?: ModalDialogManager;
}

interface IPublishingButtonState {
    renderType?: MyCloudObjectType,
    selectedItem?: IGalleryItem,
    subcategoryList: ISubCategoryList;
    savingSpinner: boolean;
    showLoginModal?: boolean;
}


@inject("witdoc", "localize", "myCloudSaver", "galleryModel", "galleryItemOperationModel", "designSpec", "memberCommon",
    "authentication", "modalDialogManager")
@observer
export class PublishingButton extends React.Component<IPublishingButtonProps, IPublishingButtonState> {

    constructor(props: IPublishingButtonProps) {
        super(props);

        this.state = {
            renderType: MyCloudObjectType.Design,//by default
            subcategoryList: SubCategoryList.create({}) as any as ISubCategoryList,
            savingSpinner: false,
            showLoginModal: false
        };
      
    }

    private checkedToken: Deferred = new Deferred();
    private autoFolderPromise: Deferred = new Deferred();
    private saveToMyCloudPromise: Deferred = new Deferred();
    private loadSubcategory: Deferred = new Deferred();
    private hasAutoFolder: boolean = false;
    private autoFolder: IGalleryItem;
    private successSaved: boolean = false;
    private savedGalleryItem: IGalleryItem;
    private renderSize: IRenderSize;
    private subCategory: ISubCategory;
    private hasSubCategory: boolean = false;
    private cancelSignin: boolean = false;
    // automatic generation item name by current date
    private itemName: string = "";
    private modalDialogId: string = "";
    private _isMounted: boolean = false;

    componentWillMount() {
    }

    public componentDidMount() {
        this._isMounted = true;
    }

    public componentWillUnmount() {
        //console.log('gallery component will unmount');
        this._isMounted = false;
    }

    private checkToken(): void {
        let token = localStorage.getItem('token');
        if (token != null) {
            let self = this;
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                if (valid) {
                    let token = localStorage.getItem('token');
                    (self.props.authentication as any as IAuthenticationActions)
                        .isAnonymousUser(token!)
                        .then((isAnonymous) => {
                            console.log("publ-btn check token anon:", isAnonymous);
                            self.setState({ showLoginModal: isAnonymous });
                            self.checkedToken.resolve();
                        });
                } else {
                    console.log("publ-btn not valid token");
                    self.setState({ showLoginModal: true });
                    self.checkedToken.resolve();
                }
            });
        } else {
            console.log("publ-btn not has token");
            this.setState({ showLoginModal: true });
            this.checkedToken.resolve();
        }
    }


    galleryFilterFuncFactory(renderType?: MyCloudObjectType) {
        if (renderType === MyCloudObjectType.Design)
            return (gallery: IGallery) => gallery.type === GalleryItemType.Design ||
                gallery.type === GalleryItemType.Background;
        return (gallery: IGallery) => gallery.type === GalleryItemType.Element;
    }

    onPublishClick = () => {
        this.checkToken();
        let self = this;
        this.checkedToken.promise.then(() => {
            if (!self.cancelSignin)
                self.publishAction(self);
        });
    }

    private publishAction(self: any) {

        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;

        if (self.state.showLoginModal)
            return;

        self.setState({ savingSpinner: true });
        const { galleryModel } = self.props;
        const galleries = galleryModel!.galleries.filter(self.galleryFilterFuncFactory(self.state.renderType));
        if (galleries.length <= 0) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgMustHaveGallery")));
            self.setState({ savingSpinner: false });
            return;
        }

        self.itemName = Date.now().toString();
        self.validateAutoFolder(galleries[0], true, self, () => {
            if (!self.hasAutoFolder) {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgFaildedVaildAutoFolder")));

                if (self._isMounted)
                    self.setState({ savingSpinner: false });
                return;
            }

            // 1 step - save to my cloud
            self.saveToMyCloudAction(() => {
                // 2 step - publish
                if (self.successSaved) {
                    self.loadingSubCategory(self, () => {
                        self.publishingItemProcess(self);
                    });
                } else {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgSaveToMyCloud")));
                }
            });
        });
    }

    private validateAutoFolder(gallery: IGallery, firstDeeping: boolean, self: any, callback: () => void) {
        if (gallery.items) {
            if (gallery.items.length > 0) {
                // check contain auto folder
                let indexAutoFolder = gallery.items.findIndex(f => f.name === publishedConfig.AutoPublish.FolderName);
                // if haven't then create auto folder
                if (indexAutoFolder === -1) {
                    this.createAutoFolder(gallery, callback);
                } else {
                    this.autoFolder = gallery.items[indexAutoFolder];
                    this.hasAutoFolder = true;

                    callback();
                }
            } else {
                if (firstDeeping) {
                    //try first time loading items
                    let loading = (gallery as any as IGalleryActions).load();
                    if (loading) {
                        loading.then(() => {
                            self.validateAutoFolder(gallery, false, self, callback);
                        });
                    }
                } else {
                    //we tried loading items, but not have sucess
                    // then try creating an auto folder
                    this.createAutoFolder(gallery, callback);
                }
            }
        } else {
            // don't have the items of the gallery item, then try to load it
            let self = this;
            console.log("publ-btn valid auto folder - try load gallery items");
            let loading = (gallery as any as IGalleryActions).load();
            if (loading) {
                loading.then(() => {
                    if (firstDeeping) {
                        // only once try loading an items of the gallery
                        self.validateAutoFolder(gallery, false, self, callback);
                    } else {
                        self.hasAutoFolder = false;

                        if (self._isMounted)
                            self.setState({ savingSpinner: false });

                        callback();
                    }
                });
            }
        }
    }

    private createAutoFolder(gallery: IGallery, callback: () => void) {
        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        let self = this;
        console.log("publ-btn create auto folder");
        (gallery as any as IGalleryContainerActions).createFolder(publishedConfig.AutoPublish.FolderName)
            .then((createdFolder) => {
                self.hasAutoFolder = (createdFolder.name !== "");
                if (self.hasAutoFolder) {
                    self.autoFolder = createdFolder;
                }

                callback();
            })
            .catch((error: any) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgCantCreateAutoFolder")));
                self.hasAutoFolder = false;
                self.setState({ savingSpinner: false });

                callback();
            });
    }

    private saveToMyCloudAction(callback: () => void) {
        const { modalDialogManager, witdoc, myCloudSaver, designSpec } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        const self = this;

        //console.log("publ-btn saveToMyCloud action");
        if (!myCloudSaver || !self.itemName || !witdoc || !this.hasAutoFolder) {

            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgSaveToMyCloud")));
            console.log("publish btn saveToMyCloudAction not has all params" );

            if (self._isMounted)
                self.setState({ savingSpinner: false });
            return;
        }
        
        this.getScreenshot(this.state.renderType);

        //Validate input
        let itemExists = false;
        if (this.autoFolder.children) {
            this.autoFolder.children.forEach((child) => {
                if (child.name === self.itemName) {
                    itemExists = true;
                }
            });
        }

        if (itemExists) {

            const err = translateTemplate("publishing.errMagItemExists", self.itemName);

            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", err));

            if(self._isMounted)
                self.setState({ savingSpinner: false });
            return;
        }

        const { renderSize, selectionRect } = this.getRenderSize(this.state.renderType);
        this.renderSize = renderSize;
        myCloudSaver
            .saveToMyCloud(this.props.witdoc!.uid,
                this.autoFolder.hash!,
                self.itemName,
                this.state.renderType || MyCloudObjectType.Design,
                witdoc!, designSpec!,
                renderSize,
                (layer) => {
                    layer.x -= selectionRect.x;
                    layer.y -= selectionRect.y;
                })
            .then((item) => {
                (self.autoFolder as any as IGalleryItemActions).addGalleryItem(item);
                self.savedGalleryItem = item.value!;
                self.successSaved = true;

                callback();
            }).catch((error: any) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
                self.successSaved = false;

                if (self._isMounted)
                    self.setState({ savingSpinner: false });

                callback();
            });

    }

    private loadingSubCategory(self: any, callback: () => void) {
        //console.log("publ-btn load subcategory");
        (self.state.subcategoryList as any as ISubCategoryListActions).load(self.state.renderType!.toString())
            .then(() => {
                if (self.state.subcategoryList.items.length > 0) {
                    let index = self.state.subcategoryList.items.findIndex(f => f.abbrText === publishedConfig.AutoPublish.SubCategoryName);
                    if (index < 0) {
                        self.createAutomaticPublishingSubcategory(self, callback);
                    } else {
                        self.subCategory = self.state.subcategoryList.items[index];
                        self.hasSubCategory = true;
                        
                        callback();
                    }
                } else {
                    self.createAutomaticPublishingSubcategory(self, callback);
                }
            });
    }

    private createAutomaticPublishingSubcategory(self: any, callback: () => void) {

        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;

        let subcategory: ISubCategory = ((SubCategory.create({
            wdmCategoryId: self.state.renderType!.toString(),
            wdmSubCategoryId: publishedConfig.AutoPublish.SubCategoryName,
            abbrText: publishedConfig.AutoPublish.SubCategoryName,
            description: publishedConfig.AutoPublish.SubCategoryName,
            iconClass: "icon-YP2_eye"
        })) as any);

        (subcategory as any as ISubCategoryActions).save()
            .then((result) => {
                if (!result || result < 0) {
                    if (self._isMounted)
                        self.setState({ savingSpinner: false });
                   
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent",
                            translate("publishing.errMsgCantCreateSubCategory")));
                } else {
                    self.subCategory = subcategory;
                    self.hasSubCategory = true;
                }

                callback();

            }).catch((error: any) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));

                if (self._isMounted)
                    self.setState({ savingSpinner: false });
            });
    }

    private publishingItemProcess(self: any) {

        const { modalDialogManager } = this.props;
        const { translate, translateTemplate, trn } = this.props.localize!;

        console.log("publ-btn proccess");
        if (!self.hasSubCategory) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgCantLoadSubCategory")));

            if (self._isMounted)
                self.setState({ savingSpinner: false });

            return;
        }

        let publishingData: IPublishingData;
        try {
            publishingData = self.getPublishingData(self);
        } catch (error) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", error));

            if (self._isMounted)
                self.setState({ savingSpinner: false });
            return;
        }
            
        let employee: boolean = (self.props.memberCommon!.employeeMemberFlg === 'Yes');
        publishingProcess
            .save(publishingData, employee)
            .then((result) => {
                if (self._isMounted)
                    self.setState({ savingSpinner: false });
                console.log("publ-btn proccess result:", result);

                if (result) {
                    const entry: ModalDialogManagerEntry = {
                        dialogProps: {
                            icon: "icon-YP2_fblike",
                            header: trn("dlgSaveToMyCloud.msgBoxSuccess.title"),
                            content: trn("dlgSaveToMyCloud.msgBoxSuccess.content"),
                            size: "tiny",
                            type: ModalDialogButtons.Okay,
                            onResult: (result) => this.onPublishSuccessDialogResult(result)
                        }
                    };
                    this.modalDialogId = modalDialogManager.addDialog(entry);
                    
                    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publishingbutton");
                } else {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent",
                            translate("publishing.errMsgCantPublish")));
                }
            }).catch((error: any) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));

                self.setState({ savingSpinner: false });
            });
    }

    private onPublishSuccessDialogResult(result: number) {
        this.props.modalDialogManager.removeDialog(this.modalDialogId);
        return true;
    }

    private getPublishingData(self: any) {
        return (PublishingData.create({
            itemName: self.itemName,
            description: "saved item by clicking the publish button on the information banner",
            price: 0,
            keywords: ["automatic"],
            storagePath: self.savedGalleryItem.hash,
            sizeDimension: self.props.designSpec!.sizeDimensionModel!.sizeDimension,
            //prodType: "", // automatic setting in publishing ms when saving operation
            category: this.state.renderType,
            subCategory: self.subCategory.wdmSubCategoryId,
            memberKey: this.props.memberCommon!.memberKey,
        })) as any as IPublishingData;
    }

    private getScreenshot(renderType?: MyCloudObjectType) {
        const { myCloudSaver, witdoc } = this.props;
        if (!renderType) {
            renderType = MyCloudObjectType.Design;
        }

        const { renderSize, selectionRect } = this.getRenderSize(renderType);

        if (myCloudSaver && witdoc && witdoc.selectedPage) {
            myCloudSaver.getScreenshot(witdoc.uid, //"mydesign",
                witdoc,
                renderSize,
                renderType,
                (layer) => {
                    layer.x -= selectionRect.x;
                    layer.y -= selectionRect.y;
                });
        }
    }

    private getRenderSize(renderType: MyCloudObjectType = MyCloudObjectType.Design) {

        const { witdoc } = this.props;

        let renderSize: IRenderSize = { width: witdoc!.selectedPage!.width, height: witdoc!.selectedPage!.height };
        const selectionRect = new Rectangle();
        if (renderType === MyCloudObjectType.Elements && witdoc!.selection.length > 0) {
            //TODO:move layers bound detection to a helper class

            witdoc!.selection.forEach((layer, index) => {
                const layerBounds = (layer as any as ILayerActions).getScreenBounds()
                if (index === 0) {
                    selectionRect.x = layerBounds.x;
                    selectionRect.y = layerBounds.y;
                    selectionRect.width = layerBounds.x + layerBounds.width;
                    selectionRect.height = layerBounds.y + layerBounds.height;
                } else {
                    selectionRect.x = Math.min(selectionRect.x, layerBounds.x);
                    selectionRect.y = Math.min(selectionRect.y, layerBounds.y);
                    selectionRect.width = Math.max(selectionRect.width, layerBounds.x + layerBounds.width);
                    selectionRect.height = Math.max(selectionRect.height, layerBounds.y + layerBounds.height);
                }
            });
            selectionRect.width -= selectionRect.x;
            selectionRect.height -= selectionRect.y;

            renderSize = { width: Math.round(selectionRect.width), height: Math.round(selectionRect.height) };
        }
        return { renderSize, selectionRect }
    }

    private onCancelSigin(self: any) {
        self.setState({ showLoginModal: false });
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.cancelSignin = true;
    }

    public onSignin(self: any) {
        self.setState({ showLoginModal: false });

        const authAction = (self.props.authentication! as any as IAuthenticationActions);
        authAction.setSingleLoginModalOpening(false);
        authAction.resetReloadingComponents();
        authAction.setEventActivator("publish-btn");

        self.cancelSignin = false;
        self.checkToken();
    }

    render() {
        const { trn, translate } = this.props.localize!;
        const isDisabled = (this.props.myCloudSaver && this.props.myCloudSaver.isLoading) || this.state.savingSpinner;

        // if not sign in then need login
        if (this.state.showLoginModal) {
            return <div>
                       <EnhancedButton basic ypIcon="YP1_book" size="large"
                                       className="wdm-style-1 wdm-btn-simple no-border"
                                       loading={isDisabled}
                                       labelPosition="left"
                                       disabled={isDisabled}
                                       onClick={(e) => this.onPublishClick()}
                                       popup={translate('ttlBtnPublish')}>
                           {trn("lblBtnPublish")}
                       </EnhancedButton>

                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.state.showLoginModal}
                                   onCancelLoginModal={this.onCancelSigin}
                                   parentCallback={this.onSignin} parent={this} />
                   </div>;
        }

        return <EnhancedButton basic ypIcon="YP1_book" size="large"
                               className="wdm-style-1 wdm-btn-simple no-border"
                               loading={isDisabled}
                               labelPosition="left"
                               disabled={isDisabled}
                               onClick={(e) => this.onPublishClick()}
                               popup={translate('ttlBtnPublish')}>
                    {trn("lblBtnPublish")}
               </EnhancedButton>;
    }
}