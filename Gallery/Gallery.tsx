import * as React from 'react';
import { Header, Loader, Button, List, Dimmer } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { IPaneState,
    GalleryModel, IGalleryItem, IGallery, IGalleryItemActions,
    IGalleryActions, IGalleryElementActions, IGalleryContainerActions
} from "../../store/Gallery/Gallery";
import EnhancedButton from "../../components/EnhancedButton";
import { IWITDoc } from '../../store/WITDoc';
import { ILocalizeActions } from '../../store/Localize';
import * as $ from "jquery";
import * as _ from "lodash";
import GalleryFolder from '../../components/Gallery/GalleryFolder';
import {memberCommon} from "../../store/model/Member";
import { publishedConfig, graphicConfig } from "conf";
import { GalleryItemEventData } from "../../components/Gallery/GalleryItemComponent";
import { isAlive } from "mobx-state-tree";
import { ModalDialogManagerEntry, ModalDialogManager, ModalDialogButtons } from "../../store/ModalDialog/ModalDialogManager";
import { PageContext, WDMSubConext } from "../../constants/enums";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent";

export enum GalleryDrawingMode {
    All = "all", //Draw folders and content
    FoldersOnly = "folders only", //Only draw folders
    ContentOnly = "content  only" //Only draw content
}

export interface GalleryProps {
    //items?: IGalleryItem[];
    gallery?: IGallery,
    onItemSelected?(item: IGalleryItem, data?: GalleryItemEventData): void,
    onItemLoaded?(item: IGalleryItem): void,
    currentFolder?: string,
    drawingMode?: GalleryDrawingMode,
    showSpecialFolders?:boolean;

    //Todo: comment it out (test only)
    //witdoc?: IWITDoc,
    galleryStyle?: any,
    localize?: ILocalizeActions;
    modalDialogManager?:ModalDialogManager,
    className?: string,
    column: number,
    pageContextVal?: PageContext;
    wdmSubConextVal?: WDMSubConext;
    selectedItem?: IGalleryItem;
    galleryItemOperationModel?: GalleryItemOperationModel;
}

export interface GalleryState {
    isError?: boolean,
    message?: string,
    selectedFolder?: IGalleryItem,
    isFolderCreating?: boolean,
    isPreselected?: boolean;
    observerId?: string[];
}

@inject(/*"witdoc",*/ "localize", "modalDialogManager", "galleryItemOperationModel")
@observer
export default class Gallery extends React.Component<GalleryProps, GalleryState> {

    private fileUpload: HTMLInputElement | null = null;
    private selectedFolder:IGalleryItem | undefined;
    private uploadFolder: IGalleryItem | undefined;
    private _isMounted: boolean = false;

    constructor(props:GalleryProps) {
        super(props);
        this.state = { observerId: []};
    }

    public componentWillMount() {
    }

