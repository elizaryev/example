import * as $ from 'jquery';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import * as _ from "lodash";
import {
    ConnectDropTarget, DragDropContext, DropTarget,
    DropTargetConnector, DropTargetMonitor, DropTargetSpec
} from 'react-dnd';
import HTML5DnDBacked from 'react-dnd-html5-backend';
import { Button, Grid, Icon, Image, Popup, Radio, Sidebar, Segment, Transition, Dropdown } from 'semantic-ui-react';
import GalleryBox from "../../containers/Gallery/GalleryBox";
import { IGalleryItem, IGalleryItemActions, GalleryItemType, ViewMediaType, IViewMediaImageActions } from '../../store/Gallery/Gallery';
import { LayerObjectType, ILayer, ILayerActions } from "../../store/Layer";
import { ILayerModifier } from '../../store/LayerModifier';
import { ILocalizeActions, ILocalizeInitActions } from '../../store/Localize';
import { ITransformSelection } from '../../store/TransformSelection';
import { WITDocLoader } from "../../store/utils/WITDocLoader";
import { IWITDocSettings, WITDocSettings } from '../../store/WITDocSettings';
import { Rectangle } from '../../store/model';
import { IToolBox } from "../../store/ToolBox";
import { LayerUtil } from "../../utils/LayerUtil";
import ScreenUtil from "../../utils/ScreenUtil";
import CroppingWindow from '.././CroppingWindow';
import DesignSizeComponent, { DesignSizeComponentState } from "../DesignSizeComponent";
import { DownloadPdfButton } from "../DownloadPdfButton";
import LayersDropdown from ".././LayersDropdown";
import PropertyWindow from '.././PropertyWindow';
import { SaveToMyCloudDialog } from "../SaveToMyCloudDialog";
import UndoRedoToolbar from '.././UndoRedoToolbar';
import WITSelection from '.././WITSelection';
import ZoomingBar from '../ZoomingBar';
import { IAuthentication, Authentication, IAuthenticationActions } from "../../utils/Authentication";
import EnhancedButton from '../../components/EnhancedButton';
import { Member, IMember, WdmMember, IMemberActions, IWdmMemberActions } from "../../store/model/Member";
import EnhancedImage from '../Enhanced/EnhancedImage';
import DesignPageList from "../DesignPageList";
import MultiPageList from "../MultiPageList";
import ToolBox from "../../components/ToolBox";
import WorkareaSwitchPanel from "../WorkareaSwitchPanel";
import FloatingPopupWindow from "../FloatingPopupWindow";
import GroupSaveToolbox from "../GroupSaveToolbox";
import { LoginModal } from "../LoginModal"
import { Deferred, Facebook } from "../../store/facebook-class"
import { MyCloudObjectType, MyCloudSaver, ISaveToMyCloudResult} from "../../store/MyCloudSaver";
import { Google } from "../../store/google-class";
import DesignInfoWindow from "../DesignInfoWindow";
import { PublishingButton } from "../../components/InfoBanner/PublishingButton"
import DesignRuler, { RulerMode } from "../DesignRuler";
import { Units } from "../../store/model/Product";
import DropdownUnits from "../DropdownUnits";
import { ITagItem, ITagItemList, TagItemList, ITagItemDesignListActions, ITagItemListActions } from "../../store/model/TagItem";
import { GalleryItemEventData, GalleryItemEventData as IGalleryItemEventData } from "../../components/Gallery/GalleryItemComponent";
import ReplaceDesignDialog from "../ReplaceDesignDialog";
import ExitCancelDialog from "../ExitCancelDialog";
import HintBulbDialog from "../HintBulbDialog";
import ModalDialogManagerComponent from "../ModalDialogManagerComponent";
import { wdmSettings, graphicConfig } from "conf";
import WdmWorkAreaContainer from "../../components/WdmWorkAreaContainer";
import SelectionUtil from "../../utils/SelectionUtils";
import { TransformTypes } from '../../constants';
import { throttle } from "throttle-debounce";
import PriceComponent, { PriceComponentState } from "../../components/Price/PriceComponent";
import { PriceType, IPrice, IPriceActions } from "../../store/model/Price";
import { UploadGraphicButton, BackgroundToolboxPopup } from "../../components";
import { ReplaceBackgroundAction } from "../../components/actions";
import { Order, IOrderActions } from "../../store/model/Order";
import { servicesConfig } from "conf";
import { DesignSpec } from "../../store/model/DesignSpec";
import { prodTypeModel, IProdType, ProdModel, IProd, IProdModelActions } from "../../store/model/WDMProduct";
import { WDMToolboxContainer } from "../../containers";
import {
    IWITDoc,
    IWITDocActions,
    prepareBgSnapshot,
    isSingleLayerType,
    IViewMediaImage,
    getNextLayerId,
    defaultLayerAdjustmentFunction,
    defaultElementAdjustmentFunction,
    defaultBackgroundLayerAdjustmentFunction,
    LayerAdjustmentParams,
    ICanvas, ICanvasActions, CanvasEditMode, Canvas,
    ModalDialogManager, ModalDialogResult, ModalDialogManagerEntry, ModalDialogButtons,
    IDesignSpec
} from "../../store";
import * as Gallery from "ClientApp/store/Gallery/Gallery";


//import preloader graphic
require('../../assets/ajax-loader.gif');

interface CanvasSourceProps {
    connectDropTarget: ConnectDropTarget,
    isOver: boolean;
}

