import * as _ from "lodash";
import { observer, inject } from 'mobx-react';
import { isAlive, IStateTreeNode } from 'mobx-state-tree';
import * as React from 'react';
import { Icon, List, Loader, Input, Message } from 'semantic-ui-react';
import EnhancedButton from "../../components/EnhancedButton";
import ModalDialog from "../../components/ModalDialog";
import { ModalDialogResult } from "../../store/ModalDialog/ModalDialogManager";
import * as $ from "jquery";
import { ILocalizeActions } from "../../store/Localize";
import { GalleryItemComponent, GalleryItemEventData } from "../../components/Gallery/GalleryItemComponent";
import { IMember, IWdmMember } from "../../store/model/Member";
import { PageContext, WDMSubConext } from "../../constants/enums";
import * as H from 'history';
import * as InfiniteScroll from "react-infinite-scroll-component";
import { servicesConfig, thumbGraphicSize } from "conf";
import MasonryLayout from "../../components/MasonryLayout";
import { GalleryType, IGalleryItem, IGalleryItemActions, IGalleryElementActions, IGallery, GalleryFolderNames } from "../../store";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { publishedAction, IPublishedDesignActions } from "../../store/Gallery/Published";

export interface IGalleryFolderProps {
    key:number,
    folder: IGalleryItem,
    skipContentRendering?: boolean,
    canUpload?: boolean,
    canDelete?: boolean,
    canRename?: boolean;
    isOpened?:boolean,
    onItemSelected?(item: IGalleryItem, data?: GalleryItemEventData): void,
    onItemLoaded?(item: IGalleryItem): void,
    onUploadGraphic?(item: IGalleryItem): void,
    localize?: ILocalizeActions,
    wdmMemberCommon?: IWdmMember,
    memberCommon?: IMember;
    column: number;
    gallery: IGallery;
    pageContextVal?: PageContext;
    wdmSubConextVal?: WDMSubConext;
    isPreselected?: boolean;
    galleryItemOperationModel?: GalleryItemOperationModel;
}

export interface IGalleryFolderState {
    editMode?: boolean,
    newFolderName?: string,
    isLoading?: boolean,
    isError?: boolean,
    errorMessage?: string;
}

@inject("localize", "memberCommon", "wdmMemberCommon", "galleryItemOperationModel")
@observer
export default class GalleryFolder extends React.Component<IGalleryFolderProps, IGalleryFolderState> {

    private _isMounted: boolean = false;
    private timeint = 0;
    private numClicks = 0;
    private input: Input | null = null;
    private masonry: any | null = null;
    private cancelAuth: boolean = false;
    private history: H.History = H.createMemoryHistory();
    private location: H.Location = H.createLocation("");
    private match: any = "";
    private countLoadingItems: number = this.props.column * servicesConfig.CountLoadingItems; // how many loading rows - take from config
    private lastLoadedItemIndex: number = 0;
    private loadingText: any = this.translate('wdmGallery.loadingText');
    private uploadAction: boolean = false;
    private uploadingAction: boolean = false;
    private uploadPrevLenght: number = 0;
    private hasMore: boolean = false;
    private itemElements: JSX.Element[] | undefined[] = [];
    private reopeningAction: boolean = false;
    private switchingCompleted: boolean = false;
    private infinitiProcessing: boolean = false;

    constructor(props: IGalleryFolderProps) {
        super(props);
        this.state = {
        };
    }

    translate(key: string) {
        return this.props.localize ? this.props.localize.translate(key) : "";
    }

    public componentWillReceiveProps(nextProps: IGalleryFolderProps) {
        if (!this.props.isPreselected && nextProps.isPreselected)
            this.itemClickHandler(this.props.folder);
    }

    public componentWillMount() {
        const { folder } = this.props;
        if (folder) {
            if (folder.isInitiallyEditMode)
                this.setState(_.assign(this.state, { editMode: true, newFolderName: folder.name }));

            if (this.props.folder && this.props.folder.children && this.props.folder.children.length === 0) {
                this.loadElemenets(this);
            } else {
                this.setLoadedElements(this.props);
            }
        }
    }

