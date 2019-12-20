import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { IGalleryItem, IGalleryItemActions, IGallery, GalleryItemType, GalleryType } from '../../store';
import { ILocalizeActions } from "../../store/Localize";
import { GalleryItemComponent, GalleryItemComponentNoDrag , GalleryItemEventData }
    from "../../components/Gallery/GalleryItemComponent";
import { IMember, IWdmMember } from "../../store/model/Member";
import * as H from 'history';
import * as InfiniteScroll from "react-infinite-scroll-component";
import { servicesConfig, thumbGraphicSize } from "conf";
import { publishedAction, IPublishedDesignActions, IGetterPublished } from "../../store/Gallery/Published";
import { Loader } from 'semantic-ui-react';
import MasonryLayout from "../../components/MasonryLayout"
import { PageContext, WDMSubConext, ViewOrientationType } from "../../constants/enums";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import GalleryItemSimplyView from "../../containers/Gallery/GalleryItemSimplyView";
import ShortUid from "../../utils/ShortUid";
import { MyCloudModel, IMyCloudModelActions } from "ClientApp/store/model/MyCloudModel";

export interface IGalleryViewProps {
    items: IGalleryItem[] | undefined;
    gallery: IGallery | undefined;
    pageContext?: PageContext;
    wdmSubConext?: WDMSubConext;

    skipContentRendering?: boolean,
    localize?: ILocalizeActions,
    wdmMemberCommon?: IWdmMember,
    memberCommon?: IMember;
    simplyStyleGalleryItemComponent?: boolean;
    column?: number;
    row?: number;
    parent?: any;
    viewDataOrientation?: ViewOrientationType;
    galleryItemOperationModel?: GalleryItemOperationModel;
    simplyView?: boolean;
    checkedSelected?: boolean;
    isDragging?: boolean;
    ignoreHidePanels?: boolean;
    ignoreDraging?: boolean;
    myCloudModel?: MyCloudModel;

    onChangeItems?(parent: any, items?: IGalleryItem[], gallery?: IGallery): void;
    onItemSelected?(item: IGalleryItem): void;
    onItemLoaded?(item: IGalleryItem): void;
}

export interface IGalleryViewState {
}

@inject("localize", "memberCommon", "wdmMemberCommon", "galleryItemOperationModel", "myCloudModel")
@observer
export default class GalleryView extends React.Component<IGalleryViewProps, IGalleryViewState> {

    constructor(props: IGalleryViewProps) {
        super(props);
        this.state = {
        };
    }

    private _isMounted: boolean = false;
    private cancelAuth: boolean = false;
    //private pageContextVal = (this.props.pageContext) ? this.props.pageContext : PageContext.None;
    //private wdmSubConextVal = (this.props.wdmSubConext) ? this.props.wdmSubConext : WDMSubConext.None;
    private history: H.History = H.createMemoryHistory();
    private location: H.Location = H.createLocation("");
    private match: any = "";
    private countLoadingItems = (this.props.column ? this.props.column : 1) * servicesConfig.ViewCountLoadingItems; // how many loading rows - take from config
    private lastLoadedItemIndex: number = 0;
    private loadingText: any = this.translate('wdmGallery.loadingText');
    private hasMore: boolean = false;
    private internalItems: IGalleryItem[] | undefined = [];
    private itemElements: (JSX.Element | undefined)[] = [];
    private listItemLoading: boolean = false;

    translate(key: string) {
        return this.props.localize ? this.props.localize.translate(key) : "";
    }

    public componentWillMount() {

        if (this.internalItems && this.internalItems.length === 0 && this.props.items && this.props.items.length !== 0) {
            //this.initParameters(this.props.items);
            this.lastLoadedItemIndex = this.countLoadingItems;
            if (this.props.items.length  < this.countLoadingItems) {
                this.hasMore = false;
            } else {
                this.hasMore = true;
            }
            this.internalItems = this.props.items;
            this.itemElements = this.buildElements(0, this.lastLoadedItemIndex);
            this.listItemLoading = false;
            return;
        }

        this.lastLoadedItemIndex = this.countLoadingItems;
    }