let lastHoverCall: number = 0;
let offs: __ReactDnd.ClientOffset;
const canvasDropTargetSpecification: DropTargetSpec<CanvasSourceProps & IWITDocProps> = {
    drop(props: CanvasSourceProps & IWITDocProps, monitor: DropTargetMonitor, component: React.
    Component<GalleryToolboxProps, any>) {
        const itemType = monitor.getItemType();
        const zoom: number = component.context.mobxStores.docSettings.zoom;
        //const zoom: number = props.docSettings.zoom!;

        if (itemType === "layer") {

            var offset = monitor.getDifferenceFromInitialOffset();
            lastHoverCall = 0;

            SelectionUtil.stopTransformingSelection();
            // How to avoid that??? No static typization
            //if (component.context && component.context.mobxStores && component.context.mobxStores.transformSelectionStore) {    
            if (component.context && component.context.mobxStores) {
                var transformSelection: ITransformSelection = {
                    isTransforming: false,
                    type: TransformTypes.OFFSET,
                    offsetX: offset.x / zoom,
                    offsetY: offset.y / zoom
                };


                // Stop monitoring
                component.context.mobxStores.witdoc.transformSelection.setTransform(transformSelection);
                //props.witdoc!.transformSelection!.setTransform(transformSelection);
                // apply transformation
                (component.context.mobxStores.witdoc as IWITDocActions).applyTransform(transformSelection)
                //(props.witdoc as IWITDocActions).applyTransform(transformSelection)
            }
        }
    },
    hover(props: CanvasSourceProps & IWITDocProps, monitor: DropTargetMonitor, component: React.Component<any, any>) {
        const itemType = monitor.getItemType();
        if (itemType === "layer") {
            const offset = monitor.getDifferenceFromInitialOffset();
            const hoverFunc = () => {

                // How to avoid that??? No static typization
                //console.log('hover?');
                if (component.context && component.context.mobxStores) {
                    var zoom: number = component.context.mobxStores.docSettings.zoom;
                    const witdoc = component.context.mobxStores.witdoc as IWITDoc;
                    SelectionUtil.moveSelection(witdoc.selection, offset, zoom);
                }
            };

            const tstamp = Date.now();
            const delta = tstamp - lastHoverCall;
            //(!offs || (offs && !(offs.x === offset.x && offs.y === offset.y))) && 
            if (lastHoverCall === 0 || !offs || (delta > 30 && (offs && !(offs.x === offset.x && offs.y === offset.y)))) {
                offs = offset;
                lastHoverCall = tstamp;
                hoverFunc();
            } else {
                //console.log('skip the call');
            }

        }
    }
};


const canvasDropTargetCollector = (connect: DropTargetConnector, monitor: DropTargetMonitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    };
};

interface IWITDocProps {
    witdoc?: IWITDoc & IWITDocActions,
    transformSelection: ITransformSelection,
    localize: ILocalizeActions,
    docSettings: IWITDocSettings,
    layerModifier: ILayerModifier;
    toolBox?: IToolBox;
}

export interface IHeaderLayerProps {
    authentication?: Authentication,
    wdmMemberCommon?: WdmMember,
    memberCommon?: Member,
    fb?: Facebook,
    google?: Google;
    tagItemList?: TagItemList;
    price?: PriceType;
    modalDialogManager?: ModalDialogManager;
    designSpec?: DesignSpec;
    prodModel?: ProdModel;
}

type GalleryToolboxProps = IWITDocProps & IHeaderLayerProps & CanvasSourceProps & {
    modalDialogManager?: ModalDialogManager;
    designSpec?:IDesignSpec;
};
   
//let savedGalleryItemSelectedParams: {
//    item?: IGalleryItem ,
//    component?: React.Component,
//    initialPosition ?: { x: number, y: number },
//    data?: IGalleryItemEventData
//} | undefined;

interface ISavedGalleryItemSelectedParams {
    item?: IGalleryItem,
    component?: React.Component,
    initialPosition?: { x: number, y: number },
    data?: IGalleryItemEventData
}

const getGlobalSavedGalleryItemSelectedParams =
    () => window.__savedGalleryItemSelectedParams as (ISavedGalleryItemSelectedParams | undefined);

const setGlobalSavedGalleryItemSelectedParams =
    (value: ISavedGalleryItemSelectedParams) => window.__savedGalleryItemSelectedParams = value;

const resetGlobalSavedGalleryItemSelectedParams = () => window.__savedGalleryItemSelectedParams = undefined;

const onReplaceBgResultHandler = (result?: number) => {
    if (result === ModalDialogResult.Okay) {
        onGalleryItemSelected();
    }
    resetGlobalSavedGalleryItemSelectedParams();   
}

interface GalleryToolboxState {
    sidebarVisible?: boolean;
    sidebarAnimationComplete?: boolean;
    isSaveDialogOpened?: boolean;
    saveDialogType?: MyCloudObjectType;
    editSizeMode?: boolean;
    editPriceMode?: boolean;

    showDesignReplaceDialog?: boolean;    
    designReplaceDialogGraphicUrl?: string;
    galleryItem?: IGalleryItem;
    selectedSide?: number;

    isNonAnonymousMember?: boolean;

    processingAddToMyCloud?: boolean;
    loadMyCartData?: boolean;
    memberCommon?: IMember;
}

let reScaleDesignDialogId = "";

