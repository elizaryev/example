import * as React from 'react';
import { TextEditor  } from "../../components/TextEditor";
import { SearchBox, ISearchItem } from "../../components/SearchBox";
import {Icon,Modal,Grid,Segment,Label,Input,Button,Loader,Dropdown,InputOnChangeData,Card, List,
    Image, ButtonProps, Transition, Header, Popup } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import {  } from "../../store/Gallery/Publishing";
import { ITagItem, ITagItemList, TagItemList, ITagItemDesignListActions, ITagItemListActions } from "../../store/model/TagItem";
import { PublishingProcess, IPublishingData, IPublishingActions } from "../../store/Gallery/Publishing";
import { ILocalizeActions } from '../../store/Localize';
import { ICategoryList, CategoryList, ICategoryListActions } from "../../store/model/Category";
import { ISubcategoryDropDown, ISubCategoryList, SubCategoryList, ISubCategoryListActions,
    ISubCategory, SubCategory, ISubCategoryActions } from "../../store/model/SubCategory";
import { GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup";
import * as _ from 'lodash';
import { SubcategoryModal } from "../../components/Gallery/SubcategoryModal";
import { makeCancelable } from "../../utils/DataLoader";
import { Deferred } from "../../store/facebook-class"
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";
import { LoginModal } from "../../components/LoginModal"
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";
import { publishedConfig } from "conf";
import FlippingBook from "../../components/Gallery/FlippingBook";
import { DesignSpec } from "../../store/model/DesignSpec";

interface IPublishingProps {
    publishingProcess?: PublishingProcess;
    publishingData: IPublishingData;
    imgContent: string[];
    btnTitle: string;
    handleShowPopupOperation?(self: GalleryItemOperationPopup): void;
    handleHidePopupOperation?(self: GalleryItemOperationPopup): void;
    operationPopup: GalleryItemOperationPopup;
    onPublishingDataChanged?(self: GalleryItemOperationPopup, publishingData: IPublishingData): void;
    onCloseParent?(self: GalleryItemOperationPopup): void;
    onPublish?(parent: any): void;
    localize?: ILocalizeActions;
    employee?: boolean;
    authentication?: Authentication;
    galleryItemOperationModel?: GalleryItemOperationModel;
    tagItemList?: TagItemList;
    parent: any;
    disabledMyCloudBlock?: boolean;
    modalDialogManager?: ModalDialogManager;
    isMultiPage?: boolean;
    mpDesignFolderHash?: string;
    designSpec?: DesignSpec
}

interface IPublishingState {
    showPublishingWindow: boolean,
    keywords: TagItemList,
    searchTagItemList: TagItemList,
    tagValue: string, //todo: delete?
    priceValue: number,
    htmlTextEditor: string;
    category: string;
    subCategory: ISubcategoryDropDown[];
    subCategoryId: string;
    categoryLoaded: boolean;
    subCategoryLoaded: boolean;
    categoryList: ICategoryList;
    subcategoryList: ISubCategoryList;
    categoryActive: _.Dictionary<boolean>;
    subcategoryDropdownText: string;
    lblErrSubCategory: boolean;
    disablePublishBtn: boolean;
    showLoginModal: boolean;
    savingSpinner: boolean;
    lblErrorPublish: boolean;
    observerId?: string[];
}

@inject("localize", "publishingProcess", "authentication", "galleryItemOperationModel", "tagItemList", "modalDialogManager", "designSpec")                  
@observer
export class Publishing extends React.Component<IPublishingProps, IPublishingState> {

    constructor(props: any) {
        super(props);
        this.state = {
            tagValue: "",
            priceValue: 0,
            htmlTextEditor: "",
            showPublishingWindow: false,
            keywords: TagItemList.create({ items: [] }),
            searchTagItemList: TagItemList.create({ items: [] }),
            category: "",
            subCategoryId: "",
            subCategory: [],
            categoryLoaded: false,
            subCategoryLoaded: true,
            categoryList: (CategoryList.create() as any as ICategoryList),
            subcategoryList: (SubCategoryList.create() as any as ISubCategoryList),
            categoryActive: {},
            subcategoryDropdownText: "Select sub category",
            lblErrSubCategory: false,
            disablePublishBtn: true,
            showLoginModal: false,
            savingSpinner: false,
            lblErrorPublish: false,
            observerId: []
    };
    }

    private _isMounted: boolean = false;
    private checkedToken: Deferred = new Deferred();

    private searchItemList: ISearchItem[] = [];
    private isLoadedSearchItemList: boolean = false;

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {
        this.setState({
            priceValue: this.props.publishingData.price,
            htmlTextEditor: this.props.publishingData.description,
            category: this.props.publishingData.category,
            subcategoryDropdownText: this.translate('publishing.subcategoryDropdownText').toString()
        });
        
        this.props.publishingData.keywords.map((kw) => {
            if (kw) {
                (this.state.keywords as any as ITagItemDesignListActions).addTagItem(kw);
            }
        });

        this.initSearchItemList();
        this.initCategory();
    }

    componentDidMount() {
        this._isMounted = true;

        // subscribe to events
        let observerId = storeActionObserver.registerStoreAction(this.props.galleryItemOperationModel, "setTagPromise",
            (storeArgs: any, designSpec: any) => {
                if ((galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise) {
                    (galleryItemOperationModel as any as IGalleryItemOperationModel).loadTagPromise!.then(() => {
                        this.initSearchItemList();
                        //if (this._isMounted)
                        //    this.forceUpdate();
                    });
                }
        });

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    public componentWillUpdate(nextProps: any, nextState: any) {
        nextProps.publishingData.keywords.map((kw: string) => {
            if (kw) {
                (nextState.keywords as any as ITagItemDesignListActions).addTagItem(kw);
            }
        });
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
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
                            self.setState({ showLoginModal: isAnonymous });
                            self.checkedToken.resolve();
                        });
                } else {
                    self.setState({ showLoginModal: true });
                    self.checkedToken.resolve();
                }
            });
        } else {
            this.setState({ showLoginModal: true });
            this.checkedToken.resolve();
        }
    }

    private initCategory() {
        // load category, set category and load sub category for this category and current member
        let self = this;
        (this.state.categoryList as any as ICategoryListActions).load()!.then(() => {
            if ((self.state.categoryList as any as ICategoryList).items.length > 0) {
                
                if (self._isMounted) {

                    self.setState({ categoryLoaded: true });
                    (self.state.categoryList as any as ICategoryList).items.map((category) => {
                        if (category.wdmCategoryId === self.props.publishingData.category) {
                            self.state.categoryActive[category.abbrText] = true;

                            self.initSubcategory(category.wdmCategoryId, self);
                        }
                        else
                            self.state.categoryActive[category.abbrText] = false;
                    });   
                }
            }
        });
    }

    private initSubcategory(wdmCategoryId: string, self: Publishing) {
        (self.state.subcategoryList as any as ISubCategoryListActions).load(wdmCategoryId)!
            .then(() => {

                if (self.state.subcategoryList.items.length === 0) {
                    self.createAutomaticPublishingSubcategory(self, wdmCategoryId, self.initSubcategory);
                    return;
                }

                self.setSubCategory(self);
            });
    }

    private setSubCategory(self: any) {
        let subcategoryDropDown: ISubcategoryDropDown[] = [];
        self.state.subcategoryList.items.map((item: ISubCategory) => {
            subcategoryDropDown.push(({
                key: item.wdmSubCategoryKey.toString(),
                text: item.abbrText,
                value: item.wdmSubCategoryId
            } as ISubcategoryDropDown));
        });

        if (self._isMounted)
            self.setState({
                subCategoryLoaded: false,
                subCategory: subcategoryDropDown,
                subcategoryDropdownText: subcategoryDropDown.length > 0
                    ? subcategoryDropDown[0].value
                    : self.translate('publishing.subcategoryDropdownText').toString(),
                subCategoryId: subcategoryDropDown.length > 0 ? subcategoryDropDown[0].value : ""
                , disablePublishBtn: (subcategoryDropDown.length > 0) ? false : true
            });
    }

    private createAutomaticPublishingSubcategory(self: any, wdmCategoryId: string, callBackAction?: ((wdmCategoryId: string, self:any) => void)) {

        const { modalDialogManager } = self.props;
        const { translate, translateTemplate } = self.props.localize!;

        let subcategory: ISubCategory = ((SubCategory.create({
            wdmCategoryId: wdmCategoryId,
            wdmSubCategoryId: publishedConfig.AutoPublish.SubCategoryName,
            abbrText: publishedConfig.AutoPublish.SubCategoryName,
            description: publishedConfig.AutoPublish.SubCategoryName,
            iconClass: "icon-YP2_eye"
        })) as any);

        (subcategory as any as ISubCategoryActions).save().then((result) => {
            if (!result || result < 0) {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", translate("publishing.errMsgCantCreateSubCategory")));
            } else {
                if (callBackAction)
                    callBackAction(wdmCategoryId, self);
            }
        });
    }

    private handleClickSave() {

        //todo: check token on the anonymous type of a member

        if (this.state.subCategoryId === "") {
            this.setState({ lblErrSubCategory: true });
            return;
        }

        const { designSpec } = this.props;
        let optnDtlKey: number | undefined = undefined;

        if (designSpec && designSpec.optnModel && designSpec.optnModel.prodTypeOptnDtl) {
            designSpec.optnModel.prodTypeOptnDtl.forEach((optnDtl, index) => {
                if (index === 0) {
                    optnDtlKey = optnDtl.prodTypeOptnDtlKey;
                }
            });
        }

        (this.props.publishingData as any as IPublishingActions)
            .setSavingData(this.state.htmlTextEditor,
                this.state.priceValue,
                this.state.category,
                this.state.subCategoryId,
                this.props.publishingData.keywords,
                optnDtlKey);

        let self = this;
        this.setState({ savingSpinner: true });

        this.props.publishingProcess!
            .save(this.props.publishingData, this.props.employee!)
            .then((result) => {

                self.setState({ savingSpinner: false });

                if (!result) {
                    self.setState({ lblErrorPublish: true });
                    return;
                }

                // success
                self.setState({ lblErrorPublish: false });
                self.openPublishingDialogHandler(false);
                if (self.props.onCloseParent)
                    self.props.onCloseParent(self.props.operationPopup);

                (this.props.tagItemList as any as ITagItemListActions).setReloadingState();

                let tagItemList = (this.props.tagItemList as any as ITagItemListActions).loadTagItemList();
                (galleryItemOperationModel as any as IGalleryItemOperationModelActions).setTagPromise(
                    tagItemList);

                if (self.props.onPublish) {
                    self.props.onPublish(self.props.parent);
                }
            });
    }

    private anchorPriceChangeHandler(data: InputOnChangeData) {
        if (!data.value) {
            this.setState({ priceValue: 0 });
            return;
        }

        //let price = parseInt(data.value);
        this.setState({ priceValue: isNaN(parseInt(data.value)) ? 0 : parseInt(data.value) });

        (this.props.publishingData as any as IPublishingActions).setCost(isNaN(parseInt(data.value)) ? 0 : parseInt(data.value));
    }

    private anchorTagKeyPressHandler(data: InputOnChangeData) {
        let tag = data.value;
        if (tag.length <= 0) {
            this.setState({ tagValue: "" });
            return;
        }

        this.setState({ tagValue: data.value });
    }

    private anchorTextEditorChangeHandler(html: string) {
        this.setState({ htmlTextEditor: html });
        (this.props.publishingData as any as IPublishingActions).setArtDescription(html);
    }

    private anchorLabelClickHandler(data: object, value: string) {
        (this.state.keywords as any as ITagItemDesignListActions).removeItem(value);
        this.updateParentKeywords();
    }

    private onPutTagToTagsWindow = (value?: string) => {
        if (value) {
            (this.state.keywords as any as ITagItemDesignListActions).addTagItem(value);
            this.updateParentKeywords();
        }
    };

    private updateParentKeywords() {
        let changedKeywords: string[] = [];
        (this.state.keywords as any as ITagItemList).items.map((item) => {
            changedKeywords.push((item as any as ITagItem).text);
        });
        (this.props.publishingData as any as IPublishingActions).setKeywords(changedKeywords);
    }

    private initSearchItemList() {
        try {
            let til = (this.props.tagItemList as any as ITagItemList);
            if (til.isLoaded) {
                this.searchItemList.splice(0, til.items.length);
                til.items.map(item => (
                    this.searchItemList.push({
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
            console.log(error);
        }
    }

    handleChangeSubcategory = (e: any, data: any) => {
        this.setState({
            subCategoryId: data.value,
            subcategoryDropdownText: data.value,
            lblErrSubCategory: false,
            disablePublishBtn: false
        });
    }

    handleClickCategory =
        (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
            const btnData: any = (data.children as Array<string>)[1];
            const key = btnData.props.children;
            this.state.categoryList.items.map((category) => {

                if (category.abbrText === key) {
                    this.state.categoryActive[category.abbrText] = true;
                    this.setState({ category: category.wdmCategoryId, disablePublishBtn: true });

                    //reload sub category
                    this.setState({ subCategoryLoaded: true, subCategory: [] });
                    let self = this;
                    (this.state.subcategoryList as any as ISubCategoryListActions).load(category.wdmCategoryId)!
                        .then(() => {

                            let subcategoryDropDown: ISubcategoryDropDown[] = [];
                            self.state.subcategoryList.items.map((item) => {
                                subcategoryDropDown.push(({
                                    key: item.wdmSubCategoryKey.toString(),
                                    text: item.abbrText,
                                    value: item.wdmSubCategoryId
                                } as ISubcategoryDropDown));
                            });

                            self.setState({
                                subCategoryLoaded: false,
                                subCategory: subcategoryDropDown,
                                subcategoryDropdownText: this.translate('publishing.subcategoryDropdownText').toString()
                            });
                           
                        });
                }
                else
                    this.state.categoryActive[category.abbrText] = false;
            });
        };

    private renderCategories() {
        return <List horizontal={true}>
                   {this.state.categoryList.items.map((category, index) => {

                    if (!this.validateCategoryByGalleryType(category.wdmCategoryId))
                           return "";

                       return <List.Item key={index} className="gallery-item-publish-list-category">
                                  <Button key={category.wdmCategoryId}
                                          className={`wdm-style-2 ${this.state.categoryActive[category.abbrText] === true ? "active" : "" }` }
                                          onClick={(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) =>
                                              this.handleClickCategory(event, data)}>
                                      <Icon className={category.iconClass} size="large"/>
                                      <div className="text">{category.abbrText}</div>
                                  </Button>
                              </List.Item>;
                   })}
               </List>;
    }

    private validateCategoryByGalleryType(wdmCategoryId: string) {

        let valid: boolean = false;
        const category = this.props.publishingData.category;
        switch (category) {
            case "image":
                valid = (wdmCategoryId === category);
                break;
            case "elements":
                valid = (wdmCategoryId === category) || (wdmCategoryId === "text");
                break;
            case "text":
                valid = (wdmCategoryId === category) || (wdmCategoryId === "elements");
                break;
            case "mpdesign":
            case "design":
                valid = (this.props.imgContent.length > 1)
                    ? (wdmCategoryId === category) // (1 side)
                    : (wdmCategoryId === category) || (wdmCategoryId === "elements") || (wdmCategoryId === "text"); // (2 side)
                break;
            default :
                break;
        }

        return valid;
    }
    
    private openPublishingDialogHandler(isOpen: boolean = true) {
        if (isOpen) {
            this.checkToken();
        }

        const self = this;
        this.checkedToken.promise.then(() => {
            if (self._isMounted)
                self.setState({
                    showPublishingWindow: isOpen,
                    keywords: TagItemList.create({ items: [] }),
                    lblErrSubCategory: false
                });

            if (isOpen && self.props.handleHidePopupOperation) {
                self.props.handleHidePopupOperation(self.props.operationPopup);
            }
            if (!isOpen && self.props.handleShowPopupOperation) {
                self.props.handleShowPopupOperation(self.props.operationPopup);
            }
        });
    }
    
    private renderTriggerElement() {
        return <Button size="tiny" className="wdm-btn large white" disabled={this.props.disabledMyCloudBlock}
                       onClick={(event, data) => { this.openPublishingDialogHandler(true); }}>
                   <List horizontal>
                       <List.Item>
                            <Icon className="icon-YP1_book"/>
                       </List.Item>
                       <List.Item className="gallery-item-publish-btns-title">
                           {this.props.btnTitle}
                       </List.Item>
                   </List>
               </Button>;
    }

    private onPublishingDataChanged() {
        if (this.props.onPublishingDataChanged)
            this.props.onPublishingDataChanged(this.props.operationPopup, this.props.publishingData);
    }

    private onCloseClick() {
        
        this.setState({ savingSpinner: false });

        this.onPublishingDataChanged();
        this.openPublishingDialogHandler(false);
    }

    private onCancelSiginPublish(self: any) {
        self.showLoginModal = false;
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);
        self.forceUpdate();
    }

    public onSigninPublish(self: any) {
        self.showLoginModal = false;
        (self.props.authentication! as any as IAuthenticationActions).setSingleLoginModalOpening(false);

        self.checkValidToken();
        self.forceUpdate();
    }

    private onClickFlippingBook(event: any) {
        //if (this.props.onClickFlippingBook) {
        //    this.props.onClickFlippingBook(event, this.props.galleryItem.hash);
        //}
    }
    
    public render() {

        // if not sign in then need login
        if (this.state.showLoginModal) {
            return <div>
                       <LoginModal showTrigger={false}
                                   showWindowExternal={this.state.showLoginModal}
                                   onCancelLoginModal={this.onCancelSiginPublish}
                                   parentCallback={this.onSigninPublish} parent={this} />
                   </div>;
        }

        const isDoubleSide = this.props.imgContent.length === 2;

        // ---------------- component -----------------------------------
        return <Modal trigger={this.renderTriggerElement()} open={this.state.showPublishingWindow}
                      closeOnDimmerClick={true} closeIcon={true} className="gic pbl"
                      onClose={(e) => this.onCloseClick()}>
                   <Modal.Header><Icon className="icon-YP1_book"/>
                        {this.translate('publishing.publishingText').toString()}
                    </Modal.Header>
                   <Modal.Content>
                       <Grid>
                           <Grid.Row>
                               <Grid.Column className="gic pbl left" >
                                   <Card className="gic pbl">
                                       <Card.Content>
                                           <Card.Header className="title">
                                               {this.props.publishingData.itemName}
                                           </Card.Header>

                                            <List horizontal className="gic pbl img-content">
                                        {this.props.isMultiPage && this.props.isMultiPage
                                            ? <FlippingBook designFolderHash={this.props.mpDesignFolderHash} bookSize={"Med"}
                                                            onClickHandler={(event: any) => this.onClickFlippingBook(event)} />
                                            : this.props.imgContent.map((img, index) => {
                                                    return <List.Item  key={index} className={`gic pbl clm-img ${!isDoubleSide ? "os":""}`}>
                                                                <Image src={img} className="img-cnt" />  
                                                          </List.Item>;
                                               })}
                                           </List>
                                       </Card.Content>
                                   </Card>
                               </Grid.Column>
                               <Grid.Column className="gic pbl right">
                                   <Grid className="gic pbl">
                                       <Grid.Row className="no-top-padding">
                                           <Grid.Column>
                                               <Transition visible={this.state.lblErrorPublish} duration={1} animation={"fade"}>
                                                   <Label basic color="red">
                                                       {this.translate('publishing.errorPublishText').toString()}
                                                   </Label>
                                               </Transition>
                                           </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-top-padding">
                                           <Grid.Column width={3} className="title">
                                               {this.translate('publishing.categoryTitle').toString()}:
                                            </Grid.Column>
                                           <Grid.Column width={13}>
                                                {this.state.categoryLoaded
                                                ? this.renderCategories()
                                                : <Loader active />}
                                            </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-top-padding sub-ct">
                                           <Grid.Column width={3} className="title">
                                               {this.translate('publishing.subCategoryTitle').toString()}:
                                            </Grid.Column>
                                            <Grid.Column width={13}>
                                                <List className="horizontal gic pbl sub-ct">
                                                    <List.Item>
                                                        <Header className="wdm">
                                                            <Icon className="grey icon-YP1_public cloud" />
                                                            <Header.Content>
                                                                <Dropdown
                                                                    className=""
                                                                    placeholder={this.translate('publishing.subcategoryDropdownText').toString()}
                                                                    selection search
                                                                    loading={this.state.subCategoryLoaded}
                                                                    onChange={this.handleChangeSubcategory}
                                                                    options={this.state.subCategory}
                                                                    text={this.state.subcategoryDropdownText}
                                                                />
                                                            </Header.Content>
                                                        </Header>
                                                    </List.Item>
                                                    <List.Item className="btn">
                                                        {!this.state.subCategoryLoaded && this.props.employee
                                                            ? <SubcategoryModal wdmCategoryId={this.state.category} onSubcategorySaved={this.initSubcategory} parent={this} />
                                                            : <div></div>}
                                                    </List.Item>
                                                </List>
                                                <Transition visible={this.state.lblErrSubCategory} duration={1} animation={"fade"}>
                                                    <Label basic color="red" pointing="left">
                                                        {this.translate('publishing.setSubcategoryTitle').toString()}
                                                    </Label>
                                                </Transition>
                                            </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-top-padding">
                                           <Grid.Column width={3} className="title">
                                               {this.translate('publishing.priceTitle').toString()}:
                                            </Grid.Column>
                                           <Grid.Column width={13}>
                                               <Input icon='dollar' iconPosition='left' placeholder='0'
                                                     className="wdm"
                                                     value={this.props.publishingData.price}
                                                      onChange={(event: React.SyntheticEvent<HTMLElement>,
                                                      data: InputOnChangeData) => this.anchorPriceChangeHandler(data)}/>
                                           </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-top-padding">
                                           <Grid.Column width={3} className="title">
                                                {this.translate('publishing.descriptionTitle').toString()}:
                                            </Grid.Column>
                                           <Grid.Column width={13}>
                                               <TextEditor initHtmlText={this.props.publishingData.description} 
                                                           onChange={(html: string) => this.anchorTextEditorChangeHandler(html)}/>
                                           </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-padding">
                                           <Grid.Column width={3}  className="title"></Grid.Column>
                                           <Grid.Column width={13}>
                                                <List horizontal className="gic pbl search-list">
                                                    <List.Item>
                                                        <SearchBox source={this.searchItemList}
                                                                   onEnterKeyPress={this.onPutTagToTagsWindow}
                                                                   onResultSelect={this.onPutTagToTagsWindow}
                                                                   placeholder={this.translate('publishing.placeholderKeyword').toString()} />
                                                    </List.Item>
                                                    <List.Item className="popup">
                                                        <Popup trigger={<span><Icon className="icon-YP2_question" /></span>}>
                                                            <div className="wdm-style-3">
                                                                {this.translate('publishing.tagInfoPopup').toString()}
                                                            </div>
                                                        </Popup>
                                                    </List.Item>
                                                    <List.Item className="info">
                                                        {this.translate('publishing.searchInfoText').toString()}
                                                    </List.Item>
                                                </List>
                                           </Grid.Column>
                                       </Grid.Row>
                                       <Grid.Row className="mini-padding">
                                            <Grid.Column width={3} className="title">
                                               {this.translate('publishing.keywordsTitle').toString()}:
                                            </Grid.Column>
                                           <Grid.Column width={13}>
                                               <Segment className="keywords pbl">
                                                   {this.props.publishingData.keywords.map(
                                                       keyword => (
                                                           <Label key={keyword} value={keyword}
                                                               className="wdm-tag"
                                                               onClick={(event: React.SyntheticEvent<HTMLElement>,
                                                                            data: object) => this
                                                                        .anchorLabelClickHandler(data, keyword)}>
                                                               <List horizontal>
                                                                   <List.Item>
                                                                       <div className="text">{keyword}</div>
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
                                                        {this.props.publishingData.keywords.length}
                                                    </List.Item>
                                                </List>
                                           </Grid.Column>
                                       </Grid.Row>
                                   </Grid>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Modal.Content>
                   <Modal.Actions>
                       <Button onClick={(e) => this.onCloseClick()} className="d-gray-btn-large"
                               disabled={this.state.savingSpinner}
                            content={this.translate('publishing.cancelTitle').toString()} />
                        <Button disabled={this.state.disablePublishBtn || this.state.savingSpinner}  loading={this.state.savingSpinner}
                            onClick={(e) => this.handleClickSave()} className="green-btn-large"
                            content={this.translate('publishing.saveTitle').toString()}/>
                   </Modal.Actions>
               </Modal>;
    }
}