    public componentWillUpdate(nextProps: any, nextState: any) {
        // if uploaded new items then refresh item list, because folder.children has sorted state
        const hasChildren = ((this.props.folder) && (isAlive(this.props.folder as any as IStateTreeNode))
            && (this.props.folder.children) && (nextProps.folder) && (isAlive(nextProps.folder as any as IStateTreeNode)) && (nextProps.folder.children));
        const uploadAction = (this.uploadAction && hasChildren);

        const switchCategoryAction = (this.props.gallery &&
            nextProps.gallery.hash !== this.props.gallery.hash &&
            nextProps.pageContextVal === this.props.pageContextVal &&
            nextProps.wdmSubConextVal === this.props.wdmSubConextVal);

        if (uploadAction) {
            if (!this.uploadingAction) {
                this.uploadPrevLenght = (hasChildren && this.props.folder.children) ? this.props.folder.children.length : 0;
                this.uploadingAction = true;
            }

            if (hasChildren && this.uploadPrevLenght !== nextProps.folder.children.length) {
                this.uploadAction = false;
                this.uploadingAction = false;
                this.setLoadedElements(nextProps);
            }
        }

        if (this.reopeningAction) {
            this.setLoadedElements(nextProps);
        }

        if (nextProps.folder.isOpened && (switchCategoryAction) && !uploadAction) {
            this.switchingCompleted = true;
            this.setLoadedElements(nextProps);
        }

        if (!uploadAction && hasChildren && this.props.folder.children && this.props.folder.children.length !== nextProps.folder.children.length)
            this.setLoadedElements(nextProps);
    }

    public componentDidMount() {
        this._isMounted = true;

        // const { galleryModel } = this.props;
        //if (galleryModel && galleryModel.folders) {
        //    galleryModel.loadDefaultFolders();
        //}
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidUpdate() {
        if (this.props.folder.isInitiallyEditMode) {
            (this.props.folder as any as IGalleryItemActions).setEditMode(false);
        }
    }

    private setLoadedElements(nextProps: any) {
        if (!nextProps.folder || !nextProps.folder.children) return;
        // if has children then reset and rebuild
        this.itemElements = [];
        this.lastLoadedItemIndex = this.countLoadingItems;

        if (nextProps.folder.children.length < this.countLoadingItems) {
            this.hasMore = false;
        } else {
            this.hasMore = true;
        }
        if (this.reopeningAction) this.reopeningAction = false;
        //this.initParameters(nextProps.folder.children, this);

        this.itemElements = this.buildElements(0, this.lastLoadedItemIndex,
            nextProps.folder.children,
            nextProps.gallery.hash,
            nextProps.column,
            nextProps.memberCommon,
            nextProps.wdmMemberCommon);
    }

    private initParameters(items: IGalleryItem[], self: any) {
        if (items.length < self.countLoadingItems) {
            self.lastLoadedItemIndex = self.countLoadingItems;
            self.hasMore = false;
        } else if (items.length === self.countLoadingItems) {
            self.hasMore = true;
            self.lastLoadedItemIndex = items.length;
        } else {
            const iteration = parseInt(items.length / self.countLoadingItems);
            const nextLoadingItems = ((iteration + 1) * self.countLoadingItems);
            if (items.length === nextLoadingItems) self.hasMore = true;
            else if (items.length === (iteration * this.countLoadingItems)) this.hasMore = true;
            else if (items.length < nextLoadingItems) self.hasMore = false;

            this.lastLoadedItemIndex = items.length;
        }
    }

    private loadElemenets(_this: any) {
        const self = _this;

        self.itemElements = [];
        const galleryItemActions = self.props.folder as any as IGalleryItemActions;
        self.setState({ isLoading: true });
        galleryItemActions.load(true, 0, self.countLoadingItems, true).then((item) => {
            self.lastLoadedItemIndex = self.countLoadingItems;
            const result = self.buildElements(0, self.lastLoadedItemIndex, self.props.folder.children,
                                                self.props.gallery.hash, self.props.column,
                                                self.props.memberCommon, self.props.wdmMemberCommon);
            // if loaded data less that countLoadingItems then not have more data to load
            self.itemElements = result;
            self.initParameters(self.itemElements, self);
            if (self._isMounted)
                self.setState({ isLoading: false });
        });
    }

    private itemClickHandler(galleryItem: IGalleryItem, data?: GalleryItemEventData) {
        const galleryItemActions = galleryItem as any as IGalleryItemActions;
        const newIsOpened = !this.props.isOpened;

        // to fire event in GalleryItemComponent action to close it
        (publishedAction as any as IPublishedDesignActions).emptyEvent();

        if (this.props.isOpened && !newIsOpened) {
            this.reopeningAction = true;
        }

        if (!isAlive(galleryItem as any as IStateTreeNode)) return;

        if (this.props.skipContentRendering) {
            galleryItemActions.setIsOpened(false, true);
        }
        galleryItemActions.setIsOpened(newIsOpened, false);

        if (newIsOpened) {
            if (this.props.folder &&
            (!this.props.folder.children ||
                (this.props.folder.children && this.props.folder.children.length === 0))) {
                this.loadElemenets(this);
            } 
            this.assignState({ /*isLoading: false,*/ isError: false });
        }

        if (this.props.onItemSelected) {
            this.props.onItemSelected(galleryItem, data);
        }
    }

    private renameItemClickHandler(e: React.MouseEvent<HTMLDivElement>, galleryItem: IGalleryItem) {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.editMode) return;
        this.numClicks++;
        const self = this;

        if (this.numClicks === 2) {
            clearTimeout(this.timeint);
            this.numClicks = 0;
            if (this.props.canRename) {
                this.itemDblClickHandler(galleryItem);
                return;
            }
        }
        this.timeint = window.setTimeout(() => {
            clearTimeout(self.timeint);
            self.numClicks = 0;
            self.itemClickHandler(galleryItem);
        },
            200);
    }