const onGalleryItemSelected = (item?: IGalleryItem, component?: React.Component, initialPosition?: { x: number, y: number },
    data?: GalleryItemEventData) => {


    const savedGalleryItemSelectedParams = getGlobalSavedGalleryItemSelectedParams();
    if (savedGalleryItemSelectedParams) {
        item = savedGalleryItemSelectedParams.item!;
        component = savedGalleryItemSelectedParams.component!;
        initialPosition = savedGalleryItemSelectedParams.initialPosition;
        data = savedGalleryItemSelectedParams.data;        
    }

    let { witdoc } = component!.props as IWITDocProps;
    let modalDialogManager: ModalDialogManager | undefined = undefined;
    let localize: ILocalizeActions | undefined = undefined;

    if (!witdoc && component!.context && component!.context.mobxStores) {
        witdoc = component!.context.mobxStores.witdoc;
    }

    if (component.props as GalleryToolboxProps) {
        modalDialogManager = (component.props as GalleryToolboxProps).modalDialogManager;
        localize = (component.props as GalleryToolboxProps).localize;
    }

    if (!item || item.type === GalleryItemType.Folder) return;
    if (!component) return;

    const isBackground = item.type === GalleryItemType.Background;
    const canvas = witdoc!.selectedPage!.selectedCanvas as any as Canvas;
    const isBackgroundExisting = canvas.hasBackground();

    //&& isBackgroundExisting 
    if (isBackground && !getGlobalSavedGalleryItemSelectedParams()) {
        setGlobalSavedGalleryItemSelectedParams({ item, component, initialPosition, data });
        const { localize, modalDialogManager } = component.props as any as GalleryToolboxProps;
        const replaceBackgroundAction = new ReplaceBackgroundAction(localize!, modalDialogManager!, (result) => onReplaceBgResultHandler(result));
        replaceBackgroundAction.execute();
        return;
    }

    if (!isBackground && item.type === GalleryItemType.Design && data) {
        (component as GalleryToolbox).assignState({
            showDesignReplaceDialog: true, designReplaceDialogGraphicUrl: data.src, galleryItem: item,
            selectedSide: (data && data.id === ViewMediaType.DesignFront ? 0 : 1)
        });
        return;
    }

    //Don't add a layer on click, only do it when drag'n drop
    if (initialPosition === undefined && !isBackground) return;


    //resetGlobalSavedGalleryItemSelectedParams();

    if (witdoc) {
        const itemActions = item as any as IGalleryItemActions;
        const isSingleLayer = isSingleLayerType(item);
        //For single layer types like Image and Vector we always need to get ViewMediaType.Thumb
        //Otherwise we are getting DesignFront (design-front) preview (mostly for Element type)
        const previewUrl = (item.viewMedia[0].thumbImage as any as IViewMediaImageActions).getImageUrl(item.hash,
            isSingleLayer ? ViewMediaType.Thumb : ViewMediaType.DesignFront,
            item.isInMyCloud);
        const adjustmentParams:LayerAdjustmentParams = {
            initialPosition: initialPosition,
            data: witdoc,
            generateLayerUid: item.isInMyCloud,
            previewUrls: isSingleLayer ? previewUrl : "__empty"
        };

        if (isBackground && !isSingleLayer) {
            adjustmentParams.initialPosition = undefined;
        }

        const layer = canvas.addGalleryItem(item.type === GalleryItemType.Image ? item.viewMedia[0].screenImage : item.viewMedia[0].thumbImage,
                item.type,
                isBackground ? defaultBackgroundLayerAdjustmentFunction : defaultLayerAdjustmentFunction,
                adjustmentParams);

        const layerActions = layer as any as ILayerActions;

        if (isSingleLayer)
            window.setTimeout(() => (witdoc as any as IWITDocActions).changeSelection([layer.uid]), 20);
        else {
            layerActions.set("isLoading", true);
        }
        
        itemActions.addToDesign(witdoc.uid, layer.url, item!.selectedSide).then((value) => {
            if (value.hash && layer.url && value.hash.indexOf(layer.url) < 0) {   
                //Your hash is not valid?
            }

            let uids = [layer.uid];
            let stubWitDoc: IWITDoc | undefined = undefined;
            //Typescript doesn't have interface runtime check so check it by props
            if (isSingleLayer) {
                //Handle IViewMediaImage
                layerActions.set("previewUrl", "");
                layerActions.load(true, true);                
            } else {
                //TODO:extract into a method
                //Handle IWITDoc                

                if (isBackground) {
                    if (witdoc!.selection.find(layer => layer.isBackground === true))
                        witdoc!.changeSelection([]);
                    canvas.deleteBackground();
                }

                //prepare IWITDoc                
                stubWitDoc = isBackground ? prepareBgSnapshot(value as any as IWITDoc) : value as any as IWITDoc;
                const layers = stubWitDoc!.pages[0].canvases[0].layers;
                const newLayers = canvas.addLayersBySnapshots(layers,
                    isBackground ? defaultBackgroundLayerAdjustmentFunction : defaultElementAdjustmentFunction,
                    adjustmentParams);

                uids = [];
                newLayers.forEach((newLayer) => {
                    uids.push(newLayer.uid);
                    //image layer will be loaded automatically
                    //other layer types need to be loaded manually
                    if(newLayer.type === LayerObjectType.IMAGE)
                        (newLayer as any as ILayerActions).set("isLoading", "true");
                    else
                        (newLayer as any as ILayerActions).load(true);
                });
                //remove pending layer
                canvas.removePendingLayer(layer.uid);
            }
            window.setTimeout(() => postAddActions(witdoc as any as IWITDoc & IWITDocActions,
                    stubWitDoc!,
                    uids,
                    isBackground,
                modalDialogManager,
                    localize!),
                20);
        }).catch((error) => {
            layerActions.set("previewUrl", "");
            layerActions.load(true, true);
            canvas.removePendingLayer(layer.uid);
        });
    }
}

const postAddActions = (witdoc: IWITDoc & IWITDocActions,
    loadedDoc: IWITDoc,
    uids: string[],
    isBackground: boolean,
    modalDialogManager?: ModalDialogManager,
    localize?:ILocalizeActions) => {

    //Re-scale background if needed
    const { translate } = localize!;

    if (!isBackground) {
        witdoc.changeSelection(uids);
        resetGlobalSavedGalleryItemSelectedParams();
    }
    else {
        const newWidth = loadedDoc.pages[0].width;
        const newHeight = loadedDoc.pages[0].height;
        const oldWidth = witdoc!.selectedPage!.width;
        const oldHeight = witdoc!.selectedPage!.height;
        const variance = wdmSettings.templateFilterWidthHeightVariancePct
            ? wdmSettings.templateFilterWidthHeightVariancePct / 100
            : 0;

        const canReScale = (newWidth !== oldWidth ||
                newHeight !== oldHeight) &&
            (!variance ||
            (oldWidth * (1 - variance) <= newWidth &&
                oldWidth * (1 + variance) >= newWidth &&
                oldHeight * (1 - variance) <= newWidth &&
                oldHeight * (1 + variance) >= newWidth));

        const layers = uids.map(uid => witdoc!.findLayerById(uid)!);

        if (canReScale) { //Show re scale dialog
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "question circle outline",
                    header: translate("dlgRescaleTemplate.header"),
                    content: translate("dlgRescaleTemplate.message"),
                    size: "tiny",
                    type: ModalDialogButtons.Yes | ModalDialogButtons.No,
                    onResult: (result) => {
                        reScaleDesign(witdoc, loadedDoc, layers, modalDialogManager, result === ModalDialogResult.Yes);
                        if (modalDialogManager)
                            modalDialogManager.removeDialog(reScaleDesignDialogId);
                        return true;
                    }

                }
            };
            reScaleDesignDialogId = modalDialogManager.addDialog(entry);
        } else
            reScaleDesign(witdoc, loadedDoc, layers, modalDialogManager);
    }
}

