import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { isAlive, IStateTreeNode } from "mobx-state-tree";
import {
    Button, Modal, Input, Popup, InputOnChangeData, Select, DropdownItemProps,
    Label, Image, Loader, Dimmer, Segment, Grid, DropdownProps, Message, Icon
} from 'semantic-ui-react';
import { ILocalizeActions } from "../store/Localize";
import * as _ from 'lodash';
import * as $ from "jquery";
import * as Logger from "js-logger";
import { ILayer, ILayerActions } from "../store/Layer";
import "../css/SaveToMyCloudDialog.less";
import {
    IMyCloudSaverActions, IMyCloudSaver, MyCloudObjectType, myCloudSaver as myCloudSaver1,
    ParserProcessId, SaveToMyCloudResultCode, ISaveToMyCloudResult
} from "../store/MyCloudSaver";
import {IWITDocSerializeable, IWITDoc} from "../store/WITDoc";
import {EnumUtil} from "../utils/EnumUtil";
import { GalleryDrawingMode } from "../containers/Gallery/Gallery";
import GalleryBox from "../containers/Gallery/GalleryBox";
import GalleryView from "../components/Gallery/GalleryView";
import {
    IGalleryItem, IGalleryItemActions, IGallery, GalleryItemType, IGalleryActions, IGalleryContainerActions, 
    IGalleryModel, GalleryType
} from "../store/Gallery/Gallery";
import { IRenderSize, IRenderResult } from '../store/model/RenderFormat';
import { Rectangle } from '../store/model';
import EnhancedButton from "./EnhancedButton";
import { Deferred } from "../store/facebook-class"
import { Authentication, IAuthenticationActions } from "../utils/Authentication";
import { LoginModal } from "../components/LoginModal"
import { DesignSpec, getDesignSpecSnapshot, MultiPageDesignSpec } from "../store";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../store/model/GalleryItemComponent";
import { ModalDialogButtons, ModalDialogResult, ModalDialogManager, ModalDialogManagerEntry } from "../store/ModalDialog/ModalDialogManager";
import { parserConfig, publishedConfig } from "conf";
import { PageContext, WDMSubConext, SaveToMyCloudModeType } from "../constants/enums";
import { publishedAction, IPublishedDesignActions } from "../store/Gallery/Published";

interface ISaveToMyCloudDialogState {
    showSaveToMyCloudWindow?: boolean,
    itemName?: string,
    renderType?: MyCloudObjectType,
    selectedItem?: IGalleryItem,
    selectedGallery?: IGallery,
    isFolderCreating?: boolean,
    errorMessage?: string,
    //validToken?: boolean;
    showLoginModal?: boolean;
    showSuccessMessage?: boolean;
    isSaveAsDesign?: boolean;
    movingProcess?: boolean;
}

interface ISaveToMyCloudDialogProps {
    witdoc?:IWITDoc,
    localize?: ILocalizeActions,    
    myCloudSaver?: IMyCloudSaver & IMyCloudSaverActions,
    galleryModel?: IGalleryModel,
    onCloseDialog?: () => void,
    onOpenDialog?: () => void,
    authentication?: Authentication,
    /**
     * If opened from outside then props.renderType will be used
     */
    open?: boolean,
    renderType?: MyCloudObjectType,
    designSpec?: DesignSpec,
    multiPageDesignSpec?:MultiPageDesignSpec,
    galleryItemOperationModel?: GalleryItemOperationModel,
    modalDialogManager?: ModalDialogManager;
    mode?: SaveToMyCloudModeType;
    movingItem?: IGalleryItem;
    disabledTriggerBtn?: boolean;
}

@inject("witdoc", "localize", "myCloudSaver", "galleryModel", "authentication", "designSpec", "galleryItemOperationModel",
    "modalDialogManager", "multiPageDesignSpec")
@observer
export class SaveToMyCloudDialog extends React.Component<ISaveToMyCloudDialogProps, ISaveToMyCloudDialogState> {

    private saveOptions: Array<DropdownItemProps> = [];
    private defaultSaveType: string = MyCloudObjectType.Design;
    private checkedToken: Deferred = new Deferred();
    private modalDialogId: string = "";
    private _isMounted: boolean = false;
    private resultList: any = {};
    private selectedFolders: any = {};