    public componentWillReceiveProps(nextProps: any, nextState: any) {

        if (nextProps.items) {

            if (this.props.column !== nextProps.column) {
                this.countLoadingItems = nextProps.column * servicesConfig.ViewCountLoadingItems;
            }

            const switchCategory = (this.props.items &&
                this.props.gallery &&
                nextProps.gallery.hash !== this.props.gallery.hash &&
                nextProps.pageContext === this.props.pageContext &&
                nextProps.wdmSubConext === this.props.wdmSubConext);

            const switchSubCategory = (this.props.items &&
                this.props.gallery &&
                nextProps.gallery.hash === this.props.gallery.hash &&
                nextProps.pageContext === this.props.pageContext && 
                nextProps.wdmSubConext !== this.props.wdmSubConext);

            const notSetValueBefore = (!this.internalItems || this.internalItems.length === 0);

            if (!this.props.items || this.props.items !== nextProps.items ||
                switchCategory || switchSubCategory || notSetValueBefore) {
                this.internalItems = nextProps.items;

                //this.initParameters(this.internalItems);
                this.itemElements = [];
                this.lastLoadedItemIndex = this.countLoadingItems;
                if (!this.internalItems || this.internalItems.length < this.countLoadingItems) {
                    this.hasMore = false;
                } else {
                    this.hasMore = true;
                }

                this.itemElements = this.buildElements(0, this.lastLoadedItemIndex, nextProps.column, nextProps.wdmSubConext, nextProps.pageContext);
                this.listItemLoading = false;
                return;
            }
        } else {
            this.itemElements = [];
            this.hasMore = false;
        }

        if (this.props.checkedSelected !== nextProps.checkedSelected) {
            // todo: add complex logic to check the checkbox in the GIC.
            // To do this, call the buildElement method with corrective start and take the parameters-add it in the future
            // but now it call myCloudModel action to fire event in MyCloudButtonActionBox.onCheckedSelected
        }
    }

