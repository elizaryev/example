import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { isAlive, IStateTreeNode } from "mobx-state-tree";
import { Button, Modal, Input, InputOnChangeData,  DropdownItemProps, Grid,  Message, Icon
} from 'semantic-ui-react';
import { ILocalizeActions } from "../../store/Localize";
import * as _ from 'lodash';
import "../../css/SaveToMyCloudDialog.less";
import { GalleryDrawingMode } from "../../containers/Gallery/Gallery";
import GalleryBox from "../../containers/Gallery/GalleryBox";
import GalleryView from "../../components/Gallery/GalleryView";
import {
    IGalleryItem, IGalleryItemActions, IGallery, GalleryItemType, IGalleryActions, IGalleryModel, GalleryType
} from "../../store/Gallery/Gallery";
import EnhancedButton from "../../components/EnhancedButton";
import { Deferred } from "../../store/facebook-class"
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";
import { LoginModal } from "../../components/LoginModal"
import { DesignSpec } from "../../store/model/DesignSpec";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";
import { ModalDialogButtons, ModalDialogResult, ModalDialogManager, ModalDialogManagerEntry } from "../../store/ModalDialog/ModalDialogManager";
import { publishedConfig } from "conf";
import { PageContext, WDMSubConext, SaveToMyCloudModeType } from "../../constants/enums";
import { publishedAction, IPublishedDesignActions } from "../../store/Gallery/Published";
import { MyCloudObjectType } from "../../store/MyCloudSaver";

interface IMoveToDialogState {
    showSaveToMyCloudWindow?: boolean,
    itemName?: string,
    selectedItem?: IGalleryItem,
    selectedGallery?: IGallery,
    isFolderCreating?: boolean,
    errorMessage?: string,
    showLoginModal?: boolean;
    showSuccessMessage?: boolean;
    isSaveAsDesign?: boolean;
    movingProcess?: boolean;
    renderType?: MyCloudObjectType;
}

interface IMoveToDialogProps {
    localize?: ILocalizeActions,    
    galleryModel?: IGalleryModel,
    onCloseDialog?: () => void,
    onOpenDialog?: () => void,
    authentication?: Authentication,
    open?: boolean,
    designSpec?:DesignSpec,
    galleryItemOperationModel?: GalleryItemOperationModel,
    modalDialogManager?: ModalDialogManager;
    movingItem?: IGalleryItem;
    disabledTriggerBtn?: boolean;
    renderType?: MyCloudObjectType;
}

@inject( "localize", "galleryModel", "authentication", "designSpec", "galleryItemOperationModel", "modalDialogManager")
@observer
export class MoveToDialog extends React.Component<IMoveToDialogProps, IMoveToDialogState> {

    private checkedToken: Deferred = new Deferred();
    private modalDialogId: string = "";
    private _isMounted: boolean = false;
    private selectedFolders: any = {};

    constructor(props: IMoveToDialogProps) {
        super(props);

        this.state = {
            showSaveToMyCloudWindow: false,
            itemName: "",
            showLoginModal: false,
            movingProcess: false,
            renderType: MyCloudObjectType.Design,
        };
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    componentWillReceiveProps(nextProps: IMoveToDialogProps) {
        if (!this.props.open && nextProps.open) {
            if (nextProps.renderType) this.assignState({ renderType: nextProps.renderType });
            this.clearResultsAndFolders();
            this.openSaveToMyCloudDialogHandler(true, nextProps);
        }        
    }

    componentWillMount() {
        const { movingItem } = this.props;
        if (!movingItem) 
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

    private onItemSelected(item?: IGalleryItem) {
        if (item && item.type === GalleryItemType.Folder && this.state.selectedGallery)
            this.selectedFolders[this.state.selectedGallery.hash] = item;
        
        this.assignState({ selectedItem: item });
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: IMoveToDialogState) {
        if (!newState.errorMessage) newState.errorMessage = "";
        this.setState(_.assign({}, this.state, newState));        
    }
    
    private onMoveToSuccessDialogResult(result: number) {
        console.log("result move to", result);
        this.props.modalDialogManager.removeDialog(this.modalDialogId);
        this.closeDialogHandler();
        return true;
    }

    private clearResultsAndFolders() {
        this.selectedFolders = {};
    }

    private showSuccessDialog() {
        const { modalDialogManager } = this.props;
        const { trn } = this.props.localize!;

        const title = trn("dlgSaveToMyCloud.msgBoxSuccessMoved.title");
        const content = trn("dlgSaveToMyCloud.msgBoxSuccessMoved.content");

        if (modalDialogManager) {          
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "icon-YP2_fblike",
                    header: title,
                    content: content,
                    size: "tiny",
                    type: ModalDialogButtons.Okay,
                    onResult: (result) => this.onMoveToSuccessDialogResult(result)
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
                    onResult: (result) => this.onMoveToSuccessDialogResult(result)
                }
            };
            this.modalDialogId = modalDialogManager.addDialog(entry);
        }
    }
    
