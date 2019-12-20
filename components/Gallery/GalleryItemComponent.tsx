import * as React from 'react';
import { Published, IPublishedDesignActions, IPublishedDesign } from "../../store/Gallery/Published";
import { Card, Checkbox, Grid, Dimmer, Loader, Image, RatingProps, } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { Twitter } from "../../store/twitter-class"
import { GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup"
import { GalleryItemInfoPopup } from "../../components/Gallery/GalleryItemInfoPopup"
import { publishedConfig, twitterConfig } from "conf";
import { ILocalizeActions } from '../../store/Localize';
import {
    GalleryModel, IGalleryModelActions, IGalleryModel, IGalleryActions, IGalleryItem, GalleryItem,
    IGallery,Gallery,IGalleryItemActions,ViewMediaType,GalleryItemType,IViewMediaImageActions, getViewMediaTypeByIndex
} from "../../store/Gallery/Gallery";
import { InfoDialog, IInfoDialogActions } from "../../store/model/GalleryItemComponent";
import { IMember, Member, IMemberActions, IWdmMember, WdmMember, IWdmMemberActions } from "../../store/model/Member";
import { IEmployee, Employee, IEmployeeActions } from "../../store/model/Employee";
import { IRating, RatingType, IRatingActions } from "../../store/model/Rating";
import { RouteComponentProps } from 'react-router';
import { ConnectDragSource, ConnectDragPreview, DragSourceSpec, DragSourceConnector, DragSourceMonitor, DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import * as H from 'history';
import { LoginModal } from '../../components/LoginModal';
import { FacebookGraph, Deferred, Facebook } from "../../store/facebook-class"
import { IAuthentication, Authentication, IAuthenticationActions } from "../../utils/Authentication";
import * as $ from 'jquery';
import { iframeTracker, IFrameTrackerAction } from '../../store/utils/iframetracker';
import { isAlive, IStateTreeNode } from 'mobx-state-tree';
import { PageContext, WDMSubConext } from "../../constants/enums";
import { IWITDocActions } from "../../store";
import FlippingBook from "../../components/Gallery/FlippingBook";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";
import { TopPanelGIC } from "../../components/Gallery/TopPanelGIC";
import { BottomPanelGIC } from "../../components/Gallery/BottomPanelGIC";
import { NicknameSympleGIC } from "../../components/Gallery/NicknameSympleGIC";
import { RatingPartGIC } from "../../components/Gallery/RatingPartGIC";
import { MyCloudModel, IMyCloudModel, IMyCloudModelActions } from "../../store/model/MyCloudModel";
import { storeActionObserver } from "../../store/StoreActionObserver";

interface IGalleryItemProps {
    key?: string,
    history?: H.History,
    location?: H.Location,
    match?: any,
    fb?: Facebook,
    twitter?: Twitter;
    wdmItem?: string;
    galleryItem: IGalleryItem;
    previewMediaType?: ViewMediaType;
    pageContext?: PageContext;
    wdmSubConext?: WDMSubConext;
    gallery?: IGallery;
    memberExternal?: IMember;
    wdmMemberExternal?: IWdmMember;
    employeeExternal?: IEmployee;
    galleryModel?: GalleryModel;
    facebookGraphCommon?: FacebookGraph;
    localize?: ILocalizeActions;
    authentication?: Authentication;
    cancelAuth?: boolean;
    parent: any;
    isRouteAction?: boolean;
    simplyStyle?: boolean;
    column: number;
    parentType: string;
    size?: {};
    doubleSide?: boolean;
    modalDialogManager?: ModalDialogManager;
    myCloudModel?: MyCloudModel;
    checkedSelected?: boolean;
    ignoreHidePanels?: boolean;
    ignoreDraging?: boolean;

    onItemSelected?(item: IGalleryItem, data?: GalleryItemEventData): void;
    onItemLoaded?(item: IGalleryItem): void;
    onSetCancelAuth?(state: boolean, parent: any): void;
    onDelete?(item: IGalleryItem, parent: any): void;
    onMove?(): void;
    onDublicate?(): void;
    onEdit?(): void;
    onAddToCart?(): void;
    onPublish?(parent: any): void;
    onLayoutComplete?(): void;
}

interface IGalleryItemState {
    loadedFB: boolean;
    visibleTopPanel: boolean;
    durationShowHideCost: string;
    overCard: boolean;
    overPopupOperation: boolean;
    imgContent: string[];
    imgContentLoaded: boolean;
    //ratingValue: number;
    ratingValueLoad: boolean;
    reload: boolean;
    showDimmerLoadingSocial: boolean;
    loadedParameters: boolean;
    loadingParameters: boolean;
    height: number;
    frameLoaded: boolean;
    checkedVal?: boolean;
    observerId?: string[];
}

// ----------- Drag-n-Drop behavior -----------------
export interface GalleryItemSourceProps {
    connectDragSource: ConnectDragSource,
    connectDragPreview: ConnectDragPreview,
    item: IGalleryItem,
    isDragging: boolean;
}


export interface GalleryItemEventData {
    id?: string;
    src?:string;
}

// Spec: drag events to handle.
const galleryItemSourceSpec: DragSourceSpec<GalleryItemSourceProps & IGalleryItemProps> = {
    beginDrag: (props: IGalleryItemProps, monitor: DragSourceMonitor, component?: React.Component<IGalleryItemProps>): IGalleryItem => {
        if (component && component.context && component.context.mobxStores) {
            const witdoc = component.context.mobxStores.witdoc as any as IWITDocActions;
            if (witdoc)
                witdoc.disableSelection(true);
        }
        return props.galleryItem;
    },
    endDrag: (props: IGalleryItemProps, monitor:DragSourceMonitor, component?: React.Component<IGalleryItemProps>) => {
        if (component && component.context && component.context.mobxStores) {
            const witdoc = component.context.mobxStores.witdoc as any as IWITDocActions;
            if (witdoc)
                witdoc.disableSelection();
        }
    }
};

// Collect: Put drag state into props
const galleryItemSourceCollector = (connect: DragSourceConnector, monitor: DragSourceMonitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        offset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }
};

type GalleryItemComponentProps = RouteComponentProps<{}> & IGalleryItemProps & GalleryItemSourceProps;

@inject("localize", "fb", "twitter", "galleryModel", "facebookGraphCommon", "authentication", "modalDialogManager", "myCloudModel")
@observer
export class GalleryItemComponentNoDrag extends React.Component<GalleryItemComponentProps, IGalleryItemState> {
    
    constructor(props: any) {
        super(props);
        this.state = {
            loadedFB: false,
            visibleTopPanel: false,
            durationShowHideCost: "1",
            overCard: false,
            overPopupOperation: false,
            imgContent: [],
            imgContentLoaded: false,
            //ratingValue: 0,
            ratingValueLoad: false,
            reload: false,
            showDimmerLoadingSocial: true,
            loadedParameters: false,
            loadingParameters: false,
            height: 0,
            frameLoaded: false,
            checkedVal: false,
            observerId: []
        };
    }

    ID: number = 0;
    wdmItemInternal: string = "";
    wdmItemHash: string = "";
    infoDialog: InfoDialog = InfoDialog.create();
    publishedDesign: IPublishedDesign = (Published.create() as any as IPublishedDesign);
    memberOwnerRole: boolean = false;
    memberInternal: IMember = (Member.create() as any as IMember);
    wdmMemberInternal: IWdmMember = (WdmMember.create() as any as IWdmMember);
    employeeInternal?: IEmployee = (Employee.create() as any as IEmployee);
    isInfoDataLoaded: boolean = false;
    isImageLoaded: boolean = false; 
    fbDataHref: string = "";
    fbArtistDataHref: string = "";
    twitterUrlWithText: string = "";
    twitterArtistUrlWithText: string = "";
    employeeRole?: boolean = false;
    publishStatus: string = "";
    ratingType: RatingType = RatingType.create();
    wdmRating: IRating = (RatingType.create() as any as IRating);
    wdmRatingValue: number = 0;
    ratingValue: number = 0;
    showLoginModal: boolean = false;
    memberExternal?: IMember;
    wdmMemberExternal?: IWdmMember;
    //employeeExternal?: IEmployee;
    galleryModel?: IGalleryModel;
    galleryItem: IGalleryItem = (GalleryItem.create(({ type: "", name: "" }) as any) as any as IGalleryItem);
    gallery?: IGallery = (Gallery.create({ type: "", name: "", hash: "", items: [] }) as any as IGallery);
    anonymousRole: boolean = false;
    memberToken: boolean = false;
    employeeToken: boolean = false;
    wdmItemLoaded: Deferred = new Deferred();
    private hasToken: boolean = false;
    private checkedToken: Deferred = new Deferred();
    private routingAction: boolean = false;
    private wrongRoutingAction: boolean = false;
    private loadingParameters: Deferred = new Deferred();
    private _isMounted: boolean = false;

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {
        let self = this;
        this.ID = Date.now();

        this.gallery = this.props.gallery;
        //console.log("mount id:", this.ID);

        this.setState({ visibleTopPanel: this.props.ignoreHidePanels ? true : false });

        this.memberExternal = this.props.memberExternal;
        this.wdmMemberExternal = this.props.wdmMemberExternal;
        this.employeeRole = (this.memberExternal && this.memberExternal.employeeMemberFlg === 'Yes');
        //this.employeeExternal = this.props.employeeExternal;
        this.setWdmItem();

        if (self.routingAction && !self.wrongRoutingAction) {
            this.wdmItemLoaded.promise.then(() => {
                self.initPage();
            });
        } else {
            // if not routing action
            self.galleryItem = self.props.galleryItem;
            self.loadGalleryItemProps(self, true);
        }
    }

    private setWdmItem() {
        const params = this.props.match!.params;
        if (params) {
            const obj = JSON.parse(JSON.stringify(params));
            if (obj.hasOwnProperty("hash")) {
                this.wdmItemHash = obj["hash"];
                this.routingAction = true;
                const self = this;
                (this.publishedDesign as any as IPublishedDesignActions).getPublishedByHash(this.wdmItemHash)
                    .then((publishedItem) => {
                        self.wdmItemInternal = publishedItem.wdmItemKey.toString();
                        this.wdmItemLoaded.resolve();
                        return;
                    });
            } else {
                // routing action - but not have hash parameter - it is wrong!
                this.wrongRoutingAction = true;
                this.wdmItemLoaded.resolve();
            }
        } else {
            // not routing action - try get wdmItem from props
            if (this.props.wdmItem) {
                this.wdmItemInternal = this.props.wdmItem;
                // try get hash for generation Link url
                if (this.props.galleryItem && this.props.galleryItem.hash) {
                    let hash = this.props.galleryItem.hash.split('/');
                    if (hash.length > 1) {
                        this.wdmItemHash = hash[1];
                    }
                }
            }
        }
    }

    private initPage() {
        //todo: in future add ignore if not routing call path
        let self = this;
        this.checkToken();
        this.checkedToken.promise.then(() => {
            if (!self.hasToken) {
                if (self.props.cancelAuth) {
                    self.anonymousRole = true;
                    self.loadElementsPage(self);
                    return;
                }

                // show sign in modal
                if (!(self.props.authentication! as any as IAuthentication).singleLoginModalOpening) {
                    self.showLoginModal = true;
                    (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(true);
                    self.forceUpdate();
                }
            } else {
                if (self.anonymousRole) {
                    self.loadElementsPage(self);
                    return;
                }

                if (!self.memberExternal &&
                    self.memberToken) {
                    // try load for member
                    self.memberExternal = (Member.create() as any as IMember);
                    (self.memberExternal as any as IMemberActions)
                        .loadByMember()
                        .then(() => {
                            if (self.memberExternal) {
                                self.wdmMemberExternal = (WdmMember.create() as any as IWdmMember);
                                (self.wdmMemberExternal as any as IWdmMemberActions)
                                    .loadByMember(self.memberExternal.memberKey)
                                    .then(() => {
                                        self.loadElementsPage(self);
                                        return;
                                    });
                            }
                        });
                }
                else
                    self.loadElementsPage(self);
            }
        });
    }

    private loadElementsPage(self: any) {
        if (!self.galleryItem.hash)
            self.galleryItem = self.props.galleryItem;

        if (self.galleryItem.hash) {
            self.loadRating();
            self.reloadSocialComponent();
            self.loadGalleryItemProps(self);
        } else {
            // load published parameters
            self.loadPublishedParameters(self, self.wdmItemInternal, true);
            self.loadRating();
            self.reloadSocialComponent();
        }
    }

    public componentDidMount() {

        this._isMounted = true;
        
        //if (this.props.twitter && this.props.fb && this.props.fb.loaded) {
        //    this.props.twitter.load();
        //    this.props.fb.refresh();
        //}
        
        let intervalId = setInterval(() => {
                //check if iframe exists
                let frame = $(`#parent-div-fb-like_${this.ID}`);
                if (frame && frame.length > 0) {

                    (iframeTracker as any as IFrameTrackerAction).tracker(frame,
                        {
                            blurCallback: () => {
                                if (this.props.authentication)
                                    this.props.fb!.loginStatusEventHandling((this.props.authentication as any as IAuthenticationActions));
                            }
                        });
                    //clear the interval
                    clearInterval(intervalId);
                }
            },
            1000);

        // Connect drag-n-drop source
        const { galleryItem, connectDragPreview } = this.props;
        const self = this;
        if (galleryItem) {
            (galleryItem as any as IGalleryItemActions).loadMedia(this.props.previewMediaType).then(() => {
                self.imageLoadedHandler();
                if (!self.props.ignoreDraging)
                    connectDragPreview(self.getDragPreview(), { captureDraggingState: true });
            }).catch(() => {
                self.imageLoadedHandler();
                if (!self.props.ignoreDraging)
                    connectDragPreview(self.getDragPreview(), { captureDraggingState: true });
            });
        } 

        let observerId = storeActionObserver.registerStoreAction(this.props.myCloudModel, "selectedAllCheckbox",
            (storeArgs: any, args: any) => {
                if (storeArgs.length > 0)
                    this._isMounted && this.setState({ checkedVal: storeArgs[0] });
            });
        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    getDragPreview() {
        const { galleryItem } = this.props;
        const result = document.createElement("img");      
        //result.src = (galleryItem.viewMedia[0].thumbImage as any as IViewMediaImageActions).getImageUrl(galleryItem.hash, undefined, galleryItem.isInMyCloud);
        return result as any;
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    componentWillReceiveProps(nextProps: GalleryItemComponentProps) {
        if (this.props.checkedSelected !== nextProps.checkedSelected) {
            this.setState({ checkedVal: nextProps.checkedSelected });
        }
    }

    shouldComponentUpdate(nextProps: GalleryItemComponentProps, nextState: IGalleryItemState) {
        //console.log('SCU: ', this.props.galleryItem.hash, nextProps, this.props);

        //DnD performance fix
        if (!nextProps.isDragging && (nextProps as any).offset !== (this.props as any).offset) return false;
        return true;
    }

    private checkToken(): void {
        let self = this;
        let token = localStorage.getItem('token');
        if (token != null) {
            (this.props.authentication as any as IAuthenticationActions).validateToken(token).then((valid) => {
                self.hasToken = valid;
                // if not valid token, mb expired, then clear it
                if (!valid) {
                    localStorage.removeItem("token");
                    self.checkedToken.resolve();
                } else {
                    (self.props.authentication as any as IAuthenticationActions)
                        .isAnonymousUser(token!).then((isAnonymous) => {
                            if (isAnonymous) {
                                console.log("Using anonymous token!");
                                self.anonymousRole = true;
                            } else {
                                self.memberToken = true;
                            }
                            self.hasToken = true;
                            self.checkedToken.resolve();
                        });
                }
            });
        } else {
            const cartOrderId = this.getLocalStorageParameter("CartOrderId");
            if (cartOrderId) {
                (this.props.authentication as any as IAuthenticationActions)
                    .loginByCartOrderId(cartOrderId,
                        this.getLocalStorageParameter("RememberMe"),
                        this.getLocalStorageParameter("YPSessionTimeout"),
                        this.getLocalStorageParameter("YPUICulture"))
                    .then(() => {
                        let tokenOutside = localStorage.getItem('token');
                        if (tokenOutside) {
                            (self.props.authentication as any as IAuthenticationActions)
                                .isAnonymousUser(tokenOutside!).then((isAnonymous) => {
                                    if (isAnonymous) {
                                        console.log("Using anonymous token!");
                                        self.anonymousRole = true;
                                    } else {
                                        self.memberToken = true;
                                    }
                                    self.hasToken = true;
                                    self.checkedToken.resolve();
                                });
                        } else
                            self.checkedToken.resolve();
                    });
            }
            else
                this.checkedToken.resolve();
        }
    }

    private getLocalStorageParameter(name: string) {

        const value = localStorage.getItem(name);
        return value == null ? "" : value;
    };

    private doLoadingMemberInfoForMember(self: any, token: string | null) {
        (self.props.authentication as any as IAuthenticationActions)
            .isAnonymousUser(token!).then((isAnonymous) => {
                if (isAnonymous) {
                    console.log("Using anonymous token!");
                } else {
                    self.setAuthState(self);
                }
            });
    }

    private loadRating(reload: boolean = false) {
        if (this.memberExternal &&
            this.memberExternal.emailAddr !== "" &&
            this.wdmItemInternal &&
            this.wdmItemInternal !== "") {
            let self = this;
            const ratingActions = (this.ratingType as any as IRatingActions);
            ratingActions
                .getRating(self.memberExternal!.memberKey.toString(), self.wdmItemInternal!.toString())
                .then((ratingObj) => {
                    // 1. check that has rating object in table (mb first time)
                    if (ratingObj.raterMemberOrUniqId === "") {
                        // 1.2 if doesn't has create rating object
                        (ratingObj as any as IRatingActions).setRatingValues(
                            self.wdmItemInternal!.toString(),
                            self.memberExternal!.memberKey.toString(),
                            0,
                            "WDM Item",
                            "No");
                        
                        ratingActions.save(ratingObj).then((saved) => {
                            if (saved < 0) {
                                console.log(this.translate('galleryItemComponent.errorRatingSaveLogInfo').toString());
                            }
                        });
                    }
                    
                    self.ratingValue = ratingObj.rating;
                    self.wdmRating = ratingObj;
                    if (reload && self._isMounted) {
                        self.setState({ reload: !self.state.reload });
                    }
                });
        }
    }

    private init() {
        // show published art component
        if (this.wdmItemInternal && this.wdmItemInternal !== "") {
            this.initPublishedState(this.wdmItemInternal);
            // my cloud - not published
        } else {
            // MyCloud
            let self = this;
            // if has init props member value
            if (this.memberExternal) {
                if (!(this.memberExternal as any as Member).isLoaded)
                    return;

                this.memberOwnerRole = true;
                this.memberInternal = this.memberExternal;
                this.wdmMemberInternal = this.wdmMemberExternal!;

                (this.infoDialog as any as IInfoDialogActions)
                    .setInfoDialogData(this.galleryItem, this.memberInternal, this.wdmMemberInternal)
                    .then(() => {
                        self.isInfoDataLoaded = true;
                        self.loadingParameters.resolve();
                    });
            }
            // else - must init itself
            else {
                (this.memberInternal as any as IMemberActions)
                    .load()
                    .then(() => {
                        (self.wdmMemberInternal as any as IWdmMemberActions)
                            .loadByMember(self.memberInternal.memberKey)
                            .then(() => {
                                (self.infoDialog as any as IInfoDialogActions)
                                    .setInfoDialogData(self.galleryItem, self.memberInternal, self.wdmMemberInternal)
                                    .then(() => {
                                        self.memberOwnerRole = true;
                                        self.isInfoDataLoaded = true;
                                        self.loadingParameters.resolve();
                                    });
                            });
                    });
            }
        }
    }

    private loadGalleryItemProps(self: any, reload: boolean = false) {
        let itself = self;

        //(self.galleryItem as any as IGalleryItemActions).resetMedia();
        if (!isAlive(self.galleryItem as any as IStateTreeNode)) return;

        (self.galleryItem as any as IGalleryItemActions).loadMedia().then(() => {
            //console.log("loadGalleryItemProps self.galleryItem:", self.galleryItem);
            itself.isImageLoaded = true;
            itself.imageLoadedHandler();

            if (reload) {
                //console.log("loadGalleryItemProps reload"); 
                if (itself._isMounted)
                    itself.forceUpdate();
            }
        }).catch(() => {
            itself.imageLoadedHandler();
        });;
    }

    private initPublishedState(wdmItem: string) {

        //console.log("initPublishedState this.publishedDesign.wdmItemId:", this.publishedDesign.wdmItemId);

        if (this.publishedDesign.wdmItemId !== "") {
            // member is owner or not
            if (this.memberExternal && this.memberExternal.emailAddr !== "") {
                this.memberOwnerRole = (this.memberInternal.memberKey === this.memberExternal!.memberKey);
                this.employeeRole = (this.memberExternal.employeeMemberFlg === 'Yes');
                // for member owner setting 0 rating value
                if (this.memberOwnerRole) {
                    this.ratingValue = 0;
                }
            } else {
                // is anonymous
                this.employeeRole = false;
                this.memberOwnerRole = false;
                this.ratingValue = 0;
                this.anonymousRole = true;

                //// is employee
                //if (this.employeeExternal && this.employeeExternal.userId !== "") {
                //    this.employeeRole = true;
                //    this.memberOwnerRole = false;
                //    this.ratingValue = 0;
                //} else {
                //    // try load employee
                //    this.employeeInternal = (Employee.create() as any as IEmployee);
                //    (this.employeeInternal as any as IEmployeeActions).load()
                //        .then((employee) => {
                //            // is employee
                //            if ((employee as IEmployee).userId !== "") {
                //                this.employeeRole = true;
                //                this.memberOwnerRole = false;
                //                this.ratingValue = 0;
                //            } else {
                //                // is anonymous
                //                this.employeeRole = false;
                //                this.memberOwnerRole = false;
                //                this.ratingValue = 0;
                //                this.anonymousRole = true;
                //            }
                //        });
                //}
            }

            let dataHref: string = `${publishedConfig.dataHref}/artcomponent/${this.wdmItemHash}`;
            this.fbDataHref = dataHref;
            this.wdmRatingValue = this.publishedDesign.wdmRating; 
            return;
        }

        this.loadPublishedParameters(this, wdmItem, false);
    }

    private loadPublishedParameters(itself: any, wdmItem: string, needInitGallery: boolean) {
        let dataHref: string = `${publishedConfig.dataHref}/artcomponent/${this.wdmItemHash}`;
        itself.fbDataHref = dataHref;
        itself.fbArtistDataHref = "https://www.localhost/Web/Mbr/Profile.aspx";
        itself.twitterArtistUrlWithText = `${twitterConfig.twitterUrl}text=${
            "Check artist of this design in YouPrint by url:"}&url=${itself.fbArtistDataHref}`;

        let self = itself;
        (self.publishedDesign as any as IPublishedDesignActions).setPublished(wdmItem)
            .then((publishedItem) => {
                self.wdmRatingValue = publishedItem.wdmRating; //todo: check mb not update value when re-rendering component

                self.twitterUrlWithText = `${twitterConfig.twitterUrl}text=${
                    "Check this my design in YouPrint by url:"}&url=${dataHref}&hashtags=${publishedItem.keywordsText}`;
                
                self.publishStatus = publishedItem.publishStatus;
                // member
                if (self.memberExternal && self.memberExternal!.emailAddr !== "") {
                    // load the wdm_item member
                    let memberKey = publishedItem.member;
                    (self.memberInternal as any as IMemberActions).loadByMember(memberKey)
                        .then(() => {
                            // checking the member on the owner role
                            self.memberOwnerRole =
                                (self.memberInternal.memberKey === self.memberExternal!.memberKey);
                            self.employeeRole = (self.memberExternal.employeeMemberFlg === 'Yes');
                        });
                } else {
                    // is anonymous
                    self.employeeRole = false;
                    self.memberOwnerRole = false;
                    self.anonymousRole = true;

                    //// check employee
                    //if (self.employeeExternal && self.employeeExternal!.userId !== "") {
                    //    // employee
                    //    self.employeeRole = true;
                    //    self.memberOwnerRole = false;
                    //} else {
                    //    // try load employee
                    //    self.employeeInternal = (Employee.create() as any as IEmployee);
                    //    (self.employeeInternal as any as IEmployeeActions).load()
                    //        .then((employee) => {
                    //            if ((employee as IEmployee).userId !== "") {
                    //                self.employeeRole = true;
                    //                self.memberOwnerRole = false;
                    //            } else {
                    //                // is anonymous
                    //                self.employeeRole = false;
                    //                self.memberOwnerRole = false;
                    //                self.anonymousRole = true;
                    //            }
                    //        });
                    //}
                }

                self.initInfoDialog(self, publishedItem);
                // load G and loag GI
                //console.log("loadPublishedParameters needInitGallery || !self.galleryItem:", needInitGallery || !self.galleryItem);
                if (needInitGallery || !self.galleryItem) {
                    self.loadGallery(self);
                }
            });
    }

    private initInfoDialog(self: any, publishedItem: IPublishedDesign) {
        if (self.memberInternal.emailAddr !== "") {
            self.setInfoDialog(self, publishedItem);
        } else {
            (self.memberInternal as any as IMemberActions).loadByMember(publishedItem.member)
                .then(() => {
                    self.setInfoDialog(self, publishedItem);
                });
        }
    }

    private setInfoDialog(self: any, publishedItem: IPublishedDesign) {
        (self.wdmMemberInternal! as any as IWdmMemberActions).loadByMember(publishedItem.member).then(
            () => {
                (self.infoDialog as any as IInfoDialogActions)
                    .setInfoDialogData(self.galleryItem,
                        self.memberInternal,
                        self.wdmMemberInternal,
                        publishedItem)
                    .then(() => {
                        self.isInfoDataLoaded = true;

                        self.loadingParameters.resolve();

                        //if (self._isMounted)
                        //    self.forceUpdate();
                    });
            });
    }

    private checkLoadedSocialElement() {
        if (this.props.fb && this.props.fb.loaded) {
            let fbJsElement = this.props.fb.getFBJsElement();
            if (fbJsElement) {
                setTimeout(() => {
                        setTimeout(() => {
                                if (this._isMounted)
                                    this.setState({ showDimmerLoadingSocial: false });
                            },
                            2500);
                    },
                    2000);
            } else {
                setTimeout(() => {
                        this.checkLoadedSocialElement();
                    },
                    2000);
            }
        } else {
            setTimeout(() => {
                    this.checkLoadedSocialElement();
                },
                1000);
        }
    }

    private reloadSocialComponent() {
        if (this.props.twitter && this.props.fb) {
           // this.props.twitter.load();
           // this.props.fb.refresh();
            this.checkLoadedSocialElement();
        } else {
            setTimeout(() => {
                this.reloadSocialComponent();
            }, 1000);
        }
    }

    onLayoutComplete = (delay?: number) => {

        const layoutFunc = () => {
            if (this.props.onLayoutComplete) this.props.onLayoutComplete();
        };

        if (!delay)
            layoutFunc();
        else
            setTimeout(() => this.onLayoutComplete(), delay);
    }

    handleOverCard = () => {
        this.setState({ visibleTopPanel: true, overCard: true });
        
        if (!this.routingAction &&
            !this.state.loadedParameters && !this.state.loadingParameters) {
            this.setState({ loadingParameters: true });

            let self = this;
           
            // load published parameters
            if (this.wdmItemInternal) {
                this.loadPublishedParameters(this, this.wdmItemInternal, false);

                this.loadingParameters.promise.then(() => {
                    self.loadRating(true);
                    self.reloadSocialComponent();

                    if (self._isMounted)
                        self.setState({ loadingParameters: false, loadedParameters: true });
                });

            } else {
                if (this.props.simplyStyle) {
                    if (self._isMounted)
                        self.setState({ loadingParameters: false, loadedParameters: true });
                    return;
                }

                this.init();
                this.loadingParameters.promise.then(() => {
                    if (self._isMounted)
                        self.setState({ loadingParameters: false, loadedParameters: true });
                });
            }
        }
    };

    handleLeaveCard = () => {
        if (this._isMounted)
            this.setState({
                visibleTopPanel: this.props.ignoreHidePanels
                    ? true
                    : this.state.overPopupOperation ? true : false,
                overCard: false
            });
    };

    handleOpenPopupOperation = () => {
        if (this._isMounted)
            this.setState({ overPopupOperation: true });
    }

    handleClosePopupOperation = () => {
        if (this._isMounted)
            this.setState({
                overPopupOperation: false,
                visibleTopPanel: this.props.ignoreHidePanels
                    ? true
                    : this.state.overCard ? true : false
            });
    }

    private onSubImageMouseDown(index: number) {
        (this.props.galleryItem as any as IGalleryItemActions).setSelectedSide(index);
    }

    private renderImages() {

        if (!isAlive(this.galleryItem as any as IStateTreeNode)) return "";
        
        const { connectDragSource } = this.props;
        if (this.state.imgContent.length > 0) {
            return (!this.props.ignoreDraging)
                ? connectDragSource(
                    <div className="drag-img" onClick={(e: any) => this.itemClickHandler(e, this.galleryItem)}>

                        <Grid divided centered columns={2} className="gi-grid-image">
                            <Grid.Row className="gallery-item-row-image-content">
                                {this.state.imgContent.map((contentOrUrl, index) => {
                                    return <Grid.Column width={Math.round(16 / this.state.imgContent.length) as any} key={index}
                                                        onMouseDown={() => this.onSubImageMouseDown(index)}
                                                        className="no-side-padding">
                                               <Image className={this.state.imgContent.length <= 1
                                                  ? "elmnt-stub"
                                                  : "gallery-item-main-image" }
                                                      src={contentOrUrl || require('../../assets/element-stub.png')}/>
                                           </Grid.Column>;
                                })}
                            </Grid.Row>
                        </Grid>
                    </div>)
                : <div className="drag-img" onClick={(e: any) => this.itemClickHandler(e, this.galleryItem)}>

                      <Grid divided centered columns={2} className="gi-grid-image">
                          <Grid.Row className="gallery-item-row-image-content">
                              {this.state.imgContent.map((contentOrUrl, index) => {
                                  return <Grid.Column width={Math.round(16 / this.state.imgContent.length) as any} key={index}
                                                      onMouseDown={() => this.onSubImageMouseDown(index)}
                                                      className="no-side-padding">
                                             <Image className={this.state.imgContent.length <= 1
                                                                    ? "elmnt-stub"
                                                                    : "gallery-item-main-image"}
                                                    src={contentOrUrl || require('../../assets/element-stub.png')}/>
                                         </Grid.Column>;
                              })}
                          </Grid.Row>
                      </Grid>
                  </div>;
        }

        // not loaded galleryItem
        if (!this.galleryItem) {
            setTimeout(() => {
                    //console.log("renderImages galleryItem undef");
                    this.loadGallery(this, true);
                },
                1000);
            return <div></div>;
        } else {
            //console.log("renderImages HAS galleryItem:", this.galleryItem);
        }

        // not loaded img
        const viewMediaArr = this.galleryItem.viewMedia;
        
        const { hash, type, isInMyCloud } = this.galleryItem;
        let previewMediaType:string|undefined = this.props.previewMediaType;

        if (viewMediaArr.length <= 0) {
            return <Image className={this.state.imgContent.length <= 1 ? "elmnt-stub" : ""}  src={require('../../assets/element-stub.png')} />;
        }

        let arrImgContent: string[] = [];

        let imgGrid = <Grid divided centered columns={2} className="gi-grid-image"
                            onClick={(e: any) => this.itemClickHandler(e, this.galleryItem)}>
                          <Grid.Row className="gallery-item-row-image-content">
                              {this.galleryItem.viewMedia.map((viewMedia, index, arr) => {

                                  const currentImage = previewMediaType === ViewMediaType.Screen
                                      ? viewMedia.screenImage!
                                      : viewMedia.thumbImage!;
                                if (type === GalleryItemType.Design || type === GalleryItemType.Element || type === GalleryItemType.Background)
                                    previewMediaType = getViewMediaTypeByIndex(index);
                                const contentOrUrl: string | undefined = (currentImage as any as IViewMediaImageActions)
                                    .getImageUrl(hash, previewMediaType || ViewMediaType.Thumb, isInMyCloud) || currentImage.content;


                                  let imageClassName = "gallery-item-main-image" + (type === GalleryItemType.Design || type === GalleryItemType.Background ? " design" : "");

                                  if (contentOrUrl) {                                      
                                      arrImgContent.push(contentOrUrl);
                                  }
                                  return <Grid.Column width={Math.round(16 / arr.length) as any} key={index} className="no-side-padding">
                                        <Image className={imageClassName} src={contentOrUrl || require('../../assets/element-stub.png')}/>
                                    </Grid.Column>;
                              })}
                          </Grid.Row>
                      </Grid>;

        if (!this.state.imgContentLoaded) {
            setTimeout(() => {
                if (this._isMounted) 
                    this.setState({ imgContent: arrImgContent, imgContentLoaded: true });
            }, 200);
        }
       
        return imgGrid;
    }

    private renderInfoElement() {
        //const { galleryItem } = this.props;
        //if (!this.galleryItem) return <div></div>;
        return <GalleryItemInfoPopup galleryItem={this.galleryItem} infoDialog={this.infoDialog}/>;
    }

    private onPublish(self: any) {
        if (self.props.onPublish)
            self.props.onPublish(self.props.parent);
    }

    private onChangeInfoDialog(parent: any, infoDialog: InfoDialog) {
        (parent.galleryItem as any as IGalleryItemActions).setParametes(infoDialog.artName);

        if (parent._isMounted)
            parent.forceUpdate();
    }

    private onDelete(item: IGalleryItem, parent: any) {
        if (parent.props.onDelete)
            parent.props.onDelete(item, parent.props.parent);
    }

    private renderTopPanelOperationElement() {
        //const { galleryItem } = this.props;
        //if (!this.galleryItem) return <div></div>;

        const mpDesignFolderHash = this.getMultiPageDesignFolderHash();

        return <GalleryItemOperationPopup
                   fbDataHref={this.fbDataHref}
                   fbArtistDataHref={this.fbArtistDataHref}
                   twitterUrlWithText={this.twitterUrlWithText}
                   twitterArtistUrlWithText={this.twitterArtistUrlWithText}
                   publishStatus={this.publishStatus}
                   handleOpenPopupOperation={this.handleOpenPopupOperation}
                   handleClosePopupOperation={this.handleClosePopupOperation}
                   galleryItem={this.galleryItem}
                   wdmItem={this.wdmItemInternal}
                   memberOwner={this.memberOwnerRole}
                   pageContext={this.props.pageContext}
                   wdmSubConext={this.props.wdmSubConext}
                   gallery={this.gallery}
                   employee={this.employeeRole}
                   infoDialog={this.infoDialog}
                   imgContent={this.state.imgContent}
                   member={this.memberInternal} 
                   memberExternal={this.memberExternal}
                   onDelete={this.onDelete}
                   onMove={this.props.onMove}
                   onDublicate={this.props.onDublicate}
                   onEdit={this.props.onEdit}
                   onAddToCart={this.props.onAddToCart}
                   onPublish={this.onPublish}
                   ratingValue={this.ratingValue}
                   wdmRatingValue={this.wdmRatingValue}
                   onChangeRating={this.onChangeRating}
                   onChangeInfoDialog={this.onChangeInfoDialog}
                   wdmRating={this.wdmRating}
                   publishedDesign={this.publishedDesign}
                   parent={this}
                   anonymousRole={this.anonymousRole}
                   mpDesignFolderHash={mpDesignFolderHash}/>;
    }

    private onRate(event: React.MouseEvent<HTMLDivElement>, data: RatingProps) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;


        this.setState({ ratingValueLoad: true });
        this.ratingValue = (data!.rating as number);

        (this.wdmRating as any as IRatingActions)
            .setRatingValues(this.wdmRating.wdmItemIdOrMember,
                             this.wdmRating.raterMemberOrUniqId,
                             this.ratingValue,
                             this.wdmRating.rateAgainst, 
                             this.wdmRating.raterIsMemberFlg);

        let self = this;
        (this.wdmRating as any as IRatingActions).updateRating(this.wdmRating)
            .then((result) => {
                if (!result) {
                    self._isMounted && self.setState({ ratingValueLoad: false });
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", this.translate('galleryItemComponent.errorRatingUpdateLogInfo').toString()));
                    return;
                }
                //todo: calculation of rating on the client side -for a quick presentation

                (self.publishedDesign as any as IPublishedDesignActions)
                    .updateWdmItem(self.publishedDesign)
                    .then((result: any) => {
                        if (!result.success) {
                            self._isMounted && self.setState({ ratingValueLoad: false });
                        } else {
                            (self.publishedDesign as any as IPublishedDesignActions).setPublished(self.wdmItemInternal!)
                                .then((publishedItem) => {
                                    self.wdmRatingValue = publishedItem.wdmRating;

                                    self._isMounted && self.setState({ ratingValueLoad: false });
                                });
                        }
                    }).catch((error: any) => {
                        self._isMounted && self.setState({ ratingValueLoad: false });
                        // show error label and set error input
                        console.log(error);
                        Promise.reject(error);
                    });
            }).catch((error: any) => {
                self._isMounted && self.setState({ ratingValueLoad: false });
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
                Promise.reject(error);
            });
    }

    public onChangeRating(self: any, ratingValue: number, wdmRatingValue: number, publishedDesign: IPublishedDesign) {
        self.ratingValue = ratingValue;
        self.wdmRatingValue = wdmRatingValue;
        self.publishedDesign = publishedDesign;
        self.setState({ ratingValueLoad: false });
    }

    private onCancelLoadSiginMember(self: any) {
        if (self.props.onSetCancelAuth && self.props.parent)
            self.props.onSetCancelAuth(true, self.props.parent);
        self.loadSiginMember(self);
    }

    private onLoadSiginMember(self: any) {

        const authAction = (self.props.authentication! as any as IAuthenticationActions);
        authAction.setSingleLoginModalOpening(false);
        authAction.resetReloadingComponents();
        authAction.setEventActivator(self.ID.toString());

        if (self.props.onSetCancelAuth && self.props.parent)
            self.props.onSetCancelAuth(false, self.props.parent);
        self.loadSiginMember(self);
    }

    private loadSiginMember(self: any) {
        self.showLoginModal = false;

        if (self._isMounted) {
            self.forceUpdate();
        }

        // load memberExternal, wdmMemberExternal, employeeExternal
        if (!self.memberExternal) {
            self.memberExternal = (Member.create() as any as IMember);
        }
        (self.memberExternal as any as IMemberActions).load()
            .then((member) => {
                if (member.emailAddr !== "") {
                    if (!self.wdmMemberExternal) {
                        self.wdmMemberExternal = (Member.create() as any as IMember);
                    }
                    (self.wdmMemberExternal as any as IWdmMemberActions)
                        .loadByMember(member.memberKey);

                    // load published parameters
                    self.loadPublishedParameters(self, self.wdmItemInternal, true);
                    // load rating 
                    self.loadRating(true);
                } else {
                    //todo: logic for anonymous
                }
            });
    }

    private itemClickHandler(e: React.MouseEvent<HTMLElement>, galleryItem: IGalleryItem) {
        //Prevent parent's onClick handeler
        e.stopPropagation();
        if (this.props.onItemSelected) {
            let id: string | undefined = undefined;
            let src: string | undefined = undefined;
            if (e.target && e.target.nodeName === "IMG" && e.target.hasAttribute("src")) {
                src = e.target.src;
                    id = src.indexOf(ViewMediaType.DesignFront) >= 0
                        ? ViewMediaType.DesignFront
                    : (src.indexOf(ViewMediaType.DesignBack) >= 0 ? ViewMediaType.DesignBack : "");                
            }

            const data = { id:id, src:src };
            this.props.onItemSelected(galleryItem, id ? data as any : undefined);
        }
    }

    private imageLoadedHandler() {
        if (this.props.onItemLoaded) this.props.onItemLoaded(this.galleryItem);
    }
    
    private loadGallery(self: any, reload: boolean = false) {

        if (self.props.galleryModel) {
            self.galleryModel = self.props.galleryModel;
        } else {
            self.galleryModel = (GalleryModel.create() as any as IGalleryModel);
        }
        let itself = self;
        if (!itself.galleryItem)
            if (!(self.galleryModel as any as IGallery).isLoaded) {
                (self.galleryModel as any as IGalleryModelActions).load()!.then(() => {
                    if ((itself.galleryModel as any as IGalleryModel).galleries.length > 0) {
                        (itself.galleryModel as any as IGalleryModel).galleries.map((galleryParent) => {
                            (galleryParent as any as IGalleryActions).load()!.then(() => {
                                if (galleryParent.items.length > 0) {
                                    galleryParent.items.map((item) => {
                                        (item as any as IGalleryItemActions).load().then((galleryItem) => {
                                            (galleryItem as any as IGalleryItem).children!.map((children) => {
                                                if (children.hash === itself.publishedDesign!.storagePath) {//todo: mb need check loaded publishedDesign
                                                    itself.galleryItem = children;
                                                    itself.gallery = item;
                                                    itself.loadGalleryItemProps(itself, reload);
                                                }
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
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

    private renderRatingPart() {
        let ratinValueElement = this.state.ratingValueLoad
            ? <Loader size="mini" active />
            : `(${this.wdmRatingValue.toFixed(2)})`;

        return <RatingPartGIC ratingValueElement={ratinValueElement} column={this.props.column}
            disabled={this.memberOwnerRole || this.employeeRole || this.anonymousRole || !this.isInfoDataLoaded}
            parentType={this.props.parentType} ratingValue={this.ratingValue}
            onRate={(event, data) => this.onRate(event, data)}/>;
    }

    private renderNickNameforSimplyStyle(isDoubleSide?: boolean | undefined) {

        if (!isAlive(this.galleryItem as any as IStateTreeNode)) return <div></div>;

        return this.props.simplyStyle
            ? <NicknameSympleGIC isDoubleSide={isDoubleSide} galleryItem={this.galleryItem}/>
            : "";
    }

    eventExternalSignin() {
        const statusChangeEventActivator = (this.props.authentication! as any as IAuthentication).statusChangeEventActivator;
        if (statusChangeEventActivator !== "" 
            && statusChangeEventActivator !== this.ID.toString()
            && (this.props.authentication! as any as IAuthenticationActions).reloadedComponent(this.ID.toString())) {

            (this.props.authentication! as any as IAuthenticationActions).markReloadingComponent(this.ID.toString());

            this.setState({ loadingParameters: false, loadedParameters: false });
        }
    }

    private onClickFlippingBook(event: any) {
        //if (this.props.onClickFlippingBook) {
        //    this.props.onClickFlippingBook(event, this.props.galleryItem.hash);
        //}
    }

    getMultiPageDesignFolderHash() {
        const { galleryItem } = this.props;

        if (galleryItem.originalDesignHash)
            return galleryItem.originalDesignHash.substring(0, galleryItem.originalDesignHash.lastIndexOf('/'));
        else
            return "";
    }

    frameLoadedEvent(loaded: boolean) {
        this.setState({ frameLoaded: loaded });
    }

    onChangeSelected = (event: any, data: any) => {
        if (!this.props.myCloudModel) return;

        (this.props.myCloudModel as any as IMyCloudModelActions).changeCountSelectedGIC(data.checked);

        this._isMounted && this.setState({ checkedVal: data.checked });
    }

    public render() {
        
        const { simplyStyle } = this.props;

        //console.log("render id:", this.ID);
        // if not sign in then need login
        if (this.showLoginModal && !this.props.cancelAuth) {
            return <div>
                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.showLoginModal}
                                   onCancelLoginModal={this.onCancelLoadSiginMember}
                                   parentCallback={this.onLoadSiginMember} parent={this}/>
                   </div>;
        }

        this.eventExternalSignin();

        let ratingContent: JSX.Element = <div></div>;
        let costContent: any = <div></div>;
        let published: boolean = (this.wdmItemInternal !== "");

        // routing action
        if (this.routingAction && !this.wrongRoutingAction) {
            this.init();

            if (this.wdmItemInternal && this.wdmItemInternal !== "") {
                ratingContent = this.renderRatingPart();

                costContent = this.publishedDesign.price > 0
                    ? <div className={this.state.visibleTopPanel ? "gallery-item-main-cost" : ""}>{`$${this.publishedDesign.price}`}</div>
                    : <div></div>;
            }
        }

        //if published component and not routing action
        if (published && !this.routingAction) {
           
            ratingContent = this.renderRatingPart();
            
            if (this.galleryItem && this.galleryItem.price) {
                costContent = parseInt(this.galleryItem.price) > 0
                    ? <div className={this.state.visibleTopPanel ? "gi-main-cost gi-rail-cost" : "gi-main-cost"}>{`${parseInt(this.galleryItem.price)}`}</div>
                    : <div></div>;
            }
        } 

        const { galleryItem } = this.props;
        if (!this.galleryItem) {
            console.log('wrong galleryItem empty!');
            //return null;
        }

        const isDoubleSide = this.isImageLoaded && galleryItem.viewMedia.length === 2
            || this.galleryItem.isMultiPage ? this.galleryItem.isMultiPage : false;
        //var vmitems = galleryItem.viewMedia.map((image, index) => {
        //    const currentImage = image.thumbImage!;
        //    let contentOrUrl: string | undefined = currentImage.content ||
        //        (currentImage as any as IViewMediaImageActions).getImageUrl(galleryItem.hash,
        //            getViewMediaTypeByIndex(index));
        //});

        const mpDesignFolderHash = this.getMultiPageDesignFolderHash();

        const loaded = this.galleryItem.isMultiPage
            ? this.state.frameLoaded
            : this.isImageLoaded;

        // hard code logic for SaveAs window and GalleryView
        // and MP page-we show compressed FlippingBook
        const compressMpSimpleView = this.galleryItem.isMultiPage && simplyStyle;
        const widthFlippingBook = compressMpSimpleView ? 272 : undefined;

        const showTopLeftCheckBox = this.props.myCloudModel
            ? (this.props.myCloudModel as any as IMyCloudModel).showTopLeftCheckBox
            : false;
        const leftContentElement: JSX.Element = showTopLeftCheckBox
            ? <Checkbox onChange={(e, data) => this.onChangeSelected(e, data)} checked={this.state.checkedVal}/>
            : !this.isInfoDataLoaded && this.loadingParameters
                ? <Loader active inline size='tiny'/>
                : ratingContent;

        const rightContentElement = this.props.simplyStyle
            ? <div></div>
            : !this.isInfoDataLoaded && this.loadingParameters
                ? this.props.ignoreHidePanels ? "" : <Loader active inline size='tiny'/>
                : this.renderTopPanelOperationElement();

        const visibleBottomPanel = this.state.visibleTopPanel || this.props.simplyStyle;

        return <div className={`gallery-item ${isDoubleSide ? "ds" : ""} clmn-${this.props.column} ${
            simplyStyle ? "simple" : ""} ${compressMpSimpleView ? "mp-simple-view-compress" : ""}`} key={this.props.key}>
                   <Dimmer.Dimmable blurring dimmed={!loaded}>
                       <Dimmer active={!loaded}>
                           <Loader>{this.translate('galleryItemComponent.loadingText').toString()}</Loader>
                       </Dimmer>
                       <Card onMouseLeave={(e: any) => this.handleLeaveCard()}
                             onMouseOver={(e: any) => this.handleOverCard()} className="gallery-item-main-card">

                           <div className="gi-img-container">
                               {this.galleryItem.isMultiPage
                                   ? <FlippingBook designFolderHash={mpDesignFolderHash}
                                                   onClickHandler={(event: any) => this.onClickFlippingBook(event)}
                                                   frameLoadedEvent={(loadState) => this.frameLoadedEvent(loadState)}
                                                   bookSize={"Med"}
                                                   width={widthFlippingBook}/>
                                   : this.isImageLoaded
                                        ? this.renderImages()
                                        : <Loader active inline/>}
                               {costContent}
                               <TopPanelGIC galleryItem={this.galleryItem}
                                            visible={!this.props.simplyStyle && this.state.visibleTopPanel}
                                            parentType={this.props.parentType} column={this.props.column}
                                            leftContentElement={leftContentElement} rightContentElement={rightContentElement} 
                                            itemClickHandler={(e: any) => this.itemClickHandler(e, this.galleryItem)}
                                            onClickMainDiv={(e: any) => this.onClickMainDiv(e)}/>

                               <BottomPanelGIC simplyStyle={this.props.simplyStyle} visible={visibleBottomPanel} galleryItem={this.galleryItem}
                                               isInfoDataLoaded={this.isInfoDataLoaded} loadingParameters={this.state.loadingParameters}
                                               published={published} fbDataHref={this.fbDataHref} twitterUrlWithText={this.twitterUrlWithText}
                                               loadedParameters={this.state.loadedParameters}
                                               nickNameForSimplyStyleElement={this.renderNickNameforSimplyStyle(isDoubleSide)}
                                               infoElement={this.renderInfoElement()}
                                               itemClickHandler={(e: any) => this.itemClickHandler(e, this.galleryItem)}
                                               onClickMainDiv={(e: any) => this.onClickMainDiv(e)}
                                               handleOpenPopupOperation={this.handleOpenPopupOperation}
                                               handleClosePopupOperation={this.handleClosePopupOperation}/>
                           </div>
                       </Card>
                   </Dimmer.Dimmable>
               </div>;
    }
}

const dragItemComponent = DragSource('item', galleryItemSourceSpec, galleryItemSourceCollector)(GalleryItemComponentNoDrag);
export { dragItemComponent as GalleryItemComponent};