    private initParameters(items: IGalleryItem[]) {
        if (items.length < this.countLoadingItems) {
            this.lastLoadedItemIndex = this.countLoadingItems;
            this.hasMore = false;
        } else if (items.length === this.countLoadingItems) {
            this.hasMore = true;
            this.lastLoadedItemIndex = items.length;
        } else {
            const iteration = parseInt(items.length / this.countLoadingItems);
            const nextLoadingItems = ((iteration+1) * this.countLoadingItems);
            if (items.length === nextLoadingItems) this.hasMore = true;
            else if (items.length === (iteration * this.countLoadingItems)) this.hasMore = true;
            else if (items.length < nextLoadingItems) this.hasMore = false;

            this.lastLoadedItemIndex = items.length;
        }
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private itemClickHandler(galleryItem: IGalleryItem, data?: GalleryItemEventData) {
        const galleryItemActions = galleryItem as any as IGalleryItemActions;
        const newIsOpened = !galleryItem.isOpened;

        if (this.props.skipContentRendering) {
            galleryItemActions.setIsOpened(false, true);
        }
        galleryItemActions.setIsOpened(newIsOpened, false);
        //}
        if (newIsOpened && galleryItem.type === GalleryItemType.Folder) {
            galleryItemActions.load();
        }
        if (this.props.onItemSelected) {
            this.props.onItemSelected(galleryItem);
        }
    }

    private onDelete(deleteItem: IGalleryItem, parent: any) {

        var foundedItem = parent.internalItems.find((value: IGalleryItem) => value.hash === deleteItem.hash);
        if (foundedItem)
            parent.internalItems.splice(parent.internalItems.indexOf(foundedItem), 1);
        
        parent.lastLoadedItemIndex = parent.countLoadingItems;
        if (parent.internalItems.length < parent.countLoadingItems) {
            parent.hasMore = false;
        } else {
            parent.hasMore = true;
        }

        parent.itemElements = parent.buildElements(0, this.lastLoadedItemIndex);

        if (parent.props.onChangeItems)
            parent.props.onChangeItems(parent.props.parent, parent.internalItems, parent.props.gallery!);

        if (parent._isMounted)
            parent.forceUpdate();

    }

    private onMove() {
    }

    private onDublicate() {
        console.log("onDublicate");
    }

    private onEdit() {
        console.log("onEdit");
    }

    private onAddToCart() {
        console.log("onAdd");
    }

    private onPublish() {
        console.log("GView - publish item");
        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publish");
    }

    private cardLayoutComplete() {
    }

    private onSetCancelAuth(state: boolean, self: any) {
        if (self)
            self.cancelAuth = state;
    }

    private calcSizeElement(element: IGalleryItem, isDoubleSide?: boolean) {
        const { gallery } = this.props;
        const viewMedia = element.viewMedia[0];
        const isDesign = (gallery && gallery.hash === "Templates");
        const heightVal = (viewMedia && viewMedia.thumbImage && viewMedia.thumbImage.height && viewMedia.thumbImage.tag !== "empty")
            ? viewMedia.thumbImage.height
            : isDesign ? thumbGraphicSize.design.height : thumbGraphicSize.image.height;
        const widthVal = (viewMedia && viewMedia.thumbImage && viewMedia.thumbImage.width && viewMedia.thumbImage.tag !== "empty")
            ? isDoubleSide
                ? (viewMedia.thumbImage.width) * 2
                : viewMedia.thumbImage.width
            : isDesign ? thumbGraphicSize.design.width : thumbGraphicSize.image.width;

        return { height: heightVal, width: widthVal };
    }

    itemClickSimplyViewHandler(refElem: HTMLInputElement | null, parent: any, hash?: string) {
    }

    private buildElements(start: number, end: number, column?: number, wdmSubConext?: WDMSubConext, pageContext?: PageContext) {

        if (!this.internalItems || this.internalItems.length <= 0) return [];
        let elements = this.internalItems.slice(start, end).map((element: IGalleryItem) => {
            if (element) {
                const isDoubleSide = element.viewMedia.length === 2 || element.isMultiPage;
                let size = this.calcSizeElement(element, isDoubleSide);

                let item = <div key={element.hash} >

                    {this.props.simplyView
                        ? <GalleryItemSimplyView
                            parent={this}
                            doubleSide={isDoubleSide}
                            key={`${element.hash}-${ShortUid.uid}`}
                            galleryItem={element}
                            column={(column) ? column : (this.props.column ? this.props.column : 1)}
                            imgAdditionalClassName="tile-row-10"
                            itemClickHandler={(refElem, parent, hash) => this.itemClickSimplyViewHandler(refElem, parent, hash)} />
                        : !this.props.isDragging
                            ? <GalleryItemComponentNoDrag
                                parent={this}
                                size={size}
                                doubleSide={isDoubleSide}
                                key={`${element.hash}-${this.props.pageContext}-${this.props.wdmSubConext}`}
                                wdmItem={element.wdmItemKey}
                                gallery={this.props.gallery}
                                history={this.history}
                                location={this.location}
                                match={this.match}
                                galleryItem={element}
                                pageContext={(pageContext) ? pageContext : this.props.pageContext}
                                wdmSubConext={(wdmSubConext) ? wdmSubConext : this.props.wdmSubConext}
                                onDelete={this.onDelete}
                                onMove={this.onMove}
                                onDublicate={this.onDublicate}
                                onEdit={this.onEdit}
                                onAddToCart={this.onAddToCart}
                                memberExternal={this.props.memberCommon}
                                wdmMemberExternal={this.props.wdmMemberCommon}
                                onItemSelected={(item: IGalleryItem, data: GalleryItemEventData) => this.itemClickHandler(item, data)}
                                onItemLoaded={(item: IGalleryItem) => this.imageLoadedHandler(item)}
                                onLayoutComplete={() => this.cardLayoutComplete()}
                                onPublish={this.onPublish}
                                cancelAuth={this.cancelAuth}
                                onSetCancelAuth={this.onSetCancelAuth}
                                simplyStyle={this.props.simplyStyleGalleryItemComponent}
                                column={(column) ? column : (this.props.column ? this.props.column : 1)}
                                parentType={"view"}
                                ignoreHidePanels={this.props.ignoreHidePanels}
                                checkedSelected={this.props.checkedSelected}
                                ignoreDraging={true} />
                            : <GalleryItemComponent
                                checkedSelected={this.props.checkedSelected}
                                parent={this}
                                size={size}
                                doubleSide={isDoubleSide}
                                key={`${element.hash}-${this.props.pageContext}-${this.props.wdmSubConext}`}
                                wdmItem={element.wdmItemKey}
                                gallery={this.props.gallery}
                                history={this.history}
                                location={this.location}
                                match={this.match}
                                galleryItem={element}
                                pageContext={(pageContext) ? pageContext : this.props.pageContext}
                                wdmSubConext={(wdmSubConext) ? wdmSubConext : this.props.wdmSubConext}
                                onDelete={this.onDelete}
                                onMove={this.onMove}
                                onDublicate={this.onDublicate}
                                onEdit={this.onEdit}
                                onAddToCart={this.onAddToCart}
                                memberExternal={this.props.memberCommon}
                                wdmMemberExternal={this.props.wdmMemberCommon}
                                onItemSelected={(item: IGalleryItem, data: GalleryItemEventData) => this.itemClickHandler(item, data)}
                                onItemLoaded={(item: IGalleryItem) => this.imageLoadedHandler(item)}
                                onLayoutComplete={() => this.cardLayoutComplete()}
                                onPublish={this.onPublish}
                                cancelAuth={this.cancelAuth}
                                onSetCancelAuth={this.onSetCancelAuth}
                                simplyStyle={this.props.simplyStyleGalleryItemComponent}
                                column={(column) ? column : (this.props.column ? this.props.column : 1)}
                                parentType={"view"}
                                checkedSelected={this.props.checkedSelected}
                                ignoreHidePanels={this.props.ignoreHidePanels}
                                ignoreDraging={false} />
                    }
                </div>;
                return item;
            }
        });

        return (elements) ? elements : [];
    }

    getNextItems = () => {
        //console.log("load more!");
        if (!this.internalItems) return;

        // check loaded items if has childeren more than lastLoadedItemIndex
        if (this.internalItems.length > this.lastLoadedItemIndex) {
            let items = this.internalItems;

            const surplus = items.length - this.lastLoadedItemIndex;
            if (surplus < this.countLoadingItems) {
                this.hasMore = false;
                const additionalElements = this.buildElements(this.lastLoadedItemIndex, (this.lastLoadedItemIndex + surplus));
                this.itemElements = this.itemElements!.concat(additionalElements);
                this.lastLoadedItemIndex += surplus;
            }
            else {
                this.hasMore = true;
                const additionalElements = this.buildElements(this.lastLoadedItemIndex, (this.lastLoadedItemIndex + this.countLoadingItems));
                this.itemElements = this.itemElements!.concat(additionalElements);
                this.lastLoadedItemIndex = this.lastLoadedItemIndex + this.countLoadingItems;
            }
            if (this._isMounted)
                this.setState({ isLoading: false, isError: false });
            return;
        }

        // if else <= then load from server side
        const self = this;
        if (this.props.pageContext === PageContext.WDM && this.props.wdmSubConext === WDMSubConext.MyUnPublish) {

            (publishedAction as any as IPublishedDesignActions).getUnpublishedItemsByCategory(this.props.gallery!.hash,
                    false,
                    this.lastLoadedItemIndex,
                    this.countLoadingItems)
                .then((items: any) => {

                    if (self.internalItems)
                        self.internalItems = self.internalItems.concat(items.galleryItem);

                    if (self.props.onChangeItems)
                        self.props.onChangeItems(self.props.parent, self.internalItems, this.props.gallery!);

                    const additionalElements = self.buildElements(this.lastLoadedItemIndex,
                        (self.lastLoadedItemIndex + self.countLoadingItems));

                    self.lastLoadedItemIndex = self.lastLoadedItemIndex + self.countLoadingItems;
                    self.hasMore = (additionalElements.length > 0);
                    self.itemElements = self.itemElements!.concat(additionalElements);

                    if (this._isMounted)
                        self.setState({ isLoading: false, isError: false });

                    // for myCloud - insert additional items in store - to calc count
                    (self.props.myCloudModel as any as IMyCloudModelActions).setCountGalleryItem(self.internalItems ? self.internalItems.length : 0);
                });

            return;
        }

        // else: myPublish, PublicCloud
        if (this.props.pageContext === PageContext.WDM) {

            const requestData: IGetterPublished = {
                onlyMember: false,
                start: this.lastLoadedItemIndex,
                take: this.countLoadingItems
            };

            (publishedAction as any as IPublishedDesignActions).getPublishedItemsByCategory(this.props.gallery!.hash, requestData)
                .then((items) => {

                    if (self.internalItems)
                        self.internalItems = self.internalItems.concat(items);

                    if (self.props.onChangeItems)
                        self.props.onChangeItems(self.props.parent, self.internalItems, this.props.gallery!);

                    const additionalElements = self.buildElements(this.lastLoadedItemIndex,
                        (self.lastLoadedItemIndex + self.countLoadingItems));

                    self.lastLoadedItemIndex = self.lastLoadedItemIndex + self.countLoadingItems;
                    self.hasMore = (additionalElements.length > 0);
                    self.itemElements = self.itemElements!.concat(additionalElements);

                    if (this._isMounted)
                        self.setState({ isLoading: false, isError: false });
                });
        }
    }

    private renderChildItems(items?: IGalleryItem[]) {
        const { gallery, column } = this.props;
        if (!gallery || !items || items.length <= 0) return <div></div>;
        
        const loader = <div className="loader"><div className="icon icon-YP2_cloud download" /><div>{this.loadingText}</div></div>;
        let elements = <InfiniteScroll dataLength={this.itemElements.length}
                                       next={this.getNextItems}
                                       hasMore={this.hasMore}
                                       scrollableTarget={"gallery-view-area-scroller"}
                                       loader={loader}>
                           <MasonryLayout columns={column ? column : 1} gap={0.25} children={this.itemElements}
                                          sortBySides={gallery!.type === GalleryType.Design || gallery!.type === GalleryType.Background}/>
                       </InfiniteScroll>;
        return elements;
    }

    private imageLoadedHandler(item: IGalleryItem) {
    }
    
    public render() {
        return <div id="gallery-view-area-scroller" className={`gallery-view-area ${this.props.simplyStyleGalleryItemComponent || this.props.simplyView ? "itself-scroll" : ""} `}>
                   {this.listItemLoading
                        ? <Loader active inline />
                        : <div></div>
                    }

                   {this.renderChildItems(this.internalItems)}
               </div>;
    }
}
