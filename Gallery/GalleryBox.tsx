import * as React from 'react';
import {  Tab, Menu, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import { IGalleryItem, IGalleryItemActions, IGalleryModel, IGalleryModelActions, IGalleryActions, IGallery} from '../../store/Gallery/Gallery';
import * as _ from "lodash";
import {ILocalizeActions} from "../../store/Localize";
import Gallery, {GalleryDrawingMode} from '../../containers/Gallery/Gallery';
import EnhancedButton from "../../components/EnhancedButton";
import { makeCancelable } from "../../utils/DataLoader";
import { publishedAction, IPublishedDesignActions, IGetterPublished } from "../../store/Gallery/Published";
import GalleryView from "../../components/Gallery/GalleryView";
import { PageContext, WDMSubConext } from "../../constants/enums";
import { IAuthentication, Authentication, IAuthenticationActions } from "../../utils/Authentication";
import {
    galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModel,
    IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { GalleryItemEventData } from "../../components/Gallery/GalleryItemComponent";
import HintBulbDialog from "../../components/HintBulbDialog";
import { servicesConfig } from "conf";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";

export interface GalleryBoxProps {
    //items?: IGalleryItem[];
    galleryModel?: IGalleryModel,
    onItemSelected?(item?: IGalleryItem, data?:GalleryItemEventData): void,
    onGallerySelected?(gallery?:IGallery):void,
    currentFolder?: string,
    localize?: ILocalizeActions,
    hideSubTabs?:boolean, //Only render one my-cloud related tab
    drawingMode?: GalleryDrawingMode,
    galleryFilter?(gallery: IGallery): boolean,
    galleryStyle?: any;
    authentication?: Authentication,
    galleryItemOperationModel?: GalleryItemOperationModel;
    selectedCategory?: IGallery;
    showSpecialFolders?: boolean;
    selectedItem?: IGalleryItem;
    modalDialogManager?: ModalDialogManager;
}

interface IGalleryItemState {
    loadingGalleries?: boolean;
    publicCloudGalleryItems?: _.Dictionary<IGalleryItem[]>;
    selectedCategory?: IGallery;
    observerId?: string[];
    selectedSubCategory: WDMSubConext;
    // todo: in the future, you need to refactor this "bad code" - create a store model for this
    myPublishItems?: _.Dictionary<IGalleryItem[]>;
    myUnpublishItems?: _.Dictionary<IGalleryItem[]>;
}


@inject('galleryModel', 'localize', "authentication", "galleryItemOperationModel", "modalDialogManager")
@observer
export default class GalleryBox extends React.Component<GalleryBoxProps, IGalleryItemState> {

    constructor(props: any) {
        super(props);
        this.state = {
            loadingGalleries: false,
            publicCloudGalleryItems: {},
            myPublishItems: {},
            myUnpublishItems: {},
            observerId: [],
            selectedSubCategory: WDMSubConext.None
        };
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, (typeof localStorage === "undefined" || !localStorage) ? "" : localStorage.getItem("YPUICulture")!);
    }

    private _isMounted: boolean = false;
    //private setMyPublish: boolean = false;
    //private setPublicCloud: boolean = false;

    private get galleries():IGallery[] {
        const { galleryModel } = this.props;

        if(!galleryModel) return [];

        if(this.props.galleryFilter)
            return galleryModel.galleries.filter((value) => this.props.galleryFilter!(value));

        return galleryModel.galleries;
    }

    public componentWillMount() {
    }

    public componentDidMount() {
        this._isMounted = true;

        const { galleryModel, galleryItemOperationModel } = this.props;
        if (galleryModel) {
            this.setState({ loadingGalleries: true });

            const self = this;
            (galleryModel as any as IGalleryModelActions).load().then(() => {
                if(self._isMounted)
                    self.setState({ loadingGalleries: false });

                if (self.galleries.length > 0) {
                    ((self.props.selectedCategory || self.galleries[0]) as any as IGalleryActions).load();
                    const selectedCategory = self.props.selectedCategory || self.galleries[0];
                    const newState: IGalleryItemState = {
                        selectedCategory
                    };

                    if (self._isMounted)
                        self.setState(newState);

                    if (self.isAnonymousUser && selectedCategory.isConsideredPublishedFlg !== "Yes")
                        self.onPublicCloudClick(selectedCategory!);
                    else
                        self.galleryClickHandler(selectedCategory!);

                    // init MyPublish & onMyUnPublishClick subcategory of seletected category items
                    if (!self.isAnonymousUser) {
                        self.onMyPublishClick(selectedCategory!, true);
                        self.onMyUnPublishClick(selectedCategory!, true);
                    }
                }
            }).catch((reason: any) => console.log('galleryModel load catch error:', reason));
        }

        // subscribe to events
        let observerId = storeActionObserver.registerStoreAction(galleryItemOperationModel, "doEvent",
            (storeArgs: any, designSpec: any) => {
                
                // clear old values for items
                if (this.state.selectedCategory) {
                    if (this.state.myPublishItems)
                        this.state.myPublishItems[this.state.selectedCategory.hash] = [];
                    if (this.state.publicCloudGalleryItems)
                        this.state.publicCloudGalleryItems[this.state.selectedCategory.hash] = [];
                    if (this.state.myUnpublishItems)
                        this.state.myUnpublishItems[this.state.selectedCategory.hash] = [];
                }

                // init MyPublish & onMyUnPublishClick subcategory of seletected category items
                if (!this.isAnonymousUser && this.state.selectedCategory) {
                    this.onMyPublishClick(this.state.selectedCategory, true);
                    this.onMyUnPublishClick(this.state.selectedCategory, true);
                }

                (this.state.selectedCategory as any as IGalleryActions).makeReloading();

                if (this.state.selectedCategory)
                    this.loadItems(this.state.selectedCategory, false, true);
                if (this._isMounted)
                    this.forceUpdate();
            });  

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    componentWillUpdate(nextProps:GalleryBoxProps, nextState:IGalleryItemState) {
        //console.log('gallery box will update', this.props, nextProps);
        //console.log(this.state, nextState);
        //this.trackDiff(this.props, nextProps);
        const currentGallery = this.props.selectedCategory ||
            (this.galleries && this.galleries.length > 0 ? this.galleries[0] : null);
        if (this.galleries.length > 0 && currentGallery && !currentGallery.isLoaded && !currentGallery.isLoading) {
            (currentGallery as any as IGalleryActions).load()!.then(() => {
                //console.log('currentGallery loaded:', currentGallery);
            });
        }
    }

    //trackDiff(o1: any, o2: any) {        
    //    for (let key in o1) {
    //        if (typeof o1[key] === "object") {
    //            this.trackDiff(o1[key], o2[key]);
    //        } else {
    //            if (o1[key] !== o2[key])
    //                console.log("Diff:", key, o1, o2);
    //        }
    //    }
    //}

    public componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    public componentWillReceiveProps(nextProps: GalleryBoxProps) {

        const selectedCategory = (nextProps.selectedCategory && this.galleries.indexOf(nextProps.selectedCategory) >= 0)
            ? nextProps.selectedCategory
            : (this.galleries && this.galleries.length > 0 ? this.galleries[0] : null);

        if (selectedCategory !== this.state.selectedCategory && (!this.state.selectedCategory || nextProps.selectedCategory)) {
            if(selectedCategory)
                this.galleryClickHandler(selectedCategory);
            this.assignState({
                selectedCategory
            });
        }
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: any) {
        this.setState(_.assign({}, this.state, newState));
    }

    private galleryClickHandler(gallery: IGallery) {       
        if (this.props.onItemSelected) {
            // Clear selected item
            this.props.onItemSelected();
        }    
        if (this.props.onGallerySelected) {
            this.props.onGallerySelected(gallery);
        }

        //const setPublicCloud = this.isAnonymousUser && gallery.isConsideredPublishedFlg !== "Yes";
        const canStateChecking = !this.isAnonymousUser && gallery.isConsideredPublishedFlg !== "Yes";

        if (!this.isAnonymousUser && this.state.selectedCategory) {
            this.onMyPublishClick(this.state.selectedCategory, true);
            this.onMyUnPublishClick(this.state.selectedCategory, true);
        }

        const newState: IGalleryItemState = { selectedCategory: gallery/*, setPublicCloud*//*, publicCloudGalleryItems: []*/ };
        if(this._isMounted)
            this.setState(newState);
        //this.loadItems(gallery, false, !setPublicCloud, newState);
        this.loadItems(gallery, false, canStateChecking, newState);
    }

    private loadItems(gallery: IGallery, force: boolean = false, canStateChecking?:boolean, newState?:IGalleryItemState) {
        let self = this;

        //const state = newState || this.state;

        const columnCount = (gallery.displayColumnCount) ? gallery.displayColumnCount : 2;
        const countLoadingItems = columnCount * servicesConfig.CountLoadingItems; // how many loading rows - take from config

        if (canStateChecking && this.state.selectedSubCategory === WDMSubConext.PublicCloud) {

            if (this.state.publicCloudGalleryItems &&
            (!this.state.publicCloudGalleryItems[gallery.hash] ||
                this.state.publicCloudGalleryItems[gallery.hash].length === 0)) {

                const requestData: IGetterPublished = {
                    onlyMember: false,
                    start: 0,
                    take: countLoadingItems
                };
                (publishedAction as any as IPublishedDesignActions)
                    .getPublishedItemsByCategory(gallery.hash, requestData)
                    .then((result) => {
                        if (self._isMounted) {
                            self.state.publicCloudGalleryItems![gallery.hash] = result;
                            self.forceUpdate();
                        }
                    });

            }
        }
        else if (canStateChecking && this.state.selectedSubCategory === WDMSubConext.MyPublish) {

            if (this.state.myPublishItems
                && (!this.state.myPublishItems[gallery.hash] ||this.state.myPublishItems[gallery.hash].length === 0)) {

                const requestData: IGetterPublished = {
                    onlyMember: true,
                    start: 0,
                    take: countLoadingItems
                };
                (publishedAction as any as IPublishedDesignActions)
                    .getPublishedItemsByCategory(gallery.hash, requestData)
                    .then((result) => {
                        if (self._isMounted) {
                            self.state.myPublishItems![gallery.hash] = result;
                            self.forceUpdate();
                        }
                    });
            }
        }
        else if (canStateChecking && this.state.selectedSubCategory === WDMSubConext.MyUnPublish) {

            if (this.state.myUnpublishItems
                && (!this.state.myUnpublishItems[gallery.hash] || this.state.myUnpublishItems[gallery.hash].length === 0))
                (publishedAction as any as IPublishedDesignActions).getUnpublishedItemsByCategory(gallery.hash, false, 0, countLoadingItems)
                    .then((result: any) => {
                        if (self._isMounted) {
                            self.state.myUnpublishItems![gallery.hash] = result.galleryItem;
                            self.forceUpdate();
                        }
                });
        }
        else {
            let loading = (gallery as any as IGalleryActions).load(force);
            if (loading) {
                loading.then(() => {
                    //this.setPublicCloud = false;
                    //this.setMyPublish = false;
                    if (self._isMounted)
                        this.setState({ selectedCategory: gallery, selectedSubCategory: WDMSubConext.MyCloud });
                });
            }
        }
    }

    private itemClickHandler(item: IGalleryItem, data?: GalleryItemEventData) {
        if (this.props.onItemSelected) {
            this.props.onItemSelected(item, data);
        }   

        this.loadItems(this.state.selectedCategory!);
    }

    private onMyCloudClick(gallery: IGallery) {
        //this.setState({ setPublicCloud: false, setMyPublish: false });
        //this.setState({ selectedCategory: gallery });
        //this.setPublicCloud = false;
        //this.setMyPublish = false;

        //const setPublicCloud = this.isAnonymousUser && gallery.isConsideredPublishedFlg !== "Yes";
        const canStateChecking = !this.isAnonymousUser && gallery.isConsideredPublishedFlg !== "Yes";

        const newState: IGalleryItemState = {
            selectedCategory: gallery,
            selectedSubCategory: WDMSubConext.MyCloud
        };
        this.setState(newState);

        //this.loadItems(gallery, false, !setPublicCloud, newState);
        this.loadItems(gallery, false, canStateChecking, newState);
    }

    private onPublicCloudClick(gallery: IGallery) {
        // if loaded before then not reloading
        if (this.state.publicCloudGalleryItems
            && Object.keys(this.state.publicCloudGalleryItems).length !== 0
            && this.state.publicCloudGalleryItems[gallery.hash]
            && this.state.publicCloudGalleryItems[gallery.hash].length !== 0) {

            //this.setPublicCloud = true;
            //this.setMyPublish = false;

            if (this._isMounted)
                this.setState({ selectedSubCategory: WDMSubConext.PublicCloud });
            // to fire event in GalleryItemComponent action to close it
            (publishedAction as any as IPublishedDesignActions).emptyEvent();

            return;
        }

        let self = this;   
        const columnCount = (gallery.displayColumnCount) ? gallery.displayColumnCount : 2;
        const countLoadingItems = columnCount * servicesConfig.ViewCountLoadingItems; // how many loading rows - take from config

        const requestData: IGetterPublished = {
            onlyMember: false,
            start: 0,
            take: countLoadingItems
        };
        (publishedAction as any as IPublishedDesignActions)
            .getPublishedItemsByCategory(gallery.hash, requestData)
            .then((result) => {
                //this.setPublicCloud = true;
                //this.setMyPublish = false;

                if (self._isMounted) {
                    self.state.publicCloudGalleryItems![gallery.hash] = result;
                    self.setState({ selectedSubCategory: WDMSubConext.PublicCloud });
                }
            });
    }

    private onMyPublishClick(gallery: IGallery, skipSetSubcategory?: boolean) {
        if (this.state.myPublishItems
            && Object.keys(this.state.myPublishItems).length !== 0
            && this.state.myPublishItems[gallery.hash]
            && this.state.myPublishItems[gallery.hash].length !== 0) {

            if (!skipSetSubcategory) {
                //this.setPublicCloud = false;
                //this.setMyPublish = true;

                if (this._isMounted)
                    this.setState({ selectedSubCategory: WDMSubConext.MyPublish });
            }
            // to fire event in GalleryItemComponent action to close it
            (publishedAction as any as IPublishedDesignActions).emptyEvent();

            return;
        }

        let self = this;
        const columnCount = (gallery.displayColumnCount) ? gallery.displayColumnCount : 2;
        const countLoadingItems = columnCount * servicesConfig.ViewCountLoadingItems; // how many loading rows - take from config
        const requestData: IGetterPublished = {
            onlyMember: true,
            start: 0,
            take: countLoadingItems
        };		
        (publishedAction as any as IPublishedDesignActions)
            .getPublishedItemsByCategory(gallery.hash, requestData)
            .then((result) => {
                if (!skipSetSubcategory) {
                    //this.setMyPublish = true;
                    //this.setPublicCloud = false;
                    if (self._isMounted)
                        self.setState({ selectedSubCategory: WDMSubConext.MyPublish });
                }

                if (self._isMounted) {
                    self.state.myPublishItems![gallery.hash] = result;
                    // if it is skipped, it is needed to forcing
                    self.forceUpdate();
                }
            });
    }

    private onMyUnPublishClick(gallery: IGallery, skipSetSubcategory?: boolean) {
        if (this.state.myUnpublishItems
            && Object.keys(this.state.myUnpublishItems).length !== 0
            && this.state.myUnpublishItems[gallery.hash]
            && this.state.myUnpublishItems[gallery.hash].length !== 0) {

            if (!skipSetSubcategory) {
                //this.setPublicCloud = false;
                //this.setMyPublish = true;

                if (this._isMounted)
                    this.setState({ selectedSubCategory: WDMSubConext.MyUnPublish });
            }
            // to fire event in GalleryItemComponent action to close it
            (publishedAction as any as IPublishedDesignActions).emptyEvent();

            return;
        }

        const { modalDialogManager } = this.props;
        const { translate, trn, translateTemplate } = this.props.localize!;

        let self = this;
        const columnCount = (gallery.displayColumnCount) ? gallery.displayColumnCount : 2;
        const countLoadingItems = columnCount * servicesConfig.ViewCountLoadingItems; // how many loading rows - take from config
        (publishedAction as any as IPublishedDesignActions)
            .getUnpublishedItemsByCategory(gallery.hash, false, 0, countLoadingItems)
            .then((result: any) => {
                if (!skipSetSubcategory) {
                    if (self._isMounted)
                        self.setState({ selectedSubCategory: WDMSubConext.MyUnPublish });
                }

                if (!result.success) {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        self.translate(result.errMsg));
                }


                if (self._isMounted) {
                    self.state.myUnpublishItems![gallery.hash] = result.galleryItem;
                    // if it is skipped, it is needed to forcing
                    self.forceUpdate();
                }
            }).catch((error: any) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error));
                Promise.reject(error);
            });
    }

    private doEventhandlerOtherComponent() {
        // catch event changing on other component
        const statusChangeEventActivator = (this.props.authentication! as any as IAuthentication).statusChangeEventActivator;
        if (statusChangeEventActivator) {
            (this.props.authentication! as any as IAuthenticationActions).setEventActivator("");
            if(this.state.selectedCategory)
                (this.state.selectedCategory as any as IGalleryActions).makeReloading();
            if (this.state.selectedCategory)
                this.loadItems(this.state.selectedCategory);
        }

        //const eventHandler = (galleryItemOperationModel as any as IGalleryItemOperationModel).eventHandler;
        //if (eventHandler) {
        //    (galleryItemOperationModel as any as IGalleryItemOperationModelActions).doEvent("");
        //    if (eventHandler !== "savetomycloud" ) {
        //        (this.state.selectedCategory as any as IGalleryActions).makeReloading();
        //        this.loadItems(this.state.selectedCategory!);
        //    }
        //}
    }

    private getLocalStorageParameter(name: string) {

        const value = (typeof localStorage === "undefined" || !localStorage) ? null : localStorage.getItem(name);
        return value === null ? "" : value;
    };

    //TODO: make this parameter accessible at model level
    public get isAnonymousUser() {
        const token = this.getLocalStorageParameter("token");
        const isInitiallyMember = this.getLocalStorageParameter("IsInitiallyMember").toLowerCase() === "true";
        return token.indexOf("anonymous") >= 0 || !isInitiallyMember;
    };

    private onChangeViewItems(self: any, items: IGalleryItem[], gallery: IGallery) {

        //const changePublicCloud = (self.setPublicCloud &&
        const changePublicCloud = (self.state.selectedSubCategory === WDMSubConext.PublicCloud &&
            self.state.publicCloudGalleryItems[gallery.hash] &&
            self.state.publicCloudGalleryItems[gallery.hash].length !== items.length);

        //const changeMyPublish = (self.setMyPublish &&
        const changeMyPublish = (self.state.selectedSubCategory === WDMSubConext.MyPublish &&
            self.state.myPublishItems[gallery.hash] &&
            self.state.myPublishItems[gallery.hash].length !== items.length);

        const changeMyUnpublish = (self.state.selectedSubCategory === WDMSubConext.MyUnPublish &&
            self.state.myUnpublishItems[gallery.hash] &&
            self.state.myUnpublishItems[gallery.hash].length !== items.length);

        if (changePublicCloud) 
            self.state.publicCloudGalleryItems[gallery.hash] = items;

        if (changeMyPublish)
            self.state.myPublishItems[gallery.hash] = items;

        if (changeMyUnpublish)
            self.state.myUnpublishItems[gallery.hash] = items;
    }

    public render() {
        this.doEventhandlerOtherComponent();

        const self = this;
        const { galleryModel, showSpecialFolders } = this.props;
        const { translate } = this.props.localize!;
        if (!galleryModel) {
            return null;
        }
       
        //Render all categories
        const panes: any = this.galleries.map((category) => {
            const categoryIcon = category.icon!.startsWith("icon-") ? category.icon : ("icon-" + category.icon);
            return {
                menuItem: <Menu.Item key={category.hash} onClick={() => self.galleryClickHandler(category)}>
                    {category.icon && <Icon className={categoryIcon}/>}
                    <div className="div-block">{category.name}</div>
                </Menu.Item>,                
                render: () => {

                    const columnCount = (category.displayColumnCount) ? category.displayColumnCount : 2;                    
                    let publicCloudPaneClassName = "my-gallery-tab omg view";
                    if (this.isAnonymousUser) publicCloudPaneClassName += " mbr";

                    const myPublishSubPane =
                        {
                            menuItem: <Menu.Item key="pub" onClick={() => self.onMyPublishClick(category)}>
                                          <Icon className='icon-YP1_book' />
                                          <span>{self.props.localize!.translate('tabs.my-publish')}</span>
                                      </Menu.Item>,
                            render: () => <Tab.Pane className='my-gallery-tab omg view'>
                                              <GalleryView
                                                  column={columnCount}
                                                  gallery={category}
                                                  parent={this}
                                                  onChangeItems={this.onChangeViewItems}
                                                  pageContext={PageContext.WDM}
                                                  wdmSubConext={WDMSubConext.MyPublish}
                                                  items={(self.state.myPublishItems && self.state.myPublishItems[category.hash])
                                                        ? self.state.myPublishItems[category.hash] : []} />
                                          </Tab.Pane>
                    };

                    const myUnPublishSubPane =
                    {
                        menuItem: <Menu.Item key="unpub" onClick={() => self.onMyUnPublishClick(category)}>
                                      <Icon className='icon-YP1_book' />
                                      <span>{self.props.localize!.translate('tabs.my-unpublish')}</span>
                                  </Menu.Item>,
                        render: () => <Tab.Pane className='my-gallery-tab omg view'>
                                          <GalleryView
                                              column={columnCount}
                                              gallery={category}
                                              parent={this}
                                              onChangeItems={this.onChangeViewItems}
                                              pageContext={PageContext.WDM}
                                              wdmSubConext={WDMSubConext.MyUnPublish}
                                items={(self.state.myUnpublishItems && self.state.myUnpublishItems[category.hash])
                                    ? self.state.myUnpublishItems[category.hash] : []} />
                                      </Tab.Pane>
                    };

                    const publicCloudSubPane = {
                        menuItem: <Menu.Item key="pub-cld" onClick={() => self.onPublicCloudClick(category)}>
                                      <Icon className='icon-YP1_public cloud'/>
                                      <span>{self.props.localize!.translate('tabs.public-cloud')}</span>
                                  </Menu.Item>,
                        render: () => <Tab.Pane className={publicCloudPaneClassName}>
                                          <GalleryView
                                              column={columnCount}
                                              gallery={category}
                                              parent={this}
                                              onChangeItems={this.onChangeViewItems}
                                              pageContext={PageContext.WDM}
                                              wdmSubConext={WDMSubConext.PublicCloud}
                                              items={(self.state.publicCloudGalleryItems && self.state.publicCloudGalleryItems[category.hash])
                                                    ? self.state.publicCloudGalleryItems[category.hash] : []} />
                                      </Tab.Pane>
                    };

                    const myCloudPanes = [//MyCloud tab, next should be 'shared', 'my public cloud', 'public cloud'
                        {
                            menuItem: <Menu.Item key={category.hash} onClick={() => self.onMyCloudClick(category)}>
                                          {category.icon && <Icon className="icon-YP1_mycloud" />}
                                          <span>{self.props.localize!.translate('tabs.my-cloud')}</span>
                                      </Menu.Item>,
                            render: (galleryClassName?: string) => <Tab.Pane className='my-gallery-tab omg'>
                                                                       <Gallery gallery={category} drawingMode={self.props.drawingMode}
                                                                                pageContextVal={PageContext.WDM}
                                                                                wdmSubConextVal={WDMSubConext.MyCloud}
                                                                                className={typeof galleryClassName === "string" ? galleryClassName : ""}
                                                                                selectedItem={this.props.selectedItem}
                                                                                onItemSelected={(item, data) => self.itemClickHandler(item, data)} column={columnCount} />
                                                                   </Tab.Pane>
                        }
                        // Temporary hide 'Share' tab
                        //{
                        //    menuItem: <Menu.Item key="share" onClick={() => self.setState({ setPublicCloud: false, setMyPublish: false })}>
                        //                  <Icon className='icon-YP1_shared cloud' />
                        //                  <span>{self.props.localize!.translate('tabs.share')}</span>
                        //    </Menu.Item>,
                        //    render: () => null
                        //},    
                    ];

                    if (this.isAnonymousUser && category.isConsideredPublishedFlg === "Yes")
                        return myCloudPanes[0].render("wdm-single-gallery");

                    //Only render a public cloud item for anonymous user
                    if (this.isAnonymousUser ||
                        (category.canPublishFlg !== "Yes" && category.isConsideredPublishedFlg !== "Yes")) {
                        //Last item 
                        return publicCloudSubPane.render();
                    }

                    if (category.canPublishFlg !== "Yes" && category.isConsideredPublishedFlg === "Yes")
                        return myCloudPanes[0].render("wdm-single-gallery");

                    let subPanes = (category.canSaveToMyCloudFlg                            
                        ? myCloudPanes : []);

                    // show/hide subPanes
                    if (self.state.myPublishItems &&
                        self.state.myPublishItems[category.hash] &&
                        self.state.myPublishItems[category.hash].length !== 0) {
                        subPanes.push(myPublishSubPane);
                    }
                    if (self.state.myUnpublishItems &&
                        self.state.myUnpublishItems[category.hash] &&
                        self.state.myUnpublishItems[category.hash].length !== 0) {
                        subPanes.push(myUnPublishSubPane);
                    }

                    subPanes.push(publicCloudSubPane);

                    return this.props.hideSubTabs
                        ? <Gallery gallery={category} drawingMode={self.props.drawingMode} galleryStyle={this.props.galleryStyle}
                                    showSpecialFolders={showSpecialFolders}
                                    className="wdm-single-gallery" column={columnCount} 
                                    pageContextVal={PageContext.MyCloud}
                                    selectedItem={this.props.selectedItem}
                                    onItemSelected={(item, data) => self.itemClickHandler(item, data)} />
                        : <Tab menu={{className: 'attached tabular mini icon labeled my-gallery-tabs', vertical: true}} panes={subPanes} />;
                }
            }
        });

        const category = this.state.selectedCategory;
        const activeIndex = category ? this.galleries.indexOf(category) : 0;

        let categoryTabsClassName = "attached tabular mini icon labeled main-tab";
        if (!this.isAnonymousUser) {
            categoryTabsClassName += " mbr";
        }

        return <div className='main-gallery-bar'>
            <Dimmer.Dimmable blurring dimmed={this.state.loadingGalleries}>
                       <Dimmer active={this.state.loadingGalleries}>
                           <Loader>
                               {this.translate('galleryBox.signinText').toString()}
                           </Loader>
                       </Dimmer>
                <Tab panes={panes} menu={{ className: categoryTabsClassName }} activeIndex={activeIndex}>
                </Tab>
                {this.isAnonymousUser && <HintBulbDialog className="wdm-hint2 anonymous"/>}
            </Dimmer.Dimmable>
               </div>;
    }
}