const reScaleDesign = (witdoc:IWITDoc, loadedDoc: IWITDoc, layers?:ILayer[], modalDialogManager?:ModalDialogManager, doReScale ?: boolean) => {    
    layers = layers || loadedDoc.pages[0].canvases[0].layers;
    const canvasActions = (witdoc!.selectedPage!.selectedCanvas! as any as ICanvas & ICanvasActions);

    (witdoc as any as IWITDocActions).changeSelection([]);
    if (doReScale) {
        LayerUtil.reScaleLayers(layers, { width: witdoc!.selectedPage!.width, height: witdoc!.selectedPage!.height },
            { width: loadedDoc!.pages[0].width, height: loadedDoc!.pages[0].height });
    } else {
        //Center layers
        LayerUtil.centerLayers(layers, { width: witdoc!.selectedPage!.width, height: witdoc!.selectedPage!.height },
            { width: loadedDoc!.pages[0].width, height: loadedDoc!.pages[0].height });
    }
    //canvasActions.addLayers(layers);
    if(modalDialogManager)
        modalDialogManager.removeDialog(reScaleDesignDialogId);
    resetGlobalSavedGalleryItemSelectedParams();
}


@inject("witdoc", "localize", "docSettings", "memberCommon", "wdmMemberCommon", "authentication", "fb", "google", "toolBox", "tagItemList",
    "modalDialogManager", "designSpec", "price", "prodModel")
@observer
class GalleryToolbox extends React.Component<GalleryToolboxProps, GalleryToolboxState> {

    private originX: number = 0;
    private originY: number = 0;
    private originLeft: boolean = true;
    private originTop: boolean = true;
    
    private showLoginModal: boolean = false;
    private hasToken: boolean = false;
    private checkedToken: Deferred = new Deferred();
    private signOut: boolean = false;
    private ID: number = 0;
    private _isMounted: boolean = false;
    private order = Order.create();

    constructor(props: GalleryToolboxProps) {
        super(props);
        this.state = {sidebarAnimationComplete:true, sidebarVisible:true};
    }
    