    private removeItemClickHandler(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        e.stopPropagation();
    }

    private itemDblClickHandler(galleryItem: IGalleryItem) {
        const self = this;
        this.assignState({ editMode: true, newFolderName: galleryItem.name });
        window.setTimeout(() => {
            if (self.input) {
                self.input.focus();
                $(self.input as any).select();
            }
        }, 100);
    }

    private onDelete(item: IGalleryItem, parent: any) {
        let selectedCategory = parent.props.folder;
        (selectedCategory as any as IGalleryItemActions).removeItem(item);

        parent.loadElemenets(parent);
    }

    private onMove() {
        console.log("onMove");
    }

    private onDublicate() {
        console.log("onDublicate");
        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("dublicate");
    }

    private onEdit() {
        console.log("onEdit");
        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("edit");
    }

    private onAddToCart() {
        console.log("onAdd");
        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("addToCart");
    }

    private onPublish(self: any) {
        console.log("GFolder - published item!");
        (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("publish");		
    }

    private onSetCancelAuth(state: boolean, self: any) {
        if (self)
            self.cancelAuth = state;
    }

    private cardLayoutComplete() {
        if (this.masonry) this.masonry.performLayout();
    }

    private calcSizeElement(element: IGalleryItem, isDoubleSide: boolean) {
        const viewMedia = element.viewMedia[0];
        const isDesign = (this.props.gallery.type === GalleryType.Design || this.props.gallery.type === GalleryType.Background);
        const heightVal = (viewMedia && viewMedia && viewMedia.thumbImage && viewMedia.thumbImage.height && viewMedia.thumbImage.tag !== "empty"  )
                    ? viewMedia.thumbImage.height
                    : isDesign ? thumbGraphicSize.design.height : thumbGraphicSize.image.height;
        const widthVal = (viewMedia && viewMedia && viewMedia.thumbImage && viewMedia.thumbImage.width && viewMedia.thumbImage.tag !== "empty")
                ? isDoubleSide
                    ? (viewMedia.thumbImage.width) * 2
                    : viewMedia.thumbImage.width
                : isDesign ? thumbGraphicSize.design.width : thumbGraphicSize.image.width;
        
        return { height: heightVal, width: widthVal };
    }

    private buildElements(start: number, end: number, folderChildren: IGalleryItem[] | undefined, galleryHash: string, column: number,
        memberCommon: IMember | undefined, wdmMemberCommon: IWdmMember | undefined) {

        if (!folderChildren) return [];
        
        const children = folderChildren.slice(start, (folderChildren.length < end) ? folderChildren.length : end);
        let itemElements = children.map((element) => {
            if (element) {

                const isDoubleSide = element.viewMedia.length === 2 || element.isMultiPage;
                let size = this.calcSizeElement(element, isDoubleSide);

                let item =
                    <div key={element.hash}>
                        <GalleryItemComponent
                            size={size}
                            doubleSide={isDoubleSide}
                            parent={this}
                            key={element.hash}
                            wdmItem={element.wdmItemKey}
                            gallery={this.props.gallery}
                            history={this.history}
                            location={this.location}
                            match={this.match}
                            galleryItem={element}
                            pageContext={this.props.pageContextVal!}
                            wdmSubConext={this.props.wdmSubConextVal!}
                            onDelete={this.onDelete}
                            onMove={this.onMove}
                            onDublicate={this.onDublicate}
                            onEdit={this.onEdit}
                            onAddToCart={this.onAddToCart}
                            memberExternal={memberCommon}
                            wdmMemberExternal={wdmMemberCommon}
                            onItemSelected={(item: IGalleryItem, data: GalleryItemEventData) => this.itemClickHandler(item, data)}
                            onItemLoaded={(item: IGalleryItem) => this.imageLoadedHandler(item)}
                            onLayoutComplete={() => this.cardLayoutComplete()}
                            onPublish={this.onPublish}
                            cancelAuth={this.cancelAuth}
                            onSetCancelAuth={this.onSetCancelAuth}
                            column={column}
                            parentType={"folder"}
                            isDragging={true}/>
                    </div>;

                return item;
            }
        });

        return itemElements;
    }

    getNextItems = () => {
        //console.log("load more!");
        if (this.infinitiProcessing) return;
        this.infinitiProcessing = true;

        if (!this.props.folder || !this.props.folder.children) return;

        // check loaded items if has children more than lastLoadedItemIndex
        if (this.props.folder.children.length > this.lastLoadedItemIndex) {
            let items = this.props.folder.children;
            
            const surplus = items.length - this.lastLoadedItemIndex;
            if (surplus < this.countLoadingItems) {
                this.hasMore = false;
                const additionalElements = this.buildElements(this.lastLoadedItemIndex,
                    (this.lastLoadedItemIndex + surplus),
                    this.props.folder.children,
                    this.props.gallery.hash,
                    this.props.column,
                    this.props.memberCommon,
                    this.props.wdmMemberCommon);
                this.itemElements = this.itemElements!.concat(additionalElements);
                this.lastLoadedItemIndex += surplus;
            }
            else {
                this.hasMore = true;
                const additionalElements = this.buildElements(this.lastLoadedItemIndex,
                    (this.lastLoadedItemIndex + this.countLoadingItems),
                    this.props.folder.children,
                    this.props.gallery.hash,
                    this.props.column,
                    this.props.memberCommon,
                    this.props.wdmMemberCommon);
                this.itemElements = this.itemElements!.concat(additionalElements);
                this.lastLoadedItemIndex = this.lastLoadedItemIndex + this.countLoadingItems;
            }
            this.infinitiProcessing = false;
            if (this._isMounted)
                this.setState({ isLoading: false, isError: false });
            return;
        }

        // if else <= then load from server side
        const galleryItemActions = this.props.folder as any as IGalleryItemActions;
        galleryItemActions.makeLoadingAdditionalItems();
        const self = this;
        galleryItemActions.load(true, this.lastLoadedItemIndex, this.countLoadingItems, false).then((item) => {

            const additionalElements = self.buildElements(this.lastLoadedItemIndex,
                (self.lastLoadedItemIndex + self.countLoadingItems),
                self.props.folder.children,
                self.props.gallery.hash,
                self.props.column,
                self.props.memberCommon,
                self.props.wdmMemberCommon);
            self.lastLoadedItemIndex = self.lastLoadedItemIndex + self.countLoadingItems;

            self.itemElements = self.itemElements!.concat(additionalElements);
            self.hasMore = (additionalElements.length > 0);
            this.infinitiProcessing = false;
            if (this._isMounted)
                self.setState({ isLoading: false, isError: false});

        }).catch((error) => {
            self.assignState({ isLoading: false, isError: true, errorMessage: error.message });
        });
    }

    getEmptyNextItems = () => {
        // for the correct operation of the infinity component
        // without this, an exception occurs in the logic of the component
    }

    onScroll = () => {
        const wind = $(window);
        const key = (this.props) && (this.props.folder) && (this.props.folder.hash)
            ? this.props.folder.hash.replace('/', '-')
            : undefined;
        if (!key) {
            console.log("Error: can't find a key for the loader element!");
            return;
        }

        const elem = $(`#infinite-loader-${key}`); 
        if (wind && elem && elem.length > 0) {
            if (wind.scrollTop() + wind.height() > elem.offset().top) {
                this.getNextItems();
            }
        }
    }

    private renderChildItems() {
        
        if (!this.props.folder.children) return <div></div>;

        const loader = <div className="loader"
                            id={`infinite-loader-${this.props.folder.hash!.replace('/', '-')}`}>
                            <div className="icon icon-YP2_cloud download" /><div>{this.loadingText}</div></div>;
        const elements = <InfiniteScroll dataLength={(this.itemElements) ? this.itemElements.length : 0}
                                         hasMore={this.hasMore}
                                         style={{ overflow: "hidden" }}
                                         scrollableTarget="gallery-view-scroller"
                                         onScroll={this.onScroll}
                                         next={this.getEmptyNextItems}
                                         loader={loader}>
                                <MasonryLayout columns={this.props.column} gap={0.25} children={this.itemElements} 
                                                sortBySides={ this.props.gallery.type === GalleryType.Design || this.props.gallery.type === GalleryType.Background} />
                            </InfiniteScroll>;
    return elements;
    }

    private imageLoadedHandler(item: IGalleryItem) {
    }

    private btnUploadClickHandler(e: React.MouseEvent<HTMLButtonElement>, item: IGalleryItem) {
        e.preventDefault();
        e.stopPropagation();
        if (this.props.onUploadGraphic) {
            this.props.onUploadGraphic(item);
            this.uploadAction = true;
        }
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: IGalleryFolderState) {
        if (!newState.errorMessage) newState.errorMessage = "";
        if(this._isMounted)
            this.setState(_.assign({}, this.state, newState));
    }

    onFolderNameChange(event: React.SyntheticEvent<HTMLInputElement>, data: any): any {
        console.log(event, data);
    }

    renameItemHandler() {

        const errMsg = this.isItemNameInvalid(this.state.newFolderName);

        if (errMsg) {
            this.setErrorMessage(errMsg, true);
            return;
        }

        if (this.state.newFolderName === this.props.folder.name) {
            this.assignState({ editMode: false, newFolderName: "" });
        } else {
            this.assignState({ isLoading: true, editMode: false });
            (this.props.folder! as any as IGalleryElementActions).rename(this.state.newFolderName || "").then(() => {
                this.assignState({ editMode: false, isLoading: false, newFolderName: "" });
            }).catch((error: any) => {
                this.setErrorMessage(error, true);
            });
        }
    }

    private setErrorMessage(errMsg: string, setEditMode?: boolean) {
        this.assignState({ errorMessage: errMsg, isLoading: false, editMode: setEditMode });
        if (setEditMode)
            window.setTimeout(() => this.input && $(this.input as any).focus().select(), 100);
        else
            window.setTimeout(() => this.assignState({ errorMessage: "" }), 5000);
    }

    private isItemNameInvalid(name?: string) {
        const invalidFolderCharacters = "/\\|,'\"<>#$%^&![]{}@?";

        if (name) name = name.trim();
        if (!name) return "Name can't be empty!";

        for (let i = 0; i < invalidFolderCharacters.length; i++) {
            if (name.indexOf(invalidFolderCharacters[i]) >= 0) return `Name can't contain invalid characters: <br/> ${invalidFolderCharacters}`;
        }

        if (name.startsWith("__")) return `Name can't start by '__' characters!`;

        return "";
    }

    onRenameItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.keyCode === 13 && this.input) this.renameItemHandler();