    private openSaveToMyCloudDialogHandler(isOpen: boolean = true, nextProps?: IMoveToDialogProps) {

        if (isOpen) {
            // if The move mode then ignore checking token
            this.onMovingOpenDialog();
            return;
        } else {
            this.clearResultsAndFolders();
            
            if (this.props.onCloseDialog) {
                this.props.onCloseDialog();
            }

            if (this._isMounted)
                this.setState({ showSaveToMyCloudWindow: false });
            return;
            
        }
    }

    private onMovingOpenDialog() {
        this.clearResultsAndFolders();

        const { renderType, designSpec, galleryModel, movingItem, onOpenDialog } = this.props;

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

    private closeDialogHandler() {
        this.openSaveToMyCloudDialogHandler(false);
    }

    onItemNameChangedHandler(data: InputOnChangeData) {
        //TODO:Put validation here
        this.assignState({ itemName:data.value }); 
    }

    private renderSaveButton() {
        const { translate, trn } = this.props.localize!;
        const { disabledTriggerBtn } = this.props;

        //return <Popup trigger={<Button icon="cloud download" onClick={(e) => this.openSaveToMyCloudDialogHandler()} />} content={translate('ttlBtnSaveToMyCloud')} />;
        return <EnhancedButton size="large" basic
                              ypIcon="icon-YP3_move horizontally"
                              disabled={disabledTriggerBtn}
                              className="wdm-btn large white"
                               popup={translate('galleryItemMyCloudBlock.moveTitle')}
                               labelPosition="left"
                               onClick={(e) => this.openSaveToMyCloudDialogHandler()}>
                   {trn("galleryItemMyCloudBlock.moveTitle")}
               </EnhancedButton>;
    }

    private renderLayers() {
        //TODO:add layers (render a page)
        return null;
    }

    galleryFilterFuncFactory(renderType?:MyCloudObjectType, freeStyleDesign?:boolean) {
        //if(renderType === MyCloudObjectType.Design) return (gallery: IGallery) => gallery.type === GalleryItemType.Design;
        //return (gallery: IGallery) => gallery.type === GalleryItemType.Element;
       
        
        return (gallery: IGallery) => {
            //if (gallery.isInMyCloud || gallery.type === GalleryType.Image) return false;
            if (gallery.canCreateByWdmFlg !== "Yes") return false;
            if (gallery.type !== GalleryType.Design &&
                gallery.type !== GalleryType.Background) return false;
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

        const newState: IMoveToDialogState = { selectedItem: this.getSelectedGalleryItem(gallery.hash), selectedGallery: gallery };        

        const { galleryModel } = this.props;
        const renderType = (gallery.type === GalleryType.Design)
            ? MyCloudObjectType.Design
            : (gallery.type === GalleryType.Background ? MyCloudObjectType.Canvas : MyCloudObjectType.Elements);
        if (this.state.renderType !== renderType) {
            newState.renderType = renderType;
          }

         if (newState.selectedItem === undefined && gallery.isLoading) {
            const self = this;
            (gallery as any as IGalleryActions).load()!.then((gallery) => {
                self.assignState({ selectedItem: self.getSelectedGalleryItem(gallery.hash) });
            });
        }
       
        this.assignState(newState);
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

        const { designSpec, movingItem, galleryModel, disabledTriggerBtn } = this.props;
        const { trn, translate } = this.props.localize!;
        const { selectedGallery, selectedItem, movingProcess } = this.state;
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
            (!movingItem || !galleryModel);  // check required moving item and galleryModel

        return <div className="div-inline-block">
                   <Modal id="stmc-dialog" trigger={this.renderSaveButton()} size="large" open={this.props.open ||
                       this.state.showSaveToMyCloudWindow}
                          className="wdm"
                          closeOnDimmerClick={false} closeIcon={true} style={inlineStyle.modal}
                          onClose={(e) => this.closeDialogHandler()}>
                       <Modal.Header>
                           <Icon className="icon-YP3_move horizontally"/>
                           {translate("galleryItemMyCloudBlock.moveTitle")}
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
                            </Grid>                           
                       </Modal.Content>
                       <Modal.Actions>
                           <Button secondary className="wdm-btn large"
                                   content={translate("dlgSaveToMyCloud.lblBtnCancel")}
                                   onClick={(e) => this.openSaveToMyCloudDialogHandler(false)}/>
                           <Button primary icon
                                   className="wdm-btn large"
                                   disabled={disableActionBtn}
                                   loading={movingProcess}
                                   onClick={(e) => this.moveItemInOtherFolderAction()}>
                            <Icon className="icon-YP3_move horizontally" />
                                {translate("galleryItemMyCloudBlock.moveTitle")}
                            </Button>                           
                       </Modal.Actions>
                   </Modal>
               </div>;

    }
}