    countryOptions = [
        { key: 'en', value: 'en-us', text: 'English' },
        { key: 'zh', value: 'zh-tw', text: '中文（繁體' }
    ];

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key,
            (typeof localStorage === "undefined" || !localStorage) ? undefined : localStorage.getItem("YPUICulture")!);
    }

    private getUrlParameter(name: string) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    private getLocalStorageParameter(name: string) {

        const value = localStorage.getItem(name);
        return value == null ? "" : value;
    };

    public componentWillMount() {
        let self = this;
        this.ID = Date.now();

        //this.setState({ price: PriceType.create({ price: 0, optionPrice: 0 }) });

        this.initTagList();
		this.checkToken();
        this.checkedToken.promise.then(() => {
            if (!self.hasToken) {
                const cartOrderId = self.getLocalStorageParameter("CartOrderId");
                if (cartOrderId === "") {
                    self.showLoginModalWnd(self);
                } else {
                    (self.props.authentication as any as IAuthenticationActions)
                        .loginByCartOrderId(cartOrderId,
                            self.getLocalStorageParameter("RememberMe"),
                            self.getLocalStorageParameter("YPSessionTimeout"),
                            self.getLocalStorageParameter("YPUICulture"))
                        .then(() => {
                            let token = localStorage.getItem('token');
                            if (token == null) {
                                self.showLoginModalWnd(self);
                            } else {
                                self.doLoadingMemberInfoForMember(self, token);
                            }
                        });
                }
            } else {
                let token = localStorage.getItem('token');
                self.doLoadingMemberInfoForMember(self, token);
            }
        });
    }

    private initTagList() {
        let til = (this.props.tagItemList as any as ITagItemList);
        if (!til.isLoaded && !til.isLoading) {
            (this.props.tagItemList as any as ITagItemListActions).loadTagItemList();
        }
    }

    private doLoadingMemberInfoForMember(self: any, token: string | null) {
        (self.props.authentication as any as IAuthenticationActions)
            .isAnonymousUser(token!).then((isAnonymous) => {
                self.assignState({ isNonAnonymousMember: !isAnonymous });
                if (isAnonymous) {
                    console.log("Using anonymous token!");
                } else {
                    self.signOut = true;
                    self.loadMemberInfo(self);
                }
            });
    }

    private showLoginModalWnd(self: any, render: boolean = true) {
        if (!(self.props.authentication! as any as IAuthentication).singleLoginModalOpening) {
            self.showLoginModal = true;
            (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(true);
            if(render)
                self.forceUpdate();
        }
    }

    private loadMemberInfo(self: any) {
        const { modalDialogManager, price } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;
        let deepSelf = self;
        (self.props.memberCommon as any as IMemberActions).load()
            .then((member) => {
                if (member.emailAddr !== "") {
                    (deepSelf.props.wdmMemberCommon as any as IWdmMemberActions)
                        .loadByMember(member.memberKey).then(() => {
                            deepSelf.forceUpdate();
                        });
                }
                else {
                    deepSelf.forceUpdate();
                }
                WITDocLoader.updateDocumentEnvironment(deepSelf.props.witdoc!.uid);
                // reading parameters.json
                // get originalType and OriginalStgOrdDtl = MyCart
                // and if MyCart then set designSpec and price object 
                deepSelf.setState({ loadMyCartData: true});
                (deepSelf.order as any as IOrderActions).getMyCartItemDataByDesignHash(deepSelf.props.witdoc!.uid)
                    .then((result: any) => {
                        if (result.value.designSpecModel) {
                            deepSelf.props.designSpec!.updateValues(result.value.designSpecModel,
                                result.value.additionalParamsDesignSpec);
                            (deepSelf.props.price as any as IPriceActions).setPriceValues(result.value.price,
                                result.value.optnPrice);
                        }
                        deepSelf.setState({ loadMyCartData: false });
                    }).catch((error: any) => {
                        if (self._isMounted) {
                            deepSelf.setState({ loadMyCartData: false });
                        }
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", translate("Error.Order.MyCart.LoadItem")));
                        Promise.reject(error);
                    });
            });
    }

    private checkToken(): void {
        let token = (typeof localStorage === "undefined" || !localStorage) ? null : localStorage.getItem('token');
        if (token != null) {
            let self = this;
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                self.hasToken = valid;
                // if not valid token, mb expired, then clear it
                if (!valid) {
                    localStorage.removeItem("token");
                }
                self.checkedToken.resolve();
            });
        } else {
            this.checkedToken.resolve();
        }
    }

    private bgMouseDownHandler(e: React.MouseEvent<HTMLDivElement> ) {
        this.props.witdoc!.changeSelection([]);        
        $(window).on('mouseup', $.proxy(this.windowMouseUpHandler, this))
            .on('blur', $.proxy(this.windowMouseUpHandler, this))
            .on('mousemove', $.proxy(this.windowMouseMoveHandler, this));
        this.originX = e.pageX;
        this.originY = e.pageY;
    }

    private windowMouseMoveHandler = (e: JQuery.Event) => {
        var selectionRect = this.getSelectionRect(e);
        $('div.wit-multi-sel').offset({ left: selectionRect.x, top: selectionRect.y })
            .width(selectionRect.width).height(selectionRect.height).show();
    }

    private windowMouseUpHandler = (e: JQuery.Event) => {
        var selectionRect = this.getSelectionRect(e);
        $(window).off('mouseup', this.windowMouseUpHandler)
            .off('blur', this.windowMouseUpHandler)
            .off('mousemove', this.windowMouseMoveHandler);
        var selectionDiv = $('div.wit-multi-sel');
        //var offset = selectionDiv.offset();
        const selectionClientRect = selectionDiv[0].getBoundingClientRect();
        if (selectionClientRect !== undefined) {
            this.props.witdoc!.changeSelectionByRect(new Rectangle(selectionClientRect.left, selectionClientRect.top, selectionClientRect.width, selectionClientRect.height), this.originLeft, this.originTop, this.props.docSettings.zoom);
        }
        selectionDiv.hide();

    }

    private getSelectionRect(e: JQuery.Event): Rectangle {
        this.originLeft = e.pageX > this.originX;
        this.originTop = e.pageY > this.originY;
        return new Rectangle(Math.min(e.pageX, this.originX),
            Math.min(e.pageY, this.originY), Math.abs(e.pageX - this.originX), Math.abs(e.pageY - this.originY));
    }

	public onLoadSigninMember(self: any) {
        self.showLoginModal = false;

	    const authAction = (self.props.authentication! as any as IAuthenticationActions);
	    authAction.setSingleLoginModalOpening(false);
	    authAction.resetReloadingComponents();
	    authAction.setEventActivator(self.ID.toString());

        let token = localStorage.getItem("token");
        // authorized member
        if (token !== null) {
            //todo: think => when anon member with token
            self.signOut = true;
            // loading member and wdmMember
            let leadself = self;
            (self.props.memberCommon as any as IMemberActions).load()
                .then((member) => {
                    //console.log("member:", member);
                    if (member.emailAddr !== "") {
                        (leadself.props.wdmMemberCommon as any as IWdmMemberActions)
                            .loadByMember(member.memberKey);

                        leadself.forceUpdate();
                    }
                    WITDocLoader.updateDocumentEnvironment(leadself.props.witdoc!.uid);
                });
        }
        self.forceUpdate();
    }

    private onCancelSiginMember(self: any) {
        self.showLoginModal = false;
        self.signOut = false;
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.forceUpdate();
    }

    tint = 0;
    setSidebarParams(visible: boolean, isAnimationDone: boolean = false) {
        this.assignState({ sidebarVisible: visible, sidebarAnimationComplete: isAnimationDone });
        //window.clearInterval(this.tint);        
        //if (visible && !isAnimationDone)
        //    this.tint = window.setInterval(this.updateSidebarButtons, 5);
        //this.updateSidebarButtons();
    }

    updateSidebarButtons() {
        const btnUnfoldElem = $("#btn-unfold-cont");
        if (btnUnfoldElem.length > 0) {
            const sidebarOffs = $(".wdm-page-list").offset();
            if (sidebarOffs) {
                btnUnfoldElem.css("left", sidebarOffs.left - (btnUnfoldElem.width() || 0) + 4 + "px");
            }
        }
    }

    private updateSidebarPosition(hideFlag?:boolean) {
        //Adjust sidebar (page list panel) position depending on property window visibility and size
        const propwinNode = $("div.canvas-sidebar-pusher div.wit-propwin");
        if (propwinNode) {
            const propwinHeight = propwinNode.height();
            const sidebarNode = $("div.canvas-sidebar");
            if (sidebarNode) {
                if (propwinHeight !== undefined && hideFlag !== true)
                    sidebarNode.css("top", propwinHeight + "px");
                else
                    sidebarNode.css("top", "");
            }
        }
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    public assignState(newState: GalleryToolboxState) {
        this.setState(_.assign({}, this.state, newState));
    }

    private onCanvasBeforeChangeHandler(oldCanvas: ICanvas, newCanvas: ICanvas) {
        if(oldCanvas !== newCanvas)
            (this.props.witdoc! as any as IWITDocActions).changeSelection([]);
    }

    componentDidMount() {
        this._isMounted = true;
        this.componentDidUpdate();
        $("div.canvas-sidebar").css("top", )
        window.addEventListener("resize", () => this.componentDidUpdate());
    }

    componentDidUpdate() {
        const canvasWidth = $(".main-canvas-area").width();
        const containerWidth = $(".canvas-sidebar-pusher").width();
        
        if (canvasWidth && containerWidth) {
            const deltaPadding = ScreenUtil.rem() * 6 * 3;
            //let paddingLeft = canvasWidth - paddingRight;
            let paddingLeft = canvasWidth - containerWidth + deltaPadding;
            if (paddingLeft < 0) paddingLeft = 0;
            $(".main-canvas-area").css("padding-left", `${paddingLeft}px`);
        } else {
            //this.mainCanvasAreaStyle.paddingLeft = "6rem";
        }        

        if(this.state.sidebarAnimationComplete && this.state.sidebarVisible)
            this.updateSidebarButtons();

        //this.updateSidebarPosition();

        const sidebarNode = $("div.canvas-sidebar");
        const sidebarOffset = sidebarNode.offset();
        sidebarNode.attr("style", "height: " + ($("body").height()! - sidebarOffset!.top) + "px!important");
    }

    private onSignOut() {
        let self = this;
        (this.props.authentication as any as IAuthenticationActions).logout().then((result) => {
            if (!result) {
                console.log("Cant remove token in the token storage");
            }
            localStorage.removeItem("token");

            if (self.props.memberCommon) {
                (self.props.memberCommon as any as IMemberActions).clear();
            }

            // i think that not need sign out in fb and google
            //this.props.fb!.logout();
            //this.props.google!.signOut();

            //console.log("onSignOut before forceupdate");
            self.signOut = false;
            self.forceUpdate();
        });
    }

    onSignIn = () => {
        this.showLoginModalWnd(this, false);
        this.showLoginModal = true;
        this.signOut = true;
        this.forceUpdate();
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener("resize", this.componentDidUpdate);
    }

    saveToMyCloudDialogCloseHandler() {
        this.assignState({isSaveDialogOpened:false, saveDialogType:undefined});
    }

    private onChangeLanguage = (e: any, data: any) => {
        localStorage.setItem("YPUICulture", data.value);
        (this.props.localize! as any as ILocalizeInitActions).setCurrentLocale(data.value);
        this.forceUpdate();
    }

    saveToMyCloudDialogOpenHandler() {
        this.assignState({ isSaveDialogOpened: true, saveDialogType: MyCloudObjectType.Elements});
    }

    designSizeEditHandler(state: DesignSizeComponentState) {
        this.assignState({ editSizeMode: state.editMode });
    }

    priceEditHandler(state: PriceComponentState) {
        this.assignState({ editPriceMode: state.editMode});
    }
    
    eventExternalSignin() {
        let self = this;
        const statusChangeEventActivator = (this.props.authentication! as any as IAuthentication).statusChangeEventActivator;
        if (statusChangeEventActivator !== ""
            && statusChangeEventActivator !== this.ID.toString()
            && (this.props.authentication! as any as IAuthenticationActions).reloadedComponent(this.ID.toString())) {

            (this.props.authentication! as any as IAuthenticationActions).markReloadingComponent(this.ID.toString());

            this.signOut = true;
            (this.props.memberCommon as any as IMemberActions).load()
                .then((member) => {
                    //console.log("member:", member);
                    if (member.emailAddr !== "") {
                        (self.props.wdmMemberCommon as any as IWdmMemberActions)
                            .loadByMember(member.memberKey);

                        self.forceUpdate();
                    }
                });
        }
    }

    shouldComponentUpdate(nextProps: GalleryToolboxProps) {
        if (nextProps.isOver) return false;
        return true;
    }

    onAddToMyCloudClick = (e: any, data: any) => {

        const { modalDialogManager, price, witdoc, designSpec } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        // check set price
        const priceVal = (price as any as IPriceActions).getTotalPrice();
        if (!priceVal || priceVal <= 0) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                trn("addMyCart.errZeroPrice"));
            return;
        }

        // check token
        let token = localStorage.getItem('token');
        if (token != null) {
            let self = this;
            self.assignState({ processingAddToMyCloud: true });
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                if (valid) {
                    let token = localStorage.getItem('token');
                    (self.props.authentication as any as IAuthenticationActions)
                        .isAnonymousUser(token!)
                        .then((isAnonymous) => {
                            if (isAnonymous) {
                                self.assignState({ processingAddToMyCloud: false });
                                this.showLoginModalWnd(self);
                            } else {
                                let { witdoc } = this.props;
                                let myCloudSaver: MyCloudSaver = MyCloudSaver.create();

                                myCloudSaver.doAutoSave(witdoc!, designSpec).then((result: ISaveToMyCloudResult) => {
                                    // next step action only if not anon user
                                    self.addToMyCloudAction(self);
                                }).catch((error: any) => {
                                    if (self._isMounted) {
                                        self.assignState({ processingAddToMyCloud: false });
                                        self.forceUpdate();
                                    }
                                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                                        translateTemplate("defaultModalDlg.errorContent", error.message));
                                    Promise.reject(error);
                                });
                            }
                        });
                } else {
                    self.assignState({ processingAddToMyCloud: false });
                    this.showLoginModalWnd(self);
                }
            });
        } else {
            this.showLoginModalWnd(this);
        }
    }

    private addToMyCloudAction(self: any) {
        const { modalDialogManager, witdoc, price, designSpec, prodModel } = this.props;
        const { translate, translateTemplate, trn } = this.props.localize!;
        
        let multiPageFlg = false;
        const prodType = prodTypeModel.prodTypes.find((f: IProdType) => f.prodTypeId === designSpec.prodTypeId);
        if (prodType) {
            multiPageFlg = (prodType.multiPageFlg && prodType.multiPageFlg === "Yes") ? true : false;
        }
        const orderQty = multiPageFlg ? designSpec.orderQty : 1;
        const printQty = multiPageFlg ? designSpec.pageQty : designSpec.pageCount;

        let prodList = prodModel.items.filter((f: IProd) => f.prodType === prodType.prodTypeKey &&
            f.sizeDimension === designSpec.sizeDimensionModel.sizeDimension);

        if (!multiPageFlg) {
            prodList = prodList.filter((f: IProd) => f.printSide === (designSpec.sideCount === 1 ? "Single" : "Double")
                && f.materialStock!.materialStockAbbr === designSpec.materialStockModel.materialStockAbbr);
        }
        else {
            prodList = prodList.filter(
                (f: IProd) =>
                    f.multiPageCoverMaterialStock!.materialStockAbbr === designSpec.coverMaterialStockModel.materialStockAbbr
                    && f.multiPagePageMaterialStock!.materialStockAbbr === designSpec.pageMaterialStockModel.materialStockAbbr);
        }
        let currentProd: IProd | undefined = undefined;
        if (prodList.length > 0) {
            currentProd = prodList[0];
        }

        // call create symbolic ling for design (on server side check price again)
        (this.order as any as IOrderActions).processMyCart(witdoc!.uid, price.price, price.optionPrice, designSpec, currentProd,
            orderQty, printQty, prodType.prodTypeKey, prodType.prodTypeId).then((result: any) => {
            if (result.success) {
                self.assignState({ processingAddToMyCloud: false });
                window.location.href = `${servicesConfig.YPMyCartUrl}?wdmMode=${result.originalType === "MyCart" ? "Edit" : "New"}`;

            } else {
                if (self._isMounted) {
                    self.assignState({ processingAddToMyCloud: false });
                    self.forceUpdate();
                }
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    trn(`Error.${result.errMsg}`));
            }
        }).catch((error: any) => {
            if (self._isMounted) {
                self.assignState({ processingAddToMyCloud: false });
                self.forceUpdate();
            }
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", error.message));
            Promise.reject(error);
        });
    }

    public render(): JSX.Element {
        const { witdoc, designSpec, memberCommon } = this.props;
        const { selection, layerModifier } = this.props.witdoc!;
        const { translate, trn } = this.props.localize!;
        const { sidebarVisible } = this.state;
        const { showRulers } = this.props.docSettings;
        //const selectedCanvas = witdoc!.selectedPage!.selectedCanvas! as any as (ICanvas & ICanvasActions);
        const freeStyleDesign = designSpec && designSpec.freeStyleDesign;

        const thumbPreviewSize = witdoc.pages.length > 0 ? ScreenUtil.getThumbPreviewSize(witdoc.pages[0].width,
            witdoc.pages[0].height,
            graphicConfig.mediumGraphicPreviewWidth,
            graphicConfig.mediumGraphicPreviewHeight) :
            {width:0, height:0};

		// if not sign in then need login
        if (this.showLoginModal) {
            return <div>
                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.showLoginModal}
                                   onCancelLoginModal={this.onCancelSiginMember}
                                   parentCallback={this.onLoadSigninMember} parent={this}/>
                   </div>;
        }

        this.eventExternalSignin();

        return this.props.connectDropTarget(<div className='witapp'>
            <Grid padded className= 'main-container' >
                <Grid.Row className='main-top-banner tb-text'>
                    <Grid.Column width={5} className='tb-username'>
                        <Grid verticalAlign="middle">
                            <Grid.Row>
                            <Grid.Column width={4} textAlign="left">
                                <a href="#" title={trn('tblogo.alt')}>
                                    <EnhancedImage src={require('../../assets/logo.png')} inline width={105} />
                                </a>
                                </Grid.Column>
                                <Grid.Column width={7}>
                                    <Dropdown
                                        className="mini gallery-toolbox-language-ddl"
                                        fluid
                                        search
                                        selection
                                        onChange={this.onChangeLanguage}
                                        options={this.countryOptions}
                                        placeholder={this.translate("galleryToolbox.languagePlaceholder").toString()}
                                    />
                                </Grid.Column>
                                <Grid.Column width={5} textAlign="right">
                                    {this.props.memberCommon  && <div className="wdm-user-cont">
                                         <div className="wdm-user-icon">
                                             <Icon circular size="large" className="icon-YP1_user img-logo" />
                                             <div className='tb-username-text'>{this.props.memberCommon!.memberNickName}</div>
                                         </div>
                                     </div>}
                                </Grid.Column>
                                <Grid.Column width={7}></Grid.Column>
                            </Grid.Row>
                        </Grid> 
                    </Grid.Column>
                    <Grid.Column width={11} className='tb-info-banner'>
                        {/*<Grid columns={3} verticalAlign='middle'>
                            <Grid.Column computer={3} tablet={4} mobile={8}>
                                <Image src={require('../assets/logo.png')} height={40} alt={this.translate('tblogo.alt').toString()} />
                            </Grid.Column>
                            <Grid.Column computer={5} tablet={7} mobile={8}>                            
                                <LayersDropdown selection={selection} />
                            </Grid.Column>
                            <Grid.Column computer={5} tablet={4} mobile={8}>
                                <UndoRedoToolbar />
                                <div className='inline-spacer' />
                                <ClipboardToolbar />                                
                                <div className='inline-spacer' />
                                <SaveToMyCloudDialog />
                                <DownloadPdfButton />
                                <div className='inline-spacer' />
                                <UploadGraphicButton/>
                            </Grid.Column>
                        </Grid>*/}
                        {/*<Popup trigger={<span><Button basic size="large" className="wdm-btn-simple padded">{trn("lblBtnChangeProd")}</Button></span>} content={translate('ttlBtnChangeProd')} />*/}
                        <Grid id="top-right-grid" className="full-size">
                            {!this.state.editSizeMode && <Grid.Column width={1} className="wdm-design-info-cont">
                                <DesignInfoWindow />
                            </Grid.Column>}
                            <Grid.Column width={(this.state.editSizeMode && !wdmSettings.showChangeProdComponent) ? 4 : 3}>                                
                                <DesignSizeComponent onEdit={(state) => this.designSizeEditHandler(state)}/>
                            </Grid.Column>
                            <Grid.Column width={12} textAlign="right" verticalAlign="middle">
                                {memberCommon && memberCommon.employeeMemberFlg === "Yes" && <PublishingButton/>}

                                <PriceComponent onEdit={(state) => this.priceEditHandler(state)} loadMyCartData={this.state.loadMyCartData} />
                                <DownloadPdfButton />
                                {memberCommon && memberCommon.employeeMemberFlg === "Yes" && <DownloadPdfButton mode="pdf"/>}
                                {/*<span className="txt-int-save">{translate("lblIntervalSavingText")}</span>*/}
                                <UploadGraphicButton />
                                <SaveToMyCloudDialog open={this.state.isSaveDialogOpened}
                                    renderType={this.state.saveDialogType}
                                    onCloseDialog={() => this.saveToMyCloudDialogCloseHandler()} />
                                <EnhancedButton size="large"
                                                disabled={freeStyleDesign}
                                                ypIcon="YP1_cart"
                                                className="btn-ellipse btn-wdm-mycart"
                                                popup={translate('ttlBtnMyCart')}
                                                onClick={(e: any, data: any) => this.onAddToMyCloudClick(e, data)}
                                                loading={this.state.processingAddToMyCloud || this.state.loadMyCartData}
                                                disabled={this.state.processingAddToMyCloud || this.state.loadMyCartData}
                                                labelPosition="left">
                                    {trn("lblBtnMyCart")}
                                </EnhancedButton>
                                <ExitCancelDialog />
                            </Grid.Column>
                        </Grid>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row className='main-middle-content'>
                    <Grid.Column width={5} className='main-gallery-bar'>
                        <GalleryBox onItemSelected={(item, data) => onGalleryItemSelected(item, this, undefined, data)} />  
                        {this.state.isNonAnonymousMember && <HintBulbDialog/>}
                    </Grid.Column>
                    <Grid.Column width={11} className='main-work-area'>
                        <Grid.Row>
                            <Grid columns={3} verticalAlign='middle' className="tb-action-banner">
                                <Grid.Column computer={7} tablet={9} mobile={10} className="col-layers">                                    
                                    <LayersDropdown selection={selection} />
                                    <GroupSaveToolbox selection={selection}
                                        onSaveAsClick={() => this.saveToMyCloudDialogOpenHandler()} />
                                </Grid.Column>
                                <Grid.Column textAlign="center" computer={3} tablet={3} mobile={3}>
                                    <UndoRedoToolbar />
                                    {/*<div className='inline-spacer' />
                                    <ClipboardToolbar />
                                    <div className='inline-spacer' />
                                    <SaveToMyCloudDialog />                                    
                                    <div className='inline-spacer' />
                                    <UploadGraphicButton />*/}
                                </Grid.Column>
                                <Grid.Column computer={6} tablet={4} mobile={3} textAlign="right"> 
                                    <div className="propwin-btns div-inline-block">
                                        <EnhancedButton basic compact ypIcon="YP3_tile circular"
                                                        className="btn-prop" labelPosition="left"
                                                        popupProps={{ flowing: true, hoverable: true, position: "bottom right" }}
                                                        popupContent={<BackgroundToolboxPopup />}>
                                            {translate("lblBtnPopupBackground")}
                                        </EnhancedButton>      
                                    </div>
                                    <div className="wdm-hint1">
                                        <Icon size="large" className="icon-YP2_info" />
                                        <div className="lbl">{translate('lblBtnHint')}</div>
                                    </div>
                                </Grid.Column>
                            </Grid>
                        </Grid.Row>
                        <Grid.Row className="main-workarea-row">
                            <Sidebar.Pushable as={"div"}>
                            <Sidebar
                                    as={Segment}
                                    className="no-padding canvas-sidebar"
                                    animation='overlay'
                                    icon='labeled'
                                    vertical
                                    direction="right"
                                    visible={sidebarVisible}                           
                                    onHide={() => this.updateSidebarButtons()}
                                    onVisible={() => this.updateSidebarButtons()}
                                    onHidden={() => this.setSidebarParams(false, true)}
                                    onShow={() => this.setSidebarParams(true, true)}>
                                    {designSpec && !designSpec.isMultiPage ? <DesignPageList page={this.props.witdoc!.selectedPage}
                                        onFold={() => this.setSidebarParams(false)}
                                        onBeforeChange={(oldCanvas, newCanvas) => this.onCanvasBeforeChangeHandler(oldCanvas, newCanvas)} /> :
                                        designSpec && designSpec.isMultiPageReady && <MultiPageList
                                            emptyThumbImageWidth={thumbPreviewSize.width}
                                            emptyThumbImageHeight={thumbPreviewSize.height} />}
                                </Sidebar>
                                <Sidebar.Pusher id="wdm-workarea" className="canvas-sidebar-pusher"> 
                                    <WdmWorkAreaContainer page={this.props.witdoc!.pages[0]}
                                        zoom={this.props.docSettings.zoom}
                                        layerModifier={layerModifier}
                                        onGalleryItemSelected={(item, position) => onGalleryItemSelected(item, this, position)}
                                        onBackgroundMouseDown={this.bgMouseDownHandler.bind(this)} />
                                    <WITSelection settings={this.props.docSettings} selection={this.props.witdoc!.selection} />
                                    <div className="wit-multi-sel" />
                                    {/*--------Floating popup (group/save as element)---------*/}
                                    {selection.length > 0 && <FloatingPopupWindow selection={selection}
                                                                onSaveAsClick={() => this.saveToMyCloudDialogOpenHandler()}/>}
                                    {/*---------EOF Floating popup (group/save as element)---------*/}
                                    <PropertyWindow selection={selection}
                                        onHidden={() => this.updateSidebarPosition(true)}
                                        onShow={() => this.updateSidebarPosition()}/>
                                    <Transition animation="fade" duration={350} visible={showRulers}>
                                        {showRulers ? <div>
                                            <DesignRuler scale={this.props.docSettings.zoom} units={this.props.docSettings.units === "Cm" ? Units.Cm : Units.Inch} selection={selection} />
                                            <DesignRuler mode={RulerMode.Vertical} scale={this.props.docSettings.zoom} units={this.props.docSettings.units} />
                                            <DropdownUnits units={this.props.docSettings.units}/>
                                        </div> : <div/>}
                                    </Transition>                                   
                                    <CroppingWindow />
                                    <ZoomingBar settings={this.props.docSettings} /> 
                                    <WorkareaSwitchPanel />
                                    {this.props.toolBox && this.props.toolBox.tool !== "" && <ToolBox />}
                                    <WDMToolboxContainer />
                                </Sidebar.Pusher>
                            </Sidebar.Pushable>
                        </Grid.Row>
                    </Grid.Column>
                    {!this.state.sidebarVisible && this.state.sidebarAnimationComplete &&
                        <div className="btn-fold-cont">
                        <EnhancedButton basic compact size="mini"
                                        className="btn-unfold"
                                        ypIcon="YP2_arrow right2 horizontally flipped"
                                        popup={translate("pageList.ttlFold")}
                                        onClick={() => this.setSidebarParams(!this.state.sidebarVisible )}/>
                        </div>}
                    {this.state.sidebarVisible && this.state.sidebarAnimationComplete &&
                        <div id="btn-unfold-cont" className="btn-fold-cont unfold">
                            <EnhancedButton basic compact size="mini"
                                className="btn-unfold"
                                ypIcon="YP2_arrow right2"
                                popup={translate("pageList.ttlUnfold")}
                                onClick={() => this.setSidebarParams(!this.state.sidebarVisible)} />
                        </div>}
                </Grid.Row>
            </Grid>       
            {this.state.showDesignReplaceDialog && <ReplaceDesignDialog open={this.state.showDesignReplaceDialog}
                imageSrc={this.state.designReplaceDialogGraphicUrl} 
                sourceHash={this.state.galleryItem!.hash}
                destinationHash={witdoc!.uid}
                side={this.state.selectedSide}
                onClose={() => this.assignState({ showDesignReplaceDialog: false })} />}
            <ModalDialogManagerComponent />
        </div>);
    }
}

const DnDTarget = DropTarget(['layer', "handle"], canvasDropTargetSpecification, canvasDropTargetCollector)(GalleryToolbox) as any;
export default DragDropContext(HTML5DnDBacked)(DnDTarget) as any;