    constructor(props: ISaveToMyCloudDialogProps) {
        super(props);

        this.state = {
            showSaveToMyCloudWindow: false,
            itemName: "",
            renderType: MyCloudObjectType.Design,
            showLoginModal: false,
            movingProcess: false
    };
        //this.getScreenshot(MyCloudObjectType.Page);

        this.updateSaveOptionsByProps(props);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    componentWillReceiveProps(nextProps: ISaveToMyCloudDialogProps) {
        this.updateSaveOptionsByProps(nextProps);
        if (!this.props.open && nextProps.open) {
            if (nextProps.renderType) this.assignState({ renderType: nextProps.renderType });
            this.clearResultsAndFolders();
            this.openSaveToMyCloudDialogHandler(true, nextProps);
        }        
    }

    componentWillMount() {
        const { mode, movingItem } = this.props;
        if (mode === SaveToMyCloudModeType.Move && !movingItem) 
            this.setState({ itemName: movingItem.name });
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
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
                            if (self._isMounted)
                                self.setState({ showLoginModal: isAnonymous });
                            self.checkedToken.resolve();
                        });
                } else {
                    if (self._isMounted)
                        self.setState({ showLoginModal: true });
                    self.checkedToken.resolve();
                }
            });
        } else {
            this.setState({ showLoginModal: true });
            this.checkedToken.resolve();
        }
    }

    private updateSaveOptionsByProps(nextProps: ISaveToMyCloudDialogProps) {
        const { trn } = nextProps.localize!;

        if (trn) {
            this.saveOptions = [
                //{ text: trn("dlgSaveToMyCloud.saveTypeSide"), value: MyCloudObjectType.Canvas },
                { text: trn("dlgSaveToMyCloud.saveTypeDesign"), value: MyCloudObjectType.Design }
            ];           

            //if (this.props.witdoc!.selection && this.props.witdoc!.selection.length > 0) {
            if (nextProps.witdoc!.selectedPage!.selectedCanvas!.layers.length > 0) {
                this.saveOptions.push({ text: trn("dlgSaveToMyCloud.saveTypeSelection"), value: MyCloudObjectType.Elements });
                //this.defaultSaveType = MyCloudObjectType.Elements;
            }

            // Allow to save separate page in case of multipage design
            /*if (nextProps.witdoc!.pages.length > 1) {
                this.saveOptions.splice(1, 0, { text: trn("dlgSaveToMyCloud.saveTypePage"), value: MyCloudObjectType.Page });
                this.defaultSaveType = MyCloudObjectType.Page;
            }*/
        }
    }

    private onItemSelected(item?: IGalleryItem) {
        if (item && item.type === GalleryItemType.Folder && this.state.selectedGallery)
            this.selectedFolders[this.state.selectedGallery.hash] = item;
        
        this.assignState({ selectedItem: item });
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: ISaveToMyCloudDialogState) {
        if (!newState.errorMessage) newState.errorMessage = "";
        this.setState(_.assign({}, this.state, newState));        
    }

    private onSaveToMyCloudItemExistsDialogResult(result: number) {

        if (result === ModalDialogResult.Okay) {
            this.btnSaveToMyCloudClickHandler(true);
        }

        this.props.modalDialogManager.removeDialog(this.modalDialogId);
        return true;
    }

    private onSaveToMyCloudSuccessDialogResult(result: number) {
        this.props.modalDialogManager.removeDialog(this.modalDialogId);
        this.closeDialogHandler();
        return true;
    }

    private showSuccessDialog() {
        const { modalDialogManager, mode } = this.props;
        const { trn } = this.props.localize!;

        const title = (mode && mode === SaveToMyCloudModeType.Move)
            ? trn("dlgSaveToMyCloud.msgBoxSuccessMoved.title")
            : trn("dlgSaveToMyCloud.msgBoxSuccess.title");

        const content = (mode && mode === SaveToMyCloudModeType.Move)
            ? trn("dlgSaveToMyCloud.msgBoxSuccessMoved.content")
            : trn("dlgSaveToMyCloud.msgBoxSuccess.content");

        if (modalDialogManager) {          
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "icon-YP2_fblike",
                    header: title,
                    content: content,
                    size: "tiny",
                    type: ModalDialogButtons.Okay,
                    onResult: (result) => this.onSaveToMyCloudSuccessDialogResult(result)
                }
            };
            this.modalDialogId = modalDialogManager.addDialog(entry);            
        }
    }

    private moveItemInOtherFolderAction() {

        const { movingItem, galleryModel, modalDialogManager } = this.props;
        const { selectedItem, itemName, movingProcess, selectedGallery } = this.state;

        if (!galleryModel) {
            console.log("Error:required value galleryModel is null");
            return;
        }
        if (!selectedItem) {
            console.log("Error:required value selectedItem is null");
            return;
        }
        if (!selectedItem.hash) {
            console.log("Error:required value selectedItem hash is null");
            return;
        }
        if (!selectedGallery) {
            console.log("Error:required value selectedGallery is null");
            return;
        }
        if (!itemName) {
            console.log("Error:required value item name is null");
            return;
        }

        const { translateTemplate, translate } = this.props.localize!;

        let hasSameItemName = false;
        //check that not have the same name in category
        var currModel = galleryModel.galleries
            .find((model) => model.name === selectedGallery.hash);
        if (currModel) {
            
            currModel.items.filter((item) => item.name !== publishedConfig.AutoPublish.FolderName ||
                item.name !== "__AutoSave" ||
                item.name !== "AutoSave").forEach((item) => {
                if (item.children)
                    item.children.forEach((child) => {
                        if (child.name === itemName) {
                            hasSameItemName = true;
                        }
                    });
            });
        } else {
            console.log("Error:Not found gallery item in gallery model!");
            return;
        }

        if (hasSameItemName) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                this.translate("Error.GalleryItemOperation.Rename.NameAlreadyExists").toString());
            return;
        }

        // new name is well
        const self = this;
        if (this._isMounted)
            this.setState({ movingProcess: true });

        (movingItem as any as IGalleryItemActions)
            .moveItem(selectedItem.hash, itemName)
            .then((success: boolean) => {
                if (self._isMounted) {
                    self.setState({ movingProcess: false });
                }

                if (success) {
                    // show dialog OK info and close this modal
                    self.showSuccessDialog();
                    // set the event to run in the active state
                    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).setIgnoreCloseEventHandler(false);
                    // to fire event in GalleryItemComponent action to close it
                    (publishedAction as any as IPublishedDesignActions).emptyEvent();
                    // send event to refresh Gallery View or GalleryFolder
                    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("move");
                } else {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        this.translate("Error.GalleryItemOperation.Move.CantMove").toString());
                }

            }).catch((error: any) => {

                if (self._isMounted) {
                    self.setState({ movingProcess: false });
                }
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
            });
    }

    private btnSaveToMyCloudClickHandler(force?: boolean) {
        const self = this;
        this.assignState({errorMessage:""});

        const { itemName, selectedItem} = this.state;
        const { myCloudSaver, witdoc, designSpec, mode, multiPageDesignSpec } = this.props;
        const { renderType } = this.state;
        const { translate } = this.props.localize!;

        // mode to move gallery item in other folder
        if (mode === SaveToMyCloudModeType.Move) {
            this.moveItemInOtherFolderAction();
            return;
        }


        if (myCloudSaver && itemName && this.props.witdoc && selectedItem) {

            //Validate input
            let itemExists = false;
            if (selectedItem.children) {
                selectedItem.children.forEach((child) => {
                    if (child.name === itemName) {
                        itemExists = true;
                    }
                });
            }

            if (!force && itemExists) {
                //this.assignState({errorMessage:`Item '${itemName}' already exists!`});
                this.showItemExistsDialog(itemName);
                return;
            }
            const { renderSize, selectionRect } = this.getRenderSize(renderType);
            myCloudSaver.saveToMyCloud(this.props.witdoc!.uid,
                    selectedItem.hash!,
                    itemName,
                    renderType || MyCloudObjectType.Design,
                    witdoc!, designSpec as any,
                    renderSize,
                (layer) => {
                    layer.x -= selectionRect.x;
                    layer.y -= selectionRect.y;
                },
                    this.getResultIdList(renderType!), force)
                .then((result) => {
                    if (result.code >= 0) {
                        //Canvas means we are going to edit background
                        if (renderType === MyCloudObjectType.Canvas) result.value!.type = GalleryItemType.Background;
                        (selectedItem as any as IGalleryItemActions).addGalleryItem(result.value as IGalleryItem);

                        if(multiPageDesignSpec) {
                            let hash = result.value.hash;
                            hash = hash.substr(0, hash.lastIndexOf("/"));
                            multiPageDesignSpec.updateMultiPageDesignHash(hash);
                        }

                        //todo: mb not nedeed and can remove it
                        //(galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("savetomycloud");
                        self.showSuccessDialog();
                    } else {
                        if (result.code === SaveToMyCloudResultCode.ItemAlreadyExists) {
                            this.showItemExistsDialog(itemName);
                        } else {
                            //Todo: show error message
                            this.assignState({ errorMessage: result.message });
                        }
                    }
                }).catch((error: any) => self.assignState({errorMessage:error.message}));
        }
        //this.openSaveToMyCloudDialogHandler(false);
    }

    private showItemExistsDialog(itemName:string) {
        const { modalDialogManager } = this.props;
        const { translateTemplate } = this.props.localize!;
        if (modalDialogManager) {
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "warning sign",
                    header: translateTemplate("dlgSaveToMyCloud.msgBoxItemExists.title"),
                    content: translateTemplate("dlgSaveToMyCloud.msgBoxItemExists.content", itemName),
                    size: "tiny",
                    type: ModalDialogButtons.Okay | ModalDialogButtons.Cancel,
                    onResult: (result) => this.onSaveToMyCloudItemExistsDialogResult(result)
                }
            };
            this.modalDialogId = modalDialogManager.addDialog(entry);
        }
    }
    
    private openSaveToMyCloudDialogHandler(isOpen: boolean = true, nextProps?: ISaveToMyCloudDialogProps) {

        if (isOpen) {
            // if The move mode then ignore checking token
            if (this.props.mode && this.props.mode === SaveToMyCloudModeType.Move) {
                this.onMovingOpenDialog();
                return;
            }
            else
                this.checkToken();
        } else {
            this.clearResultsAndFolders();

            if (this.props.mode && this.props.mode === SaveToMyCloudModeType.Move) {
                if (this.props.onCloseDialog) {
                    this.props.onCloseDialog();
                }

                if (this._isMounted)
                    this.setState({ showSaveToMyCloudWindow: false });
                return;
            }
        }

        const self = this;
        this.checkedToken.promise.then(() => {
            if (!nextProps || this.props.mode === SaveToMyCloudModeType.Move) {
                const nextState: ISaveToMyCloudDialogState = {
                    showSaveToMyCloudWindow: isOpen,
                    itemName: isOpen ? "" : this.state.itemName,
                    isSaveAsDesign: true,
                    selectedGallery: undefined
                };
                this.clearResultsAndFolders();
                this.assignState(nextState);
            } else if (nextProps && nextProps.renderType) {
                const freeStyleDesign = nextProps.designSpec && nextProps.designSpec.freeStyleDesign;
                const galleries =
                    this.props.galleryModel!.galleries.filter(
                        this.galleryFilterFuncFactory(nextProps.renderType, freeStyleDesign));
                const selectedGallery = galleries.find((gallery) => {
                    return ((nextProps.renderType === MyCloudObjectType.Design ||
                                nextProps.renderType === MyCloudObjectType.Canvas) &&
                            (gallery.type === GalleryType.Design || gallery.type === GalleryType.Background)) ||
                        (nextProps.renderType === MyCloudObjectType.Elements &&
                            gallery.type !== GalleryType.Design &&
                            gallery.type !== GalleryType.Background);
                });
                const newState: ISaveToMyCloudDialogState = { isSaveAsDesign: false };
                if (selectedGallery) newState.selectedGallery = selectedGallery;
                this.assignState(newState);
            }
            if (isOpen) {
                if (!self.props.mode || self.props.mode !== SaveToMyCloudModeType.Move) {
                    this.getScreenshot(!nextProps
                        ? this.state.renderType
                        : (nextProps.renderType || this.state.renderType));
                }
            } else {
                if (this.props.onCloseDialog) {
                    this.props.onCloseDialog();
                }
            }
        });
    }

    private onMovingOpenDialog() {
        this.clearResultsAndFolders();

        const { designSpec, galleryModel, renderType, movingItem, onOpenDialog } = this.props;

        const freeStyleDesign = designSpec && designSpec.freeStyleDesign;

        const galleries =
            galleryModel!.galleries.filter(
                this.galleryFilterFuncFactory(renderType, freeStyleDesign));

        const selectedGallery = galleries.find((gallery) => {
            return ((renderType === MyCloudObjectType.Design ||
                        renderType === MyCloudObjectType.Canvas) &&
                    (gallery.type === GalleryType.Design || gallery.type === GalleryType.Background)) ||
                (renderType === MyCloudObjectType.Elements &&
                    gallery.type !== GalleryType.Design &&
                    gallery.type !== GalleryType.Background);
        });

        this.setState({
            showSaveToMyCloudWindow: true,
            itemName: movingItem ? movingItem.name : "",
            isSaveAsDesign: true,
            selectedGallery: selectedGallery
        });

        if (onOpenDialog)
            onOpenDialog();
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

            //Add margin for thumb graphic (5%)
            const thumbHorMargin = selectionRect.width * parserConfig.WDMElementThumbGraphicMarginPerc / 100;
            const thumbVertMargin = selectionRect.height * parserConfig.WDMElementThumbGraphicMarginPerc / 100;
            selectionRect.x -= thumbHorMargin;
            selectionRect.y -= thumbVertMargin;
            selectionRect.width += 2 * thumbHorMargin;
            selectionRect.height += 2 * thumbVertMargin;

            renderSize = { width: Math.round(selectionRect.width), height: Math.round(selectionRect.height) };
        }
        return {renderSize, selectionRect}
    }

    private clearResultsAndFolders() {
        this.resultList = {};
        this.selectedFolders = {};
    }

    private getResultIdList(renderType: string) {
        //return this.resultList[renderType];
        const resultArr:IRenderResult[] = this.resultList[renderType];
        if (!resultArr) return undefined;
        return resultArr.map((result) => result.id);
    }    

    private setResult(renderType: string, results: IRenderResult[]) {
        this.resultList[renderType] = results;
        const canvases = this.props.witdoc!.selectedPage!.canvases;
        const canvasIdx =
            canvases.indexOf(this.props.witdoc!.selectedPage!.selectedCanvas!);


        if(this.state.selectedGallery) {
            if (renderType === MyCloudObjectType.Design && this.state.selectedGallery.type === GalleryType.Design) {
                this.resultList[MyCloudObjectType.Canvas] = [results[canvasIdx]]; // Canvas means background
            }
            if (renderType === MyCloudObjectType.Design && this.state.selectedGallery.type === GalleryType.Background) {
                if (canvases.length === 1)
                    this.resultList[GalleryType.Design] = results;
            }
        }

        if (renderType === MyCloudObjectType.Elements) {
            this.resultList[GalleryType.Elements] = this.resultList[GalleryType.Text] = results;
        }

    }

    private getScreenshot(renderType?: MyCloudObjectType) {
        const { myCloudSaver, witdoc } = this.props;
        if (!renderType) {
            renderType = MyCloudObjectType.Design;
        }

        const { renderSize, selectionRect } = this.getRenderSize(renderType);

        if (myCloudSaver && witdoc && witdoc.selectedPage) {

            if (this.resultList[renderType!]) {
                this.setResult(renderType!, this.resultList[renderType!].map((item: IRenderResult) => item));
                return;
            }

            myCloudSaver.getScreenshot(witdoc.uid, //"mydesign",
                witdoc,
                renderSize,
                renderType,
                (layer) => {
                    layer.x -= selectionRect.x;
                    layer.y -= selectionRect.y;
                },
                undefined,
                (renderType === MyCloudObjectType.Elements || renderType === MyCloudObjectType.Canvas)
                ? undefined
                //: this.props.designSpec!.getProdTypeSpecGraphicUrls(true),
                : getDesignSpecSnapshot(this.props.designSpec!),
                this.getResultIdList(renderType)).then((result) => {
                if (result && result.length > 0) {
                    this.setResult(renderType!, (result as any).map((item: IRenderResult) => item));
                }
            });
        }
    }

    private closeDialogHandler() {
        const { myCloudSaver } = this.props;
        this.openSaveToMyCloudDialogHandler(false);
        if (myCloudSaver) {
            myCloudSaver.cancelRequests();
        }
    }

    onItemNameChangedHandler(data: InputOnChangeData) {
        //TODO:Put validation here
        this.assignState({ itemName:data.value }); 
    }

    private renderSaveButton() {
        const { translate, trn } = this.props.localize!;
        const { mode, disabledTriggerBtn } = this.props;

        //return <Popup trigger={<Button icon="cloud download" onClick={(e) => this.openSaveToMyCloudDialogHandler()} />} content={translate('ttlBtnSaveToMyCloud')} />;
        return <EnhancedButton size="large" basic
                              ypIcon={mode === SaveToMyCloudModeType.Move
                                    ? "icon-YP3_move horizontally"
                                    : "YP1_save"}
                              disabled={disabledTriggerBtn}
                              className={mode === SaveToMyCloudModeType.Move
                                    ? "wdm-btn large white"
                                    : "wdm-style-1 wdm-btn-simple no-border"}
                               popup={translate(mode === SaveToMyCloudModeType.Move
                                   ? 'galleryItemMyCloudBlock.moveTitle'
                                   : 'ttlBtnSaveToMyCloud')}
                               labelPosition="left"
                               onClick={(e) => this.openSaveToMyCloudDialogHandler()}>
                   {trn(mode === SaveToMyCloudModeType.Move
                       ? "galleryItemMyCloudBlock.moveTitle"
                       : "lblBtnSaveToMyCloud")}
               </EnhancedButton>;
    }

    private renderLayers() {
        //TODO:add layers (render a page)
        return null;
    }

    galleryFilterFuncFactory(renderType?:MyCloudObjectType, freeStyleDesign?:boolean) {
        //if(renderType === MyCloudObjectType.Design) return (gallery: IGallery) => gallery.type === GalleryItemType.Design;
        //return (gallery: IGallery) => gallery.type === GalleryItemType.Element;
        const { witdoc } = this.props;

        const hasLayers: boolean = witdoc!.selectedPage!.selectedCanvas!.layers.length > 0;


        return (gallery: IGallery) => {
            //if (gallery.isInMyCloud || gallery.type === GalleryType.Image) return false;
            if (gallery.canCreateByWdmFlg !== "Yes") return false;
            if (gallery.type !== GalleryType.Design &&
                gallery.type !== GalleryType.Background &&
                (!hasLayers || witdoc!.selection.length === 0)) return false;
            if (gallery.type === GalleryType.Design && freeStyleDesign) return false;

            if (renderType === MyCloudObjectType.Elements &&
                (gallery.type === GalleryType.Design || gallery.type === GalleryType.Background)) return false;

            return true;
        }
    }

    private getSelectedGalleryItem(galleryHash: string) {
        const currentGallery = this.props.galleryModel!.galleries.find(g => g.hash === galleryHash);
        if (currentGallery) {
            let result = this.selectedFolders[galleryHash];

            //Do not preselect special folders
            if (result === undefined)
                result = currentGallery.items.find(item => !item.hash!.split("/").find(t => t.startsWith("__")));

            if (result === undefined || !isAlive(result as any as IStateTreeNode))
                return undefined;
            return result as any as IGalleryItem;
        }
    }

    private onGallerySelected(gallery?: IGallery) {

        if (!gallery) return;

        const newState: ISaveToMyCloudDialogState = { selectedItem: this.getSelectedGalleryItem(gallery.hash), selectedGallery: gallery };        

        const { galleryModel } = this.props;
        const renderType = (gallery.type === GalleryType.Design)
            ? MyCloudObjectType.Design
            : (gallery.type === GalleryType.Background ? MyCloudObjectType.Canvas : MyCloudObjectType.Elements);
        if (this.state.renderType !== renderType) {
            newState.renderType = renderType;
            //this.assignState(newState);
            //this.getScreenshot(renderType);
            //return;
        }

        //selectedFolders[gallery.hash] is already set by this.getSelectedGalleryItem
        //Preselect first item and load it
        //this.selectedFolders[gallery.hash] = newState.selectedItem;   
        if (newState.selectedItem === undefined && gallery.isLoading) {
            const self = this;
            (gallery as any as IGalleryActions).load()!.then((gallery) => {
                self.assignState({ selectedItem: self.getSelectedGalleryItem(gallery.hash) });
            });
        }
        //(selectedItem as any as IGalleryItemActions).setIsOpened(true);
        //(selectedItem as any as IGalleryItemActions).load();

        this.assignState(newState);
        if(newState.hasOwnProperty("renderType")) this.getScreenshot(renderType);
    }

    private addFolderBtnClick() {
        if (this.state.selectedGallery) {
            this.assignState({isFolderCreating:true});
            (this.state.selectedGallery as any as IGalleryContainerActions).createFolder().then((folder) => {

                console.log(folder);
                this.assignState({ isFolderCreating: false });
                const elem = $(`#stmc-dialog #folder-${folder.hash!.replace('/', '-')}`)[0] as any as Element;
                elem.scrollIntoView();
            }).catch((error: any) => {
                console.log(error);
                this.assignState({ isFolderCreating: false });
            });
        }
    }

    private onCancelSigin(self: any) {
        self.setState({ showLoginModal: false });
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        this.openSaveToMyCloudDialogHandler(false);
    }

    public onSignin(self: any) {
        self.setState({ showLoginModal: false });
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        this.checkToken();
    }

    private onGalleryItemSelected(item?:IGalleryItem) {
        if (item) {
            this.assignState({itemName:item.name, showSaveToMyCloudWindow: this.props.open ? undefined : true});
        }
    }
    
    private onChangeViewItems(self: any, items: IGalleryItem[], gallery: IGallery) {
        if (self.state.selectedItem && self.state.selectedItem.children
            && self.state.selectedItem.children.length !== items.length)
                self.state.selectedItem.children = items;
    }

    render() {
        
        // if not sign in then need login
        if (this.state.showLoginModal) {
            return <div>
                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.state.showLoginModal}
                                   onCancelLoginModal={this.onCancelSigin}
                                   parentCallback={this.onSignin} parent={this} />
                   </div>;
        }

        const { myCloudSaver, designSpec, mode, movingItem, galleryModel, disabledTriggerBtn } = this.props;
        const { trn, translate } = this.props.localize!;
        const { selectedGallery, selectedItem, movingProcess } = this.state;
        const renderResult: IRenderResult = this.state.renderType ? this.resultList[this.state.renderType] || myCloudSaver!.renderResult : [];
        const sideCount = this.props.witdoc!.selectedPage!.canvases.length;
        const inlineStyle = {
            modal: {
                marginTop: '0px !important',
                marginLeft: 'auto',
                marginRight: 'auto'
            }
        };
        const freeStyleDesign = designSpec && designSpec.freeStyleDesign;

        const disableActionBtn = movingProcess || this.state.selectedItem === undefined ||
            disabledTriggerBtn ||
            (mode === SaveToMyCloudModeType.Move
                ? !movingItem || !galleryModel  // check required moving item and galleryModel
                : (myCloudSaver && myCloudSaver.isLoading));

        return <div className="div-inline-block">
                   <Modal id="stmc-dialog" trigger={this.renderSaveButton()} size="large" open={this.props.open ||
                       this.state.showSaveToMyCloudWindow}
                          className="wdm"
                          closeOnDimmerClick={false} closeIcon={true} style={inlineStyle.modal}
                          onClose={(e) => this.closeDialogHandler()}>
                       <Modal.Header>
                           <Icon className={mode === SaveToMyCloudModeType.Move 
                               ? "icon-YP3_move horizontally"
                               : "icon-YP1_save"} />
                           {translate(mode === SaveToMyCloudModeType.Move 
                               ? "galleryItemMyCloudBlock.moveTitle"
                               : "dlgSaveToMyCloud.title")}
                       </Modal.Header>
                <Modal.Content>
                            <Grid className="grid-folder">
                                <Grid.Column width={8} verticalAlign="middle">
                                    {/*<div className="lbl-ttl">{trn("dlgSaveToMyCloud.lblSaveText")}</div>*/}
                                    <div className="ctls">
                                        {translate("dlgSaveToMyCloud.lblMyCloudFolder")}
                                        <div className="fld">
                                            {selectedItem && selectedGallery && <Icon className={selectedGallery.icon} />}
                                            {selectedItem && (selectedGallery ? (selectedGallery.name + " / ") : "")}
                                            {selectedItem && <Icon className="icon-YP2_folder open" />}
                                            {selectedItem && selectedItem.name}
                                        </div>
                                    </div>
                                </Grid.Column>                        
                            </Grid>
                           <Grid centered columns={2}>
                               <Grid.Row className="grid-gallery">
                                   <Grid.Column width={6}>
                                            <GalleryBox hideSubTabs={true} drawingMode={GalleryDrawingMode.FoldersOnly}
                                                   showSpecialFolders={false}
                                                   galleryStyle={{ overflowY: "auto", maxHeight: "250px" }}
                                                   onItemSelected={(item) => this.onItemSelected(item)}
                                                   onGallerySelected={(gallery) => this.onGallerySelected(gallery)}
                                                   galleryFilter={this.galleryFilterFuncFactory(this.state.isSaveAsDesign ? MyCloudObjectType.Design : this.props.renderType, freeStyleDesign)}
                                                   selectedCategory={this.state.selectedGallery}
                                                   selectedItem={this.state.selectedItem}/>
                                   </Grid.Column>
                                   <Grid.Column width={10}>
                                        <GalleryView items={this.state.selectedItem && this.state.selectedItem.children} 
                                                column={4}
                                                parent={this}
                                                pageContext={PageContext.WDM}
                                                wdmSubConext={WDMSubConext.None}
                                                onChangeItems={this.onChangeViewItems}
                                                simplyStyleGalleryItemComponent={true}
                                                gallery={this.state.selectedGallery}
                                                onItemSelected={(item) => this.onGalleryItemSelected(item)}/>
                                   </Grid.Column>
                               </Grid.Row>
                    </Grid>
                            <Grid className="grid-folder inp">
                                <Grid.Column width={9} verticalAlign="middle">                                    
                                    <div className="ctls">    
                                        {translate("dlgSaveToMyCloud.lblDesignName")}
                                        <Input className="wdm"                                            
                                            placeholder={trn("dlgSaveToMyCloud.phElementName")}
                                            onChange={(e, data) => this.onItemNameChangedHandler(data)}
                                            size="small">
                                            <input value={this.state.itemName} />
                                            { /*<Select compact options={this.saveOptions} defaultValue={defaultRenderType}
                                                     onChange={(e, data) => this.onSaveTypeChange(data)}/>*/
                                            }
                                        </Input>                                        
                                    </div>
                                    {(this.state.errorMessage || !this.state.selectedItem) &&
                                    <Message size="tiny" negative>{!this.state.selectedItem ? translate("dlgSaveToMyCloud.msgSelectFolderFirst") :
                                                        this.state.errorMessage}</Message>}
                                </Grid.Column>
                                {mode === SaveToMyCloudModeType.Move ? "" :
                                <Grid.Column width={7}>
                                    <Grid centered columns={2} className="grid-preview">
                                        {myCloudSaver &&
                                            myCloudSaver.isLoading &&
                                            myCloudSaver.processId === ParserProcessId.Preview &&
                                            <Grid.Column >
                                                <Segment className="layers-content">
                                                    <Dimmer active inverted><Loader inverted /></Dimmer>
                                                    <Dimmer active inverted><Loader inverted /></Dimmer>
                                                </Segment>
                                            </Grid.Column>}
                                        {sideCount === 2 && myCloudSaver &&
                                            myCloudSaver.isLoading &&
                                            myCloudSaver.processId === ParserProcessId.Preview &&
                                            (this.state.renderType === MyCloudObjectType.Design || this.state.renderType === MyCloudObjectType.Canvas) &&
                                            <Grid.Column >
                                                <Segment className="layers-content">
                                                    <Dimmer active inverted><Loader inverted /></Dimmer>
                                                    <Dimmer active inverted><Loader inverted /></Dimmer>
                                                </Segment>
                                            </Grid.Column>}
                                        {myCloudSaver &&
                                            !(myCloudSaver.isLoading &&
                                                myCloudSaver.processId === ParserProcessId.Preview) &&
                                                renderResult.map((resData, index) =>
                                                <Grid.Column key={index}>
                                                    <Image src={resData.data} centered bordered className="layers-content" />
                                                </Grid.Column>
                                            )}
                                    </Grid>
                                </Grid.Column>}
                            </Grid>                           
                       </Modal.Content>
                       <Modal.Actions>
                           <Button secondary className="wdm-btn large"
                                   content={translate("dlgSaveToMyCloud.lblBtnCancel")}
                                   onClick={(e) => this.openSaveToMyCloudDialogHandler(false)}/>
                           <Button primary icon
                                   className="wdm-btn large"
                                   disabled={disableActionBtn}
                                   loading={(mode === SaveToMyCloudModeType.Move
                                               ? false
                                               : myCloudSaver && myCloudSaver.isLoading)
                                       || movingProcess}
                                   onClick={(e) => this.btnSaveToMyCloudClickHandler()}>
                            <Icon className={this.props.mode === SaveToMyCloudModeType.Move
                                ? "icon-YP3_move horizontally"
                                : "icon-YP1_save"} />
                                {translate(mode === SaveToMyCloudModeType.Move
                                    ? "galleryItemMyCloudBlock.moveTitle"
                                    : "dlgSaveToMyCloud.lblBtnSave")}
                            </Button>                           
                       </Modal.Actions>
                   </Modal>
               </div>;

    }
}