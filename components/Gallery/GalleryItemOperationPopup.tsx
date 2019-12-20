import * as React from 'react';
import { ITagItem, TagItem, ITagItemList, TagItemList, ITagItemDesignListActions, ITagItemListActions } from "../../store/model/TagItem";
import {
    IPublishedDesignActions, IPublishedDesign,
    IWdmItemLogList, WdmItemLogList, IWdmItemLogListActions, IWdmItemLog
} from "../../store/Gallery/Published";
import {
    Divider, Header, List, TextArea,
    Transition, Rating, Grid, Icon, Segment, Popup, Image, Input, InputProps, Label, Rail,
    InputOnChangeData, RatingProps, Loader
} from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { Facebook } from "../../store/facebook-class";
import { Twitter } from "../../store/twitter-class"
import { IGalleryItem, ViewMediaType, IGallery, IGalleryModel } from "../../store/Gallery/Gallery";
import { TextEditor } from "../../components/TextEditor";
import { IInfoDialog, InfoDialog, IInfoDialogActions } from "../../store/model/GalleryItemComponent";
import { GalleryItemPublishBlock } from "../../components/Gallery/GalleryItemPublishBlock"
import { GalleryItemMyCloudBlock } from "../../components/Gallery/GalleryItemMyCloudBlock"
import { SearchBox, ISearchItem } from "../../components/SearchBox";
import { IMember, IWdmMember, WdmMember, IWdmMemberActions } from "../../store/model/Member";
import { PublishingData, IPublishingData, IPublishingActions } from "../../store/Gallery/Publishing";
import { IRating, RatingType, IRatingActions } from "../../store/model/Rating";
import {
        galleryItemOperationModel,
        GalleryItemOperationModel,
        IGalleryItemOperationModelActions,
        IGalleryItemOperationModel
    }
    from "../../store/model/GalleryItemComponent";
import { GalleryItemStatusType } from "../../constants/enums";
import { sanitize } from 'dompurify'
import { GalleryItemSharePopup } from "../../components/Gallery/GalleryItemSharePopup"
import { FBCommentPopup } from "../../components/Gallery/GalleryItemFBCommentPopup"
import { ILocalizeActions } from '../../store/Localize';
import { isAlive, IStateTreeNode } from 'mobx-state-tree';
import { PageContext, WDMSubConext } from "../../constants/enums";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { Published } from "../../store/Gallery/Published"
import { publishedConfig } from "conf";
import FlippingBook from "../../components/Gallery/FlippingBook";

interface IGalleryItemOperationPopupProps {
    fb?: Facebook;
    twitter?: Twitter;
    wdmItem?: string;
    handleOpenPopupOperation?(): void;
    handleClosePopupOperation?(): void;
    galleryItem?: IGalleryItem;
    previewMediaType?: ViewMediaType,
    publishStatus: string;
    fbDataHref: string;
    twitterUrlWithText: string;
    fbArtistDataHref: string;
    twitterArtistUrlWithText: string;
    memberOwner: boolean;
    employee: boolean;
    infoDialog: InfoDialog;
    pageContext: PageContext;
    wdmSubConext: WDMSubConext;
    imgContent: string[];
    gallery?: IGallery;
    member: IMember;
    memberExternal?: IMember;
    onDelete?(item:IGalleryItem, parent: any): void;
    onMove?(): void;
    onDublicate?(): void;
    onEdit?(): void;
    onAddToCart?(): void;
    onPublish?(parent:any): void;
    ratingValue: number;
    wdmRatingValue: number;
    onChangeRating?(parent: any, ratingValue: number, wdmRatingValue: number, publishedDesign: IPublishedDesign): void;
    onChangeInfoDialog?(parent: any, infoDialog: InfoDialog): void;
    wdmRating: IRating;
    publishedDesign: IPublishedDesign;
    parent: any; 
    anonymousRole: boolean;
    localize?: ILocalizeActions;
    galleryItemOperationModel?: GalleryItemOperationModel;
    tagItemList?: TagItemList;
    modalDialogManager?: ModalDialogManager;
    publishedAction?: Published;
    galleryModel?: IGalleryModel;
    mpDesignFolderHash?: string;
}

interface IGalleryItemOperationPopupState {
    visiblePopupOperationWindowClass: string;
    //clickOpenPopup: boolean;
    firstShowing: boolean;
    htmlTextEditor: string;
    keywords: TagItemList,
    publishingData: IPublishingData,
    ratingValueLoad: boolean,
    artistsRatingValueLoad: boolean,
    lblErrPrice: boolean;
    lblErrArtName: boolean;
    lblErrDesc: boolean;
    editArtnameState: boolean;
    editCostState: boolean;
    wdmItemLogList: IWdmItemLog[];
    //errPublishBlockOperationTitle: boolean;
    observerId?: string[];
    disabledPublishBlock: boolean;
    artNameOld: string;
    artNameEditing: boolean;
}


@inject("fb", "twitter", "localize", "galleryItemOperationModel", "tagItemList", "modalDialogManager", "publishedAction", 'galleryModel')
@observer
export class GalleryItemOperationPopup extends React.Component<IGalleryItemOperationPopupProps, IGalleryItemOperationPopupState> {

    constructor(props: any) {
        super(props);

        this.state = {
            visiblePopupOperationWindowClass: "gallery-item-popup-window-show",
            //clickOpenPopup: false,
            firstShowing: false,
            htmlTextEditor: "",
            keywords: TagItemList.create({ items: [] }),
            publishingData: (PublishingData.create() as any as IPublishingData),
            ratingValueLoad: false,
            artistsRatingValueLoad: false,
            lblErrPrice: false,
            lblErrArtName: false,
            lblErrDesc: false,
            editArtnameState: false,
            editCostState: false,
            wdmItemLogList: [],
            //errPublishBlockOperationTitle: false
            observerId: [],
            disabledPublishBlock: false,
            artNameOld: "",
            artNameEditing: false,
        };
    }

    private searchKeywords: ISearchItem[] = [];
    private showPopupOperation: boolean = false;
    private artName: string = "";
    //private artNameOld: string = "";
    private priceVal: number = 0;
    private priceOldVal: number = 0;
    private htmlTextEditorOld: string = "";
    private publishedVal: boolean = false;
    private ratingValue: number = 0;
    private wdmRatingValue: number = 0;
    private wdmRating: IRating = (RatingType.create() as any as IRating);
    private rateEvent: boolean = false;
    private artistRatingValue: number = 0;
    private artistWdmRatingValue: number = 0;
    private artistWdmRating: IRating = (RatingType.create() as any as IRating);
    private ratingType: RatingType = RatingType.create();
    private ratingActions = (this.ratingType as any as IRatingActions);
    private wdmMember: IWdmMember = (WdmMember.create() as any as IWdmMember); 
    private loadedSocial: boolean = false;
    private costInput: any;
    private artNameInput: any;
    private cancelableSetwdmItemLogList: any;
    private _isMounted: boolean = false;

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {

        if (this.props.wdmItem && this.props.wdmItem !== "") {
            this.publishedVal = true;
            this.ratingValue = this.props.ratingValue;
            this.wdmRatingValue = this.props.wdmRatingValue;
            this.wdmRating = this.props.wdmRating;
            this.initArtistRating();

            const wdmItemLogList: IWdmItemLogList = (WdmItemLogList.create() as any as IWdmItemLogList);
            const action = (wdmItemLogList as any as IWdmItemLogListActions);
            let self = this;
            action.getPublishedLogs(this.props.wdmItem).then((logs) => {
                if (self._isMounted)
                    self.setState({ wdmItemLogList: wdmItemLogList.items });
            });
        } 
       
        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);
        this.artName = infoDialogParams.artName;
        this.priceVal = infoDialogParams.cost;
        //load keywords
        infoDialogParams.keywords.map((keyword) => {
            (this.state.keywords as any as ITagItemDesignListActions).addTagItem(keyword);
        });
        
        this.initSearchKeywords();
        
        let publishingDataVal = PublishingData.create({
            wdmItem: this.props.wdmItem,
            itemName: infoDialogParams.artName,
            memberKey: this.props.member.memberKey,
            description: infoDialogParams.artDescription,
            price: infoDialogParams.cost,
            sizeDimension: infoDialogParams.sizeDimension,
            storagePath: infoDialogParams.folderName,
            prodType: (this.props.gallery) ? this.props.gallery.type : "",
            //category: this.publishedVal ? infoDialogParams.wdmCategoryId : (this.props.gallery) ? this.props.gallery.type : "",
            category: this.props.galleryItem!.type,
            subCategory: this.publishedVal ? infoDialogParams.wdmSubCategoryId : ""
        }) as any;

        let kw: string[] = [];
        infoDialogParams.keywords.map((keyword) => {
            kw.push(keyword);
        });
        (publishingDataVal as any as IPublishingActions).setKeywords(kw);

        this.setState({ publishingData: publishingDataVal, htmlTextEditor: infoDialogParams.artDescription });

        setTimeout(() => {
            this.reloadSocialComponent();
        }, 100);
    }

    componentDidMount() {
        this._isMounted = true;

        // subscribe to events
        let observerId = storeActionObserver.registerStoreAction(this.props.galleryItemOperationModel, "setTagPromise",
            (storeArgs: any, designSpec: any) => {
                if ((galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise) {
                    (galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise!.then(() => {
                        this.initSearchKeywords();
                        //if (this._isMounted)
                        //    this.forceUpdate();
                    });
                }
            });
        this.setState({ observerId: this.state.observerId!.concat(observerId) });

        // GalleryBox - click on a subpanel
        observerId = storeActionObserver.registerStoreAction(this.props.publishedAction, "getPublishedItemsByCategory",
            (storeArgs: any, designSpec: any) => {
                if (this.props.galleryItemOperationModel && !this.props.galleryItemOperationModel.ignoreCloseEventHandler)
                    this.openPopupOperationHandler(undefined, false);
            });
        this.setState({ observerId: this.state.observerId!.concat(observerId) });

        observerId = storeActionObserver.registerStoreAction(this.props.publishedAction, "emptyEvent",
            (storeArgs: any, designSpec: any) => {
                if (this.props.galleryItemOperationModel && !this.props.galleryItemOperationModel.ignoreCloseEventHandler)
                    this.openPopupOperationHandler(undefined, false);
            });

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    public componentWillReceiveProps(nextProps: any) {
        if (nextProps.wdmItem && nextProps.wdmItem !== "") {
            this.publishedVal = true;
            if (!this.rateEvent) {
                this.ratingValue = this.ratingValue !== nextProps.ratingValue ? nextProps.ratingValue : this.ratingValue;
            }
            this.rateEvent = false;
            this.wdmRatingValue = this.wdmRatingValue !== nextProps.wdmRatingValue ? nextProps.wdmRatingValue : this.wdmRatingValue;
            this.wdmRating = this.props.wdmRating;

            //console.log("componentWillReceiveProps:", nextProps.infoDialog, this.props.infoDialog);
            //const infoDialogParams = (nextProps.infoDialog as any as IInfoDialog);
            //this.artName = infoDialogParams.artName;
            //this.priceVal = infoDialogParams.cost;
        }
    }

    private focusCost() {
        setTimeout(() => {
            this.costInput.focus();
        }, 500);
    }

    private focusArtName() {
        setTimeout(() => {
            this.artNameInput.focus();
        }, 500);
    }

    private reloadSocialComponent() {
        if (this.props.twitter && this.props.fb && this.props.fb.loaded) {
            this.props.twitter.load();
            this.props.fb.refresh();
        }
    }

    private initArtistRating() {
        let self = this;

        (this.wdmMember as any as IWdmMemberActions)
            .loadByMember(self.props.member!.memberKey)
            .then((wdmMember) => {
                this.artistWdmRatingValue = wdmMember.memberRating;
            });

        if (self.props.memberExternal)
            this.ratingActions
                .getRating(self.props.memberExternal!.memberKey.toString(), self.props.member!.memberKey.toString())
                .then((artistRatingObj) => {
                    // 1. check that has rating object in table (mb first time)
                    if (artistRatingObj.raterMemberOrUniqId === "") {
                        // 1.2 if doesn't has create rating object
                        (artistRatingObj as any as IRatingActions).setRatingValues(
                            self.props.member!.memberKey.toString(),
                            self.props.memberExternal!.memberKey.toString(),
                            0,
                            "Member",
                            "No");

                        if (!this.props.employee && !this.props.memberOwner) {
                            this.ratingActions.save(artistRatingObj).then((saved) => {
                                if (saved < 0) {
                                    console.log(this.translate('galleryItemOperationPop.errorSaveMemberRating').toString());
                                }
                            });
                        }
                    }

                    self.artistRatingValue = artistRatingObj.rating;
                    self.artistWdmRating = artistRatingObj;
                });
    }

    private anchorTextEditorChangeHandler(html: string) {
        this.setState({ htmlTextEditor: html });
        (this.props.infoDialog as any as IInfoDialogActions).setArtDescription(html);
        (this.state.publishingData as any as IPublishingActions).setArtDescription(html);
    }

    private openPopupOperationHandler(e?: React.MouseEvent, isOpen: boolean = true) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        //this.setState({ clickOpenPopup: isOpen });
        this.showPopupOperation = isOpen;

        if(isAlive(this.props.galleryItem as any as IStateTreeNode))
            (galleryItemOperationModel as any as IGalleryItemOperationModelActions).setOpeningHash(this.props.galleryItem!.hash!);

        //const eventHandler = (galleryItemOperationModel as any as IGalleryItemOperationModel).eventHandler;
        //if (eventHandler && eventHandler === "publish") {
        //    console.log("po event handler publish");
        //    if ((galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise) {
        //        (galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise!.then(() => {
        //            this.initSearchKeywords();
        //        });
        //    }
        //}

        setTimeout(() => {
            this.reloadSocialComponent();
        }, 100);

        if (isOpen && this.props.handleOpenPopupOperation)
            this.props.handleOpenPopupOperation();

        if (this.props.handleClosePopupOperation)
            if (!isOpen)
                this.props.handleClosePopupOperation();

        if (this._isMounted) {
            this.forceUpdate();
        }
    }

    handleOverCloseIcon = () => {

        //if (!this.state.firstShowing) {
        //    this.setState({ firstShowing: true });

        //    setTimeout(() => {
        //        this.handleOverCloseIcon();
        //    }, 1000);

        //    return;
        //}

        //this.setState({ showPopupOperation: true });
    };

    handleLeaveCloseIcon = () => {
       // this.setState({ showPopupOperation: this.state.clickOpenPopup ? true : false });
    };

    private renderTriggerElement() {

        if (!isAlive(this.props.galleryItem as any as IStateTreeNode)) return "";

        return !this.props.galleryItem!.isInMyCloud 
            ? <Icon className="gic icon-YP2_align"
                     onClick={(e: any) => this.openPopupOperationHandler(e)}
                     onMouseLeave={(e: any) => this.handleLeaveCloseIcon()}
                onMouseOver={(e: any) => this.handleOverCloseIcon()} />
            : <div></div>;
    }

    private anchorArtNameChangeHandler(data: InputOnChangeData) {
        if (data.value === "") {
            this.setState({ lblErrArtName: true });
            return;
        }
        console.log("anchorArtNameChangeHandler:", data.value, this.state.artNameOld);
        this.artName = data.value;
        (this.state.publishingData as any as IPublishingActions).setArtName(data.value);

        this.setState({
            publishingData: this.state.publishingData,
            lblErrArtName: false
        });
    }

    private anchorLabelClickHandler(data: object, value: string) {
        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);
        if (this.props.memberOwner && infoDialogParams.publishStatus !== "Requested") {
            (this.state.keywords as any as ITagItemDesignListActions).removeItem(value);

            this.changingKeyword();
        }
    }
    
    private onPutTagToTagsWindow = (value?: string) => {
        if (value) {
            (this.state.keywords as any as ITagItemDesignListActions).addTagItem(value);
            this.changingKeyword();
        }
    };

    private changingKeyword() {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        let changedKeywords: string[] = [];
        (this.state.keywords as any as ITagItemList).items.map((item) => {
            changedKeywords.push((item as any as ITagItem).text);
        });

        (this.props.infoDialog as any as IInfoDialogActions).setKeywords(changedKeywords);
        (this.state.publishingData as any as IPublishingActions).setKeywords(changedKeywords);
        
        // update KWs
        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);

        const canEdit = this.getEditability();
        if (canEdit) {
            //update wdm_membr
            let self = this;
            const action = (this.props.publishedDesign as any as IPublishedDesignActions);
            action.changePublished(this.priceVal, this.artName, this.state.htmlTextEditor, this.state.publishingData.keywords.join());
            action.updateWdmItem(this.props.publishedDesign)
                .then((result: any) => {
                    if (!result.success) {
                        // show error label and set error input
                        if (self._isMounted)
                            self.setState({ lblErrArtName: true });

                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            translate(result.errMsg));
                    } 
                }).catch((error: any) => {
                    // show error label and set error input
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                    Promise.reject(error);
                });
        }
    }

    private initSearchKeywords() {
        try {
            let til = (this.props.tagItemList as any as ITagItemList);
            if (til.isLoaded) {
                this.searchKeywords.splice(0, til.items.length);
                til.items.map(item => (
                    this.searchKeywords.push({
                        key: (item as any as ITagItem).key,
                        title: (item as any as ITagItem).text,
                        data: item
                    })
                ));
            } else {
                console.log('error: not loaded tags');
            }
        }
        catch (error) {
            console.log("error initSearchKeywords: ", error);
        }
    }
    
    private anchorPriceChangeHandler(data: InputOnChangeData) {
        if (data.value === "") {
            this.priceVal = 0;
        } else {
            this.priceVal = parseInt(data.value);
            if (isNaN(this.priceVal))
                this.priceVal = 0;
        }
        
        (this.props.infoDialog as any as IInfoDialogActions).setCost(this.priceVal);
        (this.state.publishingData as any as IPublishingActions).setCost(this.priceVal);

        this.setState({
            publishingData: this.state.publishingData,
        });
    }

    public handleHidePopupOperation(self: GalleryItemOperationPopup): void {
        if (self._isMounted)
            self.setState({ visiblePopupOperationWindowClass: "gallery-item-popup-window-hide" });
    }

    public handleShowPopupOperation(self: GalleryItemOperationPopup): void {
        if (self._isMounted)
            self.setState({ visiblePopupOperationWindowClass: "gallery-item-popup-window-show" });
    }

    public onPublishingDataChanged(self: GalleryItemOperationPopup, publishingData: IPublishingData) {

        // update keywords
        let changedKeywords: string[] = [];
        publishingData.keywords.map((kw) => {
            if (kw) {
                (self.state.keywords as any as ITagItemDesignListActions).addTagItem(kw);

                changedKeywords.push(kw);
            }
        });
        (self.props.infoDialog as any as IInfoDialogActions).setKeywords(changedKeywords);

        // description
        (self.props.infoDialog as any as IInfoDialogActions).setArtDescription(publishingData.description);
        self.setState({ htmlTextEditor: publishingData.description });
    }

    public onClose(self: GalleryItemOperationPopup) {

        self.showPopupOperation = false;
        if(self._isMounted)
            self.forceUpdate();
        
        if (self.props.handleClosePopupOperation)
            self.props.handleClosePopupOperation();
    }

    private onRate(event: React.MouseEvent<HTMLDivElement>, data: RatingProps) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        this.setState({ ratingValueLoad: true });
        this.ratingValue = (data!.rating as number);
        this.rateEvent = true;
        // first calling to change rating value only
        this.props.onChangeRating!(this.props.parent,
            this.ratingValue,
            this.wdmRatingValue,
            this.props.publishedDesign);
        
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
                    console.log(this.translate('galleryItemOperationPop.errorUpdateRating').toString());
                    return;
                }
                //todo: calculation of rating on the client side -for a quick presentation
                (self.props.publishedDesign as any as IPublishedDesignActions)
                    .updateWdmItem(self.props.publishedDesign)
                    .then((result: any) => {
                        if (!result.success) {
                            if (self._isMounted)
                                self.setState({ ratingValueLoad: false });

                            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                                translate(result.errMsg));
                        } else {
                            (self.props.publishedDesign as any as IPublishedDesignActions)
                                .setPublished(self.props.wdmItem!)
                                .then((publishedItem) => {
                                    self.wdmRatingValue = publishedItem.wdmRating;

                                    if (self._isMounted)
                                        self.setState({ ratingValueLoad: false });
                                    // second calling to change wdmRating and publishedDesign
                                    self.props.onChangeRating!(self.props.parent,
                                        self.ratingValue,
                                        self.wdmRatingValue,
                                        self.props.publishedDesign);
                                });
                        }
                    }).catch((error: any) => {
                        // show error label and set error input
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", error));
                        Promise.reject(error);
                    });
            });
    }

    private renderArtistRating() {
        let artistRatingValueElement = this.state.artistsRatingValueLoad
            ? <Loader size="mini" active/>
            : `(${this.artistWdmRatingValue.toFixed(2)})`;

        return <div>
                   <Grid>
                       <Grid.Row>
                           <Grid.Column width={7} className="gallery-item-popup-artist-rating-clmn">
                               <Rating icon='star'
                                       rating={this.artistRatingValue}
                                       maxRating={5}
                                       size="large"
                                       onRate={(event: React.MouseEvent<HTMLDivElement>, data: RatingProps) =>
                                                this.onArtistRate(event, data)}
                                       disabled={this.props.memberOwner || this.props.employee
                                           || this.props.anonymousRole} />
                           </Grid.Column>
                           <Grid.Column width={8} className="gallery-item-popup-rating-val-clmn">
                                {artistRatingValueElement}
                           </Grid.Column>
                       </Grid.Row>
                   </Grid>
               </div>;
    }

    private onArtistRate(event: React.MouseEvent<HTMLDivElement>, data: RatingProps) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        this.setState({ artistsRatingValueLoad: true });
        this.artistRatingValue = (data!.rating as number);

        (this.artistWdmRating as any as IRatingActions)
            .setRatingValues(this.artistWdmRating.wdmItemIdOrMember,
                this.artistWdmRating.raterMemberOrUniqId,
                this.artistRatingValue,
                this.artistWdmRating.rateAgainst,
                this.artistWdmRating.raterIsMemberFlg);

        let self = this;
        this.ratingActions.updateRating(this.artistWdmRating)
            .then((result) => {
                if (!result) {
                    console.log(this.translate('galleryItemOperationPop.errorUpdateRating').toString());
                    return;
                }
                //todo: calculation of rating on the client side -for a quick presentation
               
                (self.wdmMember as any as IWdmMemberActions)
                    .updateWdmMember(self.wdmMember)
                    .then((updated: any) => {
                        if (!updated.success) {

                            if (self._isMounted)
                                self.setState({ artistsRatingValueLoad: false });

                            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                                translate(updated.errMsg));
                        }
                        else {
                            (self.wdmMember as any as IWdmMemberActions)
                                .loadByMember(parseInt(this.artistWdmRating.wdmItemIdOrMember))
                                .then((wdmMember) => {
                                    self.artistWdmRatingValue = wdmMember.memberRating;
                                    if (self._isMounted)
                                        self.setState({ artistsRatingValueLoad: false });
                                });
                        }
                    }).catch((error: any) => {
                        // show error label and set error input
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", error));
                        Promise.reject(error);
                    });
            });
    }

    private renderArtRating() {

        let ratingValueElement = this.state.ratingValueLoad
            ? <Loader size="mini" active />
            : `(${this.wdmRatingValue.toFixed(2)})`;

        return <div>
                   <Grid>
                       <Grid.Row>
                           <Grid.Column width={6}>
                               <Rating icon='star'
                                       rating={this.ratingValue}
                                       maxRating={5}
                                       onRate={(event: React.MouseEvent<HTMLDivElement>,
                                               data: RatingProps) =>
                                           this.onRate(event, data)}
                                       size="huge"
                                       disabled={this.props.memberOwner || this.props.employee || this.props.anonymousRole }/>
                           </Grid.Column>
                           <Grid.Column width={8} className="gallery-item-popup-rating-val-clmn">
                               {ratingValueElement}
                           </Grid.Column>
                       </Grid.Row>
                   </Grid>
               </div>;
    }

    private renderArtSocial() {
        return <div>
                   <Grid>
                       <Grid.Row>
                           <Grid.Column width={4}>
                               <div className="fb-like" data-href={this.props.fbDataHref}
                                    data-layout="button_count" data-action="like" data-size="small" data-show-faces="false" data-share="false"></div>
                           </Grid.Column>
                           <Grid.Column width={6} className="gallery-item-popup-share-icon">
                               <GalleryItemSharePopup fbDataHref={this.props.fbDataHref}
                                                      twitterUrlWithText={this.props.twitterUrlWithText}
                                                      handleShowPopupOperation={this.handleShowPopupOperation}
                                                      handleHidePopupOperation={this.handleHidePopupOperation}
                                                      operationPopup={this}/>
                           </Grid.Column>
                       </Grid.Row>
                   </Grid>
               </div>;
    }

    private renderArtistSocial() {
        return <div>
                   <Grid>
                       <Grid.Row>
                           <Grid.Column width={9}>
                               <div className="fb-like" data-href={this.props.fbArtistDataHref}
                                    data-layout="button_count" data-action="like" data-size="small" data-show-faces="false" data-share="true"></div>
                           </Grid.Column>
                           <Grid.Column width={6}>
                               <a className="twitter-share-button"
                                  href={this.props.twitterArtistUrlWithText}>
                                   Tweet</a>
                           </Grid.Column>
                       </Grid.Row>
                   </Grid>
               </div>;
    }

    private renderEditDescrition(canEdit: boolean) {
        return <div>
            <Popup
                position={"bottom left"} on="click"
                trigger={<Icon color="grey" name="edit" size="large" />}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={16}>
                            <TextEditor name="a"
                                        initHtmlText={this.state.htmlTextEditor}
                                        readOnly={!canEdit}
                                        onChange={(html: string) => this.anchorTextEditorChangeHandler(html)}
                                        onBlur={(event: any) => this.onFocusoutDescription(event, canEdit)}
                                        onFocus={(event: any) => this.onFocusDescription(event)}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Popup>
        </div>;
    }

    private renderKeywordSearch() {
        return <div>
                   <Popup
                       position={"bottom left"} on="click"
                       trigger={<Icon color="grey" name="edit" size="large" />}>
                        <Grid className="keywords">
                           <Grid.Row>
                               <Grid.Column width={16}>
                                   <SearchBox source={this.searchKeywords}
                                              onEnterKeyPress={this.onPutTagToTagsWindow}
                                              onResultSelect={this.onPutTagToTagsWindow}
                                              placeholder={this.translate('galleryItemOperationPop.placeHolderKeyword').toString()}/>
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row className="output">
                               <Grid.Column width={16}>
                                   <Segment className="keywords po">
                                       {(this.state.keywords as any as ITagItemList).items.map(
                                           item => (
                                               <Label
                                                   key={(item as any as ITagItem).key}
                                                   value={(item as any as ITagItem).text}
                                                   className="wdm-tag"
                                                   onClick={
                                                       (event: React.SyntheticEvent<HTMLElement>, data: object) =>
                                                           this.anchorLabelClickHandler(data,
                                                                (item as any as ITagItem).text)}>
                                                   <List horizontal>
                                                       <List.Item>
                                                           <div className="text">{(item as any as ITagItem).key}</div>
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
                                           {this.translate('publishing.taggingCountTitle').toString()}
                                       </List.Item>
                                       <List.Item>
                                           {(this.state.keywords as any as ITagItemList).items.length}
                                       </List.Item>
                                   </List>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Popup>
               </div>;
    }

    private onFocusoutPrice(canEdit: boolean) {
        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        if (canEdit && this.priceOldVal !== this.priceVal
            && (this.props.infoDialog as any as IInfoDialog).publishStatus !== GalleryItemStatusType.None) {
            //update wdm_membr
            let self = this;
            const action = (this.props.publishedDesign as any as IPublishedDesignActions);
            action.changePublished(this.priceVal, this.artName, this.state.htmlTextEditor);
            action.updateWdmItem(this.props.publishedDesign)
                .then((result: any) => {
                    if (!result.success) {
                        // show error label and set error input
                        if (self._isMounted)
                            self.setState({ lblErrArtName: false, lblErrPrice: true });
                        // revert values back
                        action.changePublished(self.priceOldVal, self.artName, self.state.htmlTextEditor);
                        self.priceVal = self.priceOldVal;

                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate(result.errMsg).toString());
                    }
                }).catch((error: any) => {
                    // show error label and set error input
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                    Promise.reject(error);
                });
        }

        this.setState({ editCostState: false });
    }

    private onFocusPrice() {
        this.priceOldVal = this.priceVal;
        this.setState({ lblErrPrice: false });
    }

    private onFocusoutArtName(canEdit: boolean) {
        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;


        if (canEdit && this.state.artNameOld !== this.artName) {
            const action = (this.props.publishedDesign as any as IPublishedDesignActions);
            //update wdm_membr
            let self = this;

            //check that not have the same name in category
            var currModel = this.props.gallery && this.props.galleryModel &&
                            this.props.galleryModel.galleries
                                    .find((model) => model.name === this.props.gallery.name);
            if (currModel) {
                if (this.props.pageContext === PageContext.WDM) {

                    let hasSameItemName = false;
                    currModel.items.filter((item) => item.name !== publishedConfig.AutoPublish.FolderName ||
                        item.name !== "__AutoSave" || item.name !== "AutoSave").forEach((item) => {
                        if(item.children)
                            item.children.forEach((child) => {
                                if (child.name === this.artName) {
                                    hasSameItemName = true;
                                }
                            });
                        });

                    if (hasSameItemName) {
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate("Error.GalleryItemOperation.Rename.NameAlreadyExists").toString());

                        self.artName = self.state.artNameOld;
                        if (self._isMounted)
                            self.setState({ lblErrArtName: true, artNameEditing: false });
                        // revert values back
                        action.changePublished(self.priceVal, self.state.artNameOld, self.htmlTextEditorOld);
                        return;
                    }
                }
            } else {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    self.translate("Error.GalleryItemOperation.Rename.NameAlreadyExists").toString());

                self.artName = self.state.artNameOld;
                if (self._isMounted)
                    self.setState({ lblErrArtName: true, artNameEditing: false });
                // revert values back
                action.changePublished(self.priceVal, self.state.artNameOld, self.htmlTextEditorOld);
                return;
            }

            if (self._isMounted)
                this.setState({ artNameEditing: true });
            
            action.changePublished(this.priceVal, this.artName, this.state.htmlTextEditor);
            action.setStoragePath(this.state.publishingData.storagePath);
            action.updateWdmItem(this.props.publishedDesign)
                .then((result: any) => {
                    if (!result.success) {
                        // show error label and set error input
                        self.artName = self.state.artNameOld;
                        if (self._isMounted)
                            self.setState({ lblErrArtName: true, artNameEditing: false });
                        // revert values back
                        action.changePublished(self.priceVal, self.state.artNameOld, self.htmlTextEditorOld);

                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate(result.errMsg).toString());
                       
                    } else {

                        if (self._isMounted)
                            this.setState({ artNameEditing: false });

                        (self.props.infoDialog as any as IInfoDialogActions).setArtName(self.artName);
                        if (self.props.onChangeInfoDialog)
                            self.props.onChangeInfoDialog(self.props.parent, self.props.infoDialog);
                    }
                }).catch((error: any) => {

                    if (self._isMounted)
                        this.setState({ artNameEditing: false });

                    // show error label and set error input
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                    Promise.reject(error);
                });
        }

        this.setState({ editArtnameState: false });
    }

    private onFocusArtName() {
        console.log("onfocuse:", this.state.artNameOld, this.artName);
        //this.artNameOld = this.artName;
        this.setState({ lblErrArtName: false, lblErrPrice: false, artNameOld: this.artName });
    }

    onArtNameItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.keyCode === 13 && this.artNameInput) this.onFocusoutArtName(true);

        //cancel renaming
        if (e.keyCode === 27 && this.artNameInput) {
            const action = (this.props.publishedDesign as any as IPublishedDesignActions);
            action.changePublished(this.priceVal, this.state.artNameOld, this.htmlTextEditorOld);

            this.artName = this.state.artNameOld;
            if (this._isMounted)
                this.setState({ artNameEditing: false, editArtnameState: false });
        }
    }

    private onFocusoutDescription(event: any, canEdit: boolean) {

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        if (canEdit && this.htmlTextEditorOld !== this.state.htmlTextEditor) {
            //update wdm_membr
            let self = this;
            const action = (this.props.publishedDesign as any as IPublishedDesignActions);
            action.changePublished(this.priceVal, this.artName, this.state.htmlTextEditor);
            action.updateWdmItem(this.props.publishedDesign)
                .then((result: any) => {
                    if (!result.success) {
                        if (self._isMounted)
                            self.setState({ lblErrDesc: true, htmlTextEditor: self.htmlTextEditorOld });
                        // revert values back
                        action.changePublished(self.priceVal, self.artName, self.htmlTextEditorOld);

                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                            self.translate(result.errMsg).toString());
                    }
                }).catch((error: any) => {
                    // show error label and set error input
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error));
                    Promise.reject(error);
                });
        }
    }

    private onFocusDescription(event: any) {
        this.htmlTextEditorOld = this.state.htmlTextEditor;
        this.setState({ lblErrDesc: false });
    }

    private getEditability() {

        // todo: it is stupid. 
        // All condition should be able editable in config json file.
        // But now we have what we can have! 
        // Because we not have time to impelement a better logic!

        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);
        

        if (!this.props.memberOwner) return false;

        if (this.props.pageContext !== PageContext.WDM) return false;

        // noodle code
        if (infoDialogParams.publishStatus === GalleryItemStatusType.None ||
            infoDialogParams.publishStatus === GalleryItemStatusType.Published ) {

            return (this.props.wdmSubConext === WDMSubConext.MyPublish ||
                this.props.wdmSubConext === WDMSubConext.MyCloud);

        } else
            return false;
    }

    private onClickEditArtName() {
        this.setState({ editArtnameState: true });
        this.focusArtName();
    }

    private onClickEditCost() {
        this.setState({ editCostState: true });
        this.focusCost();
    }

    private renderWdmItemLogList() {
        return <List>
                   {this.state.wdmItemLogList.map(logItem => (
                       <List.Item key={(logItem as any as IWdmItemLog).wdmItemLogKey}>
                           <Grid>
                               <Grid.Row name="row popular" className="gallery-item-wdm-4">
                                   <Grid.Column width={5}>
                                       <div>
                                           {this.getFormateDate((logItem as any as IWdmItemLog).logYyyymmdd)}
                                       </div>
                                   </Grid.Column>
                                   <Grid.Column width={11} className="gallery-item-popup-log-item-clmn">
                                        <div>
                                            {(logItem as any as IWdmItemLog).logText}
                                        </div>
                                   </Grid.Column>
                               </Grid.Row>
                           </Grid>
                       </List.Item>
                   ))}
               </List>;
    }

    private getFormateDate(dateString: string) {
        return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
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

    private onPublish(self: any) {
        if (self.props.onPublish)
            self.props.onPublish(self.props.parent);
    }

    private onDelete(item: IGalleryItem, disabled?: boolean, parent?: any) {
        if (parent.props.onDelete && item) {
            if (parent && parent._isMounted)
                parent.setState({ disabledPublishBlock: false });

            parent.props.onDelete(item, parent.props.parent);
        }
        else if (parent.props.onDelete && !item) {
            // MyCloud block call method to disable publishing block, while deleting item - call without galleryitem value
            if (parent && parent._isMounted)
                parent.setState({ disabledPublishBlock: disabled });
        }
    }

    private onMove(ignore: boolean, parent?: any) {
        if (parent && parent.props.onMove)
            parent.props.onMove();
    }

    private onClickFlippingBook(event: any) {
        //if (this.props.onClickFlippingBook) {
        //    this.props.onClickFlippingBook(event, this.props.galleryItem.hash);
        //}
    }

    public render() {
        const { translate, trn, translateTemplate } = this.props.localize!;

        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);
        let publishingDataVal = this.state.publishingData;
        const canEdit = this.getEditability();

        const reasonTitle = infoDialogParams.publishStatus === GalleryItemStatusType.Rejected
            ? this.translate('galleryItemOperationPop.rejectionReasonTitle').toString() 
            : infoDialogParams.publishStatus === GalleryItemStatusType.Revoked
                ? this.translate('galleryItemOperationPop.revocationReasonTitle').toString()
            : "";
        const reasonVal = reasonTitle === "" ? "" : infoDialogParams.reason;

        // to close this popup when opening other popup
        const openingHash = (galleryItemOperationModel as any as IGalleryItemOperationModel).openingHash;
        if (!isAlive(this.props.galleryItem as any as IStateTreeNode)
            || openingHash !== this.props.galleryItem!.hash) {
            this.showPopupOperation = false;
        }
        
        return <div onClick={(e: any) => this.onClickMainDiv(e)}>
               <Popup
                   className={this.state.visiblePopupOperationWindowClass}
                   trigger={this.renderTriggerElement()}
                   open={this.showPopupOperation}
                   position={"right center"}>
                <Grid className="gallery-item-popup-main gic po">
                    {this.props.memberOwner
                        ? <Grid.Row className="gallery-item-popup-top">
                              <Grid.Column width={16} className="gallery-item-popup-no-padding">
                                <GalleryItemMyCloudBlock wdmItem={this.props.wdmItem}
                                    galleryItem={this.props.galleryItem}
                                    memberOwner={this.props.memberOwner}
                                    employee={this.props.employee}
                                    infoDialog={this.props.infoDialog}
                                    pageContext={this.props.pageContext}
                                    wdmSubConext={this.props.wdmSubConext}
                                    onDelete={this.onDelete}
                                    onMove={this.onMove}
                                    onDublicate={this.props.onDublicate}
                                    onEdit={this.props.onEdit}
                                    onAddToCart={this.props.onAddToCart}
                                    parent={this}
                                    gallery={this.props.gallery}
                                    publishedDesign={this.props.publishedDesign}/>
                              </Grid.Column>
                            </Grid.Row>
                        : <div></div>}
                    <Grid.Row className="gallery-item-popup-bottom">
                        <Grid.Column width={10} name="left side" className="gallery-item-popup-left-side-column">
                            <Grid divided centered columns={2}>
                                <Grid.Row>
                                    <Grid.Column width={16}>
                                        <div className="gic po img-container">
                                            <Grid className="grid-img">
                                                <Grid.Row className="row-img">
                                                    {this.props.galleryItem && this.props.galleryItem.isMultiPage
                                                        ? <FlippingBook designFolderHash={this.props.mpDesignFolderHash} bookSize={"Med"}
                                                            onClickHandler={(event: any) => this.onClickFlippingBook(event)} />
                                                        : this.props.imgContent.map((img, index) => {
                                                                return <Grid.Column key={index}
                                                                className="clmn-img"
                                                                width={Math.round(16 / this.props.imgContent.length) as any}>
                                                                   <Image src={img} className="img-centered" />
                                                                </Grid.Column>;
                                                        })}
                                                </Grid.Row>
                                            </Grid>
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row className="gallery-item-popup-row-description">
                                    <Grid.Column width={16}>
                                        <List horizontal>
                                            <List.Item>
                                                <div className="gallery-item-wdm-5"> {this.translate('galleryItemOperationPop.descriptionTitle').toString()}</div>
                                            </List.Item>
                                            <List.Item>
                                                {(canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                    (this.props.wdmSubConext === WDMSubConext.MyUnPublish || this.props.wdmSubConext === WDMSubConext.MyCloud) ))
                                                    ? this.renderEditDescrition(canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                        (this.props.wdmSubConext === WDMSubConext.MyUnPublish || this.props.wdmSubConext === WDMSubConext.MyCloud)))
                                                    : (this.props.wdmItem && this.props.wdmItem !== "")
                                                        ? <div></div>
                                                        : <Icon className="icon-YP2_edit gallery-item-wdm-3" size="large" />}
                                                {this.state.lblErrDesc ? <Label color='red' floating className="desc">{translate("Error.GalleryItemOperation.ErrorDescriptionBox")}</Label>
                                                    : <div></div>}
                                            </List.Item>
                                        </List>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row className="gallery-item-popup-row-description">
                                    <Grid.Column width={16}>
                                        <div className="gallery-item-popup-row-description-text">
                                            <div dangerouslySetInnerHTML={{ __html: sanitize(this.state.htmlTextEditor) }} />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row className="gallery-item-popup-row-keywords">
                                    <Grid.Column width={16}>
                                        <List horizontal>
                                            <List.Item>
                                                <Icon className="icon-YP2_tag gallery-item-wdm-3" size="large" />
                                            </List.Item>
                                            <List.Item>
                                                <div className="gallery-item-wdm-5">{this.translate('galleryItemOperationPop.keywordTitle').toString()}</div>
                                            </List.Item>
                                            <List.Item>
                                                {canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                    this.props.wdmSubConext === WDMSubConext.MyCloud)
                                                    ? this.renderKeywordSearch()
                                                    : (this.props.wdmItem && this.props.wdmItem !== "")
                                                        ? <div></div>
                                                        : <Icon className='icon-YP2_edit gallery-item-wdm-5' size="large" />}
                                            </List.Item>
                                        </List>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row className="gallery-item-popup-row-kws">
                                    <Grid.Column width={16}>
                                        <TextArea readOnly value={(this.state.keywords as any as ITagItemListActions).getTagItemJoin()}
                                            rows="6" className="gallery-item-popup-kws-textarea" />	
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Grid.Column>

                        <Grid.Column name="right side" width={6}>
                            <Grid className="right-side">
                                <Grid.Row className="first-area">
                                    <Grid.Column width={16}>
                                        <Grid>
                                            <Grid.Row className="info">
                                                <Grid.Column width={12}></Grid.Column>
                                                <Grid.Column width={1} className="gallery-item-popup-art-icon-clmn">
                                                    {(infoDialogParams.publishStatus === GalleryItemStatusType.Published)
                                                        ? <FBCommentPopup fbDataHref={this.props.fbDataHref} />
                                                        : <div></div>}
                                                </Grid.Column>
                                                <Grid.Column width={1} className="gallery-item-popup-art-icon-clmn">
                                                    <Popup position={"bottom left"}
                                                        trigger={<Icon className="gallery-item-wdm-3 icon-YP2_info" size="large" />}>
                                                        <Grid className="p-info wdm-style-6">
                                                            <Grid.Row className="title">
                                                                <Grid.Column width={5}>{this.translate('galleryItemOperationPop.lastModificationTitle').toString()}:</Grid.Column>
                                                                <Grid.Column width={11}>
                                                                    <div>{infoDialogParams.lastModification}</div>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row className="text">
                                                                <Grid.Column width={5}>{this.translate('galleryItemOperationPop.folderNameTitle').toString()}:</Grid.Column>
                                                                <Grid.Column width={11} className="text">
                                                                    <div>{infoDialogParams.folderName}</div>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    </Popup>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row className="art-name">
                                                <Grid.Column width={16}>
                                                    <List horizontal>
                                                        <List.Item className="title art-name">
                                                            {this.state.editArtnameState
                                                                ? <Input size="mini"
                                                                    placeholder={this.translate('galleryItemOperationPop.artNamePlaceHolder').toString()}
                                                                    defaultValue={this.artName}
                                                                    className="gallery-item-popup-art-name-input"
                                                                    loading={this.state.artNameEditing}
                                                                    error={this.state.lblErrArtName}
                                                                    onChange={(event: React.SyntheticEvent<HTMLElement>,
                                                                        data: InputOnChangeData) => this.anchorArtNameChangeHandler(data)}
                                                                    onBlur={(event: any) => this.onFocusoutArtName(canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                                        this.props.wdmSubConext === WDMSubConext.MyCloud))}
                                                                    onFocus={(event: any) => this.onFocusArtName()}
                                                                    onKeyDown={(e) => this.onArtNameItemKeyDown(e)}
                                                                    ref={(input: any) => { this.artNameInput = (input as any as Input) }} />
                                                                : this.state.artNameEditing
                                                                    ? <Loader size='mini' className="artname-loader"/>
                                                                    : this.artName}
                                                        </List.Item>
                                                        <List.Item className="icon">
                                                            {(canEdit
                                                                || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                                (this.props.wdmSubConext === WDMSubConext.MyUnPublish
                                                                || this.props.wdmSubConext === WDMSubConext.MyCloud)))
                                                                    && !this.state.editArtnameState && !this.state.artNameEditing
                                                                ? <Icon size="large"
                                                                  className="icon-YP2_edit gallery-item-wdm-3"
                                                                    onClick={(event: React.SyntheticEvent<HTMLElement>, data: object) => this.onClickEditArtName()} />
                                                                : <div></div>}
                                                        </List.Item>
                                                    </List>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row className="cost">
                                                <Grid.Column width={16}>
                                                    <List>
                                                        <List.Item>
                                                            <List horizontal>
                                                                <List.Item className="icon-backs">
                                                                    <Icon className="icon-YP1_price" />
                                                                </List.Item>
                                                                <List.Item className="title">
                                                                    {this.state.editCostState
                                                                        ? <Input className="gallery-item-popup-header-one-cost-input"
                                                                            size="mini"
                                                                            placeholder={this.translate('galleryItemOperationPop.costPlaceholder').toString()}
                                                                            error={this.state.lblErrPrice}
                                                                            value={this.priceVal}
                                                                            onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                                                                                this.anchorPriceChangeHandler(data)}
                                                                            onBlur={(event: any) => this.onFocusoutPrice(canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                                                this.props.wdmSubConext === WDMSubConext.MyCloud))}
                                                                            onFocus={(event: any) => this.onFocusPrice()}
                                                                            ref={(input: any) => { this.costInput = (input as any as Input) }} />
                                                                        : this.priceVal}
                                                                </List.Item>
                                                                <List.Item className="icon">
                                                                    {(canEdit || (infoDialogParams.publishStatus === GalleryItemStatusType.Unpublished &&
                                                                        this.props.wdmSubConext === WDMSubConext.MyCloud)) && !this.state.editCostState
                                                                        ? <Icon size="large"
                                                                            className="icon-YP2_edit gallery-item-wdm-3"
                                                                            onClick={(event: React.SyntheticEvent<HTMLElement>,
                                                                                data: object) => this.onClickEditCost()} />
                                                                        : <div></div>}
                                                                </List.Item>
                                                            </List>
                                                        </List.Item>
                                                        <List.Item>
                                                            {this.state.lblErrPrice ? <Label color='red' floating>Error</Label> : <div></div>}
                                                        </List.Item>
                                                    </List>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>

                                {!this.publishedVal
                                    ? <div></div>
                                    : <Grid.Row className="social-area">
                                        <Grid.Column>
                                            <Grid>
                                                <Grid.Row name="row art rating" className="gallery-item-popup-art-rating-row">
                                                    <Grid.Column className="no-side-padding">
                                                        {this.renderArtRating()}
                                                    </Grid.Column>
                                                </Grid.Row>
                                                <Grid.Row name="row art social" className="gallery-item-popup-art-social-row">
                                                    <Grid.Column className="no-left-padding">
                                                        {this.renderArtSocial()}
                                                    </Grid.Column>
                                                </Grid.Row>
                                            </Grid>
                                        </Grid.Column>
                                    </Grid.Row> }
                                <Grid.Row className="gallery-item-popup-divider">
                                    <Grid.Column>
                                        <Divider className="gallery-item-popup-divider"/>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row name="row artist" className="gallery-item-popup-artist-row">
                                    <Grid.Column>
                                        <Grid>
                                            <Grid.Row>
                                                <Grid.Column width={4} className="gallery-item-popup-artist-circ-clmn">
                                                    <Segment size="mini" circular className="gallery-item-popup-artist-circ-segment" color={"grey"}>
                                                        <Header as='h3' className="gallery-item-popup-artist-circ-header">
                                                            {this.translate('galleryItemOperationPop.memberShortTitle').toString()}
                                                        </Header>
                                                    </Segment>
                                                </Grid.Column>
                                                <Grid.Column width={12}>
                                                    <Grid>
                                                        <Grid.Row>
                                                            <Grid.Column width={13}>
                                                                <div className="gallery-item-popup-nickname-title">
                                                                    {this.translate('galleryItemOperationPop.byTxt').toString()} {infoDialogParams.memberNickName}
                                                                </div>
                                                            </Grid.Column>
                                                            <Grid.Column width={1}>
                                                                <Popup position={"bottom left"}
                                                                    trigger={<Icon size="large" className="icon-YP2_info gallery-item-wdm-3 gallery-item-popup-atist-poup-info-icon"/>}>
                                                                    <Grid className="p-info wdm-style-6">
                                                                        <Grid.Row>
                                                                            <Grid.Column width={8}> {this.translate('galleryItemOperationPop.memberNickNameTitle').toString()}:</Grid.Column>
                                                                            <Grid.Column width={8}>{infoDialogParams.memberNickName}
                                                                            </Grid.Column>
                                                                        </Grid.Row>
                                                                        <Grid.Row>
                                                                            <Grid.Column width={8}>{this.translate('galleryItemOperationPop.memberDateTitle').toString()}:</Grid.Column>
                                                                            <Grid.Column width={8}>{infoDialogParams.memberDate}</Grid.Column>
                                                                        </Grid.Row>
                                                                        <Grid.Row>
                                                                            <Grid.Column width={8}>{this.translate('galleryItemOperationPop.memberProfileTitle').toString()}:</Grid.Column>
                                                                            <Grid.Column width={8}>{infoDialogParams.memberProfile}</Grid.Column>
                                                                        </Grid.Row>
                                                                    </Grid>
                                                                </Popup>
                                                            </Grid.Column>
                                                        </Grid.Row>
                                                        <Grid.Row className="gallery-item-popup-artist-rating-row">
                                                            <Grid.Column width={16}>
                                                                {this.renderArtistRating()}
                                                            </Grid.Column>
                                                        </Grid.Row>
                                                    </Grid>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row className="gallery-item-popup-divider">
                                    <Grid.Column>
                                        <Divider className="gallery-item-popup-divider" />
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row className="analytical-area">
                                    <Grid.Column>
                                        <Grid className="analitical">
                                            <Grid.Row className="">
                                                <Grid.Column width={8}>
                                                    <List horizontal className="gic po">
                                                        <List.Item className="icon"> <Icon className="icon-YP2_like heart"/></List.Item>
                                                        <List.Item className="title">
                                                            <div>
                                                                {this.translate('galleryItemOperationPop.popularTitle').toString()}
                                                            </div>
                                                        </List.Item>
                                                        <List.Item className="value">
                                                            <div>{infoDialogParams.artPopularity}</div>
                                                        </List.Item>
                                                    </List>
                                                </Grid.Column>
                                                <Grid.Column width={8}>
                                                    <List horizontal className="gic po">
                                                        <List.Item className="icon">
                                                            <Icon className="icon-YP2_eye"/>
                                                        </List.Item>
                                                        <List.Item className="title">
                                                            <div>
                                                                {this.translate('galleryItemOperationPop.pickedTitle').toString()}
                                                            </div>
                                                        </List.Item>
                                                        <List.Item className="value">
                                                            <div>{infoDialogParams.picked}</div>
                                                        </List.Item>
                                                    </List>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row className="">
                                                <Grid.Column width={8}>
                                                    <Transition visible={this.props.memberOwner || this.props.employee} duration={1} animation={"fade"}>
                                                        <List horizontal className="gic po">
                                                            <List.Item className="icon">  <Icon className="icon-YP2_pencil"/></List.Item>
                                                            <List.Item className="title">
                                                                <div>
                                                                    {this.translate('galleryItemOperationPop.designTitle').toString()}
                                                                </div></List.Item>
                                                            <List.Item className="value">
                                                                <div>{infoDialogParams.designCount}</div>
                                                            </List.Item>
                                                        </List>
                                                    </Transition>
                                                </Grid.Column>
                                                <Grid.Column width={8}>
                                                    <Transition visible={this.props.memberOwner || this.props.employee} duration={1} animation={"fade"}>
                                                        <List horizontal className="gic po">
                                                            <List.Item className="icon">  <Icon className="icon-YP1_cart"/></List.Item>
                                                            <List.Item className="title">
                                                                <div>
                                                                    {this.translate('galleryItemOperationPop.ordersTitle').toString()}
                                                                </div>
                                                            </List.Item>
                                                            <List.Item className="value">
                                                                <div>{infoDialogParams.orders}</div>
                                                            </List.Item>
                                                        </List>
                                                    </Transition>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row className="">
                                                <Grid.Column width={8}>
                                                    <Transition visible={this.props.memberOwner || this.props.employee} duration={1} animation={"fade"}>
                                                        <List horizontal className="gic po">
                                                            <List.Item className="icon">  <Icon className="icon-YP2_pig"/></List.Item>
                                                            <List.Item className="title">
                                                                <div>
                                                                    {this.translate('galleryItemOperationPop.earningsTitle').toString()}
                                                                </div>
                                                            </List.Item>
                                                            <List.Item className="value">
                                                                <div>{infoDialogParams.totalEarnings}</div>
                                                            </List.Item>
                                                        </List>
                                                    </Transition>
                                                </Grid.Column>
                                                <Grid.Column width={8}>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row className="gallery-item-popup-divider">
                                    <Grid.Column>
                                        <Divider className="gallery-item-popup-divider" />
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row className="pbl-area">
                                    <Grid.Column>
                                        <Grid>
                                            <Grid.Row>
                                                <Grid.Column width={13}>
                                                    <div className="gallery-item-operation-popup.publishTitle">
                                                        {this.translate('galleryItemOperationPop.publishTitle').toString()}
                                                    </div>
                                                </Grid.Column>
                                                <Grid.Column width={1} className="gallery-item-popup-publish-icon">
                                                    <Popup position={"bottom left"}
                                                            trigger={<Icon className="icon-YP2_info gallery-item-wdm-3" size="large" />}>
                                                        <Grid className="p-info wdm-style-6">
                                                            <Grid.Row>
                                                                <Grid.Column width={8}>
                                                                    {this.translate('galleryItemOperationPop.publishStatusTitle').toString()}:
                                                                </Grid.Column>
                                                                <Grid.Column width={8}>{infoDialogParams.publishStatus}
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row>
                                                                <Grid.Column width={8}>
                                                                    {this.translate('galleryItemOperationPop.statusTimeTitle').toString()}:
                                                                </Grid.Column>
                                                                <Grid.Column width={8}>{infoDialogParams.statusTime}</Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row>
                                                                <Grid.Column width={8}>
                                                                    {this.translate('galleryItemOperationPop.handlerEmployeeIDTitle').toString()}:
                                                                </Grid.Column>
                                                                <Grid.Column width={8}>{infoDialogParams.handlerEmployeeID}
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row>
                                                                <Grid.Column width={8}>{reasonTitle}</Grid.Column>
                                                                <Grid.Column width={8}>{reasonVal}</Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    </Popup>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row name="row log" className="gallery-item-popup-published-list-row">
                                    <Grid.Column>
                                        {this.renderWdmItemLogList()}
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row name="row publish" className="gallery-item-popup-publish-btns-row">
                                    <Grid.Column>
                                            <GalleryItemPublishBlock
                                                disabledMyCloudBlock={this.state.disabledPublishBlock}
                                                wdmItem={this.props.wdmItem}
                                                galleryItem={this.props.galleryItem}
                                                memberOwner={this.props.memberOwner}
                                                employee={this.props.employee}
                                                infoDialog={this.props.infoDialog}
                                                pageContext={this.props.pageContext}
                                                wdmSubConext={this.props.wdmSubConext}
                                                imgContent={this.props.imgContent}
                                                gallery={this.props.gallery}
                                                member={this.props.member}
                                                handleShowPopupOperation={this.handleShowPopupOperation}
                                                handleHidePopupOperation={this.handleHidePopupOperation}
                                                operationPopup={this}
                                                publishingData={publishingDataVal}
                                                onPublishingDataChanged={this.onPublishingDataChanged}
                                                onCloseParent={this.onClose}
                                                parent={this}
                                                onPublish={this.onPublish}
                                                mpDesignFolderHash={this.props.mpDesignFolderHash}/>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
               <Rail internal position='right' className="gallery-item-close-popup">
                   <Icon className="gallery-item-close-popup-icon" inverted circular={true} color="grey" name={'delete'} flipped={"horizontally"} size="small"
                         onClick={(e: any) => this.openPopupOperationHandler(e, false)} />
               </Rail>
            </Popup>
        </div>;
    }
}