        //cancel renaming
        if (e.keyCode === 27 && this.input) this.setState({ editMode: false, errorMessage: "", newFolderName: "" });
    }

    onFolderNameChangeHandler(value: string) {
        value = value.trim();
        //trim '.' at the end
        while (value.endsWith(".")) {
            value = value.substr(0, value.length - 1);
        }
        this.assignState({ newFolderName: value });
    }

    onRemoveFolderResult(result: number) {
        if (result & ModalDialogResult.Okay) {
            const self = this;
            this.assignState({ isLoading: true });
            (this.props.folder as any as IGalleryElementActions).remove()
            .catch((error) => {
                self.setErrorMessage(error);
            });
        }
        return true;
    }

    public render() {        
        const { folder, canUpload, canDelete, isOpened } = this.props;
        const { translate } = this.props.localize!;

        if (!folder) return null;

        let iconClassName = "wdm-folder-icon ";
        if (folder.hash && folder.hash.endsWith(GalleryFolderNames.AutoSave))
            iconClassName += "icon-YP2_temp";     
        else
            iconClassName += "icon-YP2_folder " + (isOpened ? "open" : "closed");

        return <List.Item id={`folder-${folder.hash!.replace('/', '-')}`} as='a'
            className={this.props.isOpened ? "selected" : ""}
            onClick={(e) => this.itemClickHandler(folder)}
            active={this.props.skipContentRendering && this.props.isOpened}>
            <div className='gallery-sizer' />
            <List.Content className='wdm-folder-content'>
                <div className="wdm-header">
                    <Icon className={iconClassName} />
                    <List.Header className='wdm-folder-content-header'>
                        <div className="wdm-folder-label"
                            onClick={(e) => this.renameItemClickHandler(e, folder)}>
                            {this.state.editMode &&
                                <Input ref={(input) => this.input = input} size="mini" defaultValue={this.state.newFolderName}
                                    onChange={(e, data) => this.onFolderNameChangeHandler(data.value)}>
                                    <input onBlur={() => this.renameItemHandler()} onKeyDown={(e) => this.onRenameItemKeyDown(e)} />
                                </Input>}
                            <div className="wdm-folder-ctls">
                                <Loader inline active={(this.state.isLoading || folder.isUploading) && !this.state.isError} size='mini' className='wdm-folder-loader' />
                                {canUpload && <EnhancedButton basic compact
                                    className="wdm-btn-simple wdm-style-4 no-border"
                                    ypIcon="YP2_cloud upload"
                                    disabled={this.state.isLoading || folder.isUploading}
                                    popup={translate('wdmGallery.ttlUploadGraphics')}
                                    onClick={(e) => this.btnUploadClickHandler(e, folder)} />}
                                {canDelete && <ModalDialog trigger={<EnhancedButton basic compact
                                    className="wdm-btn-simple wdm-style-4 no-border"
                                    ypIcon="YP3_trash"
                                    disabled={this.state.isLoading || folder.isUploading}
                                    popup={translate('wdmGallery.ttlRemoveFolder')}
                                    onClick={(e) => this.removeItemClickHandler(e)} />}
                                    icon="warning sign"
                                    header={this.translate("dlgRemoveFolder.header")}
                                    content={<div>{this.translate("dlgRemoveFolder.contentPrefix")}
                                        <b>{folder.hash}</b>
                                        {this.translate("dlgRemoveFolder.contentSuffix")}
                                    </div>}
                                    size="tiny"
                                    onResult={(result) => this.onRemoveFolderResult(result)} />}
                            </div>
                            {!this.state.editMode && (this.state.newFolderName || folder.name)}
                            {this.state.errorMessage &&
                                <Message compact size="mini" negative>{this.state.errorMessage}</Message>}
                        </div>
                    </List.Header>
                </div>
                {folder.children && this.props.isOpened && !this.props.skipContentRendering
                    && this.renderChildItems()}
            </List.Content>
        </List.Item>;
    }
}