    public componentDidMount() {
        this._isMounted = true;
        // const { galleryModel } = this.props;
        //if (galleryModel && galleryModel.folders) {
        //    galleryModel.loadDefaultFolders();
        //}
        // subscribe to events
        let observerId = storeActionObserver.registerStoreAction(this.props.galleryItemOperationModel, "doEvent",
            (storeArgs: any, designSpec: any) => {
                if (this._isMounted)
                    this.setState({ selectedFolder: undefined });
            });

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    public componentWillReceiveProps(nextProps: GalleryProps) {
        if (this.props.currentFolder !== nextProps.currentFolder) {
            $("div.gallery > div.masonry div.gallery-item > img").attr("src", "");
        }

        if (this.props.gallery !== nextProps.gallery) {
            this.assignState({isError:false});
        }

        if (nextProps.selectedItem && this.props.selectedItem !== nextProps.selectedItem) {
            this.itemSelectedHandler(nextProps.selectedItem, undefined, true);
        }
    }

    public componentWillUnmount() {
        //console.log('gallery component will unmount');
        this._isMounted = false;
        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    private itemLoadedHandler(galleryItem: IGalleryItem) {
        if (this.props.onItemLoaded) this.props.onItemLoaded(galleryItem);
    }

    private itemSelectedHandler(galleryItem: IGalleryItem, data?: { id?: string }, isPreselected?: boolean) {
        const { gallery } = this.props;
        if (gallery) {


            if (this.props.drawingMode === GalleryDrawingMode.FoldersOnly && galleryItem.isOpened) {
                gallery.items.forEach((item) => {
                    if (item !== galleryItem) {
                        (item as any as IGalleryItemActions).setIsOpened(false, true);
                    }
                });
            }

            const newState:GalleryState = { selectedFolder: galleryItem };
            this.assignState({ selectedFolder: galleryItem });
            newState.isPreselected = isPreselected || false;
            this.assignState(newState);
            if (this.props.onItemSelected) {                
                this.props.onItemSelected(galleryItem, data);
            }
        }
    }

    private onUploadGraphic(selectedFolder: IGalleryItem) {
        console.log('onupload');
        if (this.fileUpload) {
            this.fileUpload.value = "";
            this.fileUpload.click();
            this.uploadFolder = selectedFolder;
        }
    }

    private onUploadSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const { translateTemplate } = this.props.localize!;
        if (e.target.files &&
            graphicConfig.maxUploadedFilesCount &&
            e.target.files.length > graphicConfig.maxUploadedFilesCount) {
            const { modalDialogManager } = this.props;
            if (modalDialogManager) {
                const entry: ModalDialogManagerEntry = {
                    dialogProps: {
                        icon: "warning sign",
                        header: translateTemplate("uploadGraphicButton.dlgMaxUploadedFiles.header"),
                        content: translateTemplate("uploadGraphicButton.dlgMaxUploadedFiles.content",
                            e.target.files.length,
                            graphicConfig.maxUploadedFilesCount),
                        size: "tiny",
                        type: ModalDialogButtons.Okay,
                        autoClose: true
                    }
                };
                modalDialogManager.addDialog(entry);
            }
            return;
        }

        (this.uploadFolder as any as IGalleryElementActions).uploadFiles(e.target.files!);
    }

    private validateImageFiles(files: FileList | null) {
        const allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
        if (!files) return;
        for (let i=0; i<files.length; i++) {
            
        }
    }

    private closeDimmer() {
        this.assignState({ isError: false });
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: GalleryState) {
        this.setState(_.assign({}, this.state, newState));
    }

    private addFolderBtnClick() {
        const { gallery } = this.props;
        if (gallery) {
            this.assignState({ isFolderCreating: true });
            (gallery as any as IGalleryContainerActions).createFolder(undefined, true).then((folder) => {
                this.assignState({ isFolderCreating: false });

                //Scroll to the folder
                const elem = $(`#gallery-list [id='folder-${folder.hash!.replace('/', '-')}']`)[0];                
                
                if (elem && gallery) {
                    const gallery = $(elem as any as Element).parents(".gallery-view-scroller")[0];
                    if (gallery) {
                        (gallery as any as Element).scrollTop = (elem as any as HTMLElement).offsetTop;
                        $(elem as any as Element).find('input').focus().select();
                    }
                }
                //$(elem).parents(".gallery-view-scroller")[0].scrollTop = elem.offsetTop
            }).catch((error: any) => {
                this.assignState({ isFolderCreating: false });
            });
        }
    }

    public render() {
        const { gallery } = this.props;
        const { isError, message } = this.state;
        const { translate } = this.props.localize!;
        if (!gallery) return null;

        if (gallery.isLoading)
            return <Loader active/>;

        if (!memberCommon.emailAddr && gallery.items.length === 0) {
            return null;
        }

        const canOperate = memberCommon.emailAddr &&
            (gallery.employeeOnlyFlg !== "Yes" || memberCommon.employeeMemberFlg === "Yes");

        const canUpload = gallery.canUpload && canOperate;

        return <Dimmer.Dimmable style={this.props.galleryStyle} className={this.props.className || ""}>
                <div className="wdm-gallery-ctl">
                {canOperate && <EnhancedButton basic compact
                    className="wdm-btn-simple wdm-style-4 no-border btn-add-folder"
                    ypIcon="YP2_folder add"
                                popup={translate('wdmGallery.ttlAddNewFolder')}
                                loading={this.state.isFolderCreating}
                                disabled={this.state.isFolderCreating}
                                onClick={() => this.addFolderBtnClick()}/> } 
                </div>
                   <input type="file" className="wdm-gal-file-upload"
                          multiple={true} accept=".jpg,.jpeg,.png,.svg"
                          onChange={(e: any) => this.onUploadSelected(e)}
                          ref={(fileUpload: any) => this.fileUpload = fileUpload}/>
                <div id="gallery-view-scroller" className="gallery-view-scroller">
                   <List selection id="gallery-list" className="wdm-gallery-list">
                    {gallery.items.map((item, index) => {
                        // ignore showing the system folder to a member
                        if (item.name === publishedConfig.AutoPublish.FolderName)
                            return "";
                        if (this.state.selectedFolder && !isAlive(this.state.selectedFolder)) return null;
                        if (item && !isAlive(item)) return null;

                        //User can't operate by system special folders such as __AutoSave
                        //Normally such folder names are starting from double-underscore "__"
                        const isSpecialFolder: boolean = item.hash ? item.hash.indexOf("__") >= 0 : false;

                        if (isSpecialFolder && this.props.showSpecialFolders === false) return null;

                        const canOperateFolder:boolean = canOperate ? !isSpecialFolder : false;
                        const canUploadFolder:boolean = canUpload ? !isSpecialFolder : false;

                        return <GalleryFolder key={index} folder={item} column={this.props.column} gallery={this.props.gallery}
                                    canUpload={canUploadFolder} canDelete={canOperateFolder} canRename={canOperateFolder}
                                    isOpened={this.props.drawingMode === GalleryDrawingMode.FoldersOnly
                                        ? this.state.selectedFolder && item.hash === this.state.selectedFolder.hash
                                        : item.isOpened}
                                    prevPaneState={this.props.prevPaneState} 
                                    pageContextVal={this.props.pageContextVal} wdmSubConextVal={this.props.wdmSubConextVal}
                                    onUploadGraphic={(folder) => this.onUploadGraphic(folder)}
                                    skipContentRendering={this.props.drawingMode && this.props.drawingMode !== GalleryDrawingMode.All}
                                    onItemLoaded={(item) => this.itemLoadedHandler(item)}
                                    onItemSelected={(item, data) => this.itemSelectedHandler(item, data)}
                                    isPreselected={this.state.selectedFolder === item && this.state.isPreselected}/>;
                    }, this)}
                </List>
                </div>
            <Dimmer active={isError} inverted className="wdm-valign-top" onClickOutside={() => this.closeDimmer()}>
                <Header as="h4">{this.state.message}</Header>
                <Button basic color="red" onClick={() => this.closeDimmer()}>OK</Button>
            </Dimmer>
        </Dimmer.Dimmable>;
    }
}