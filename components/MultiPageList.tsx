import * as $ from "jquery";
import { inject, observer } from "mobx-react";
import { getSnapshot } from "mobx-state-tree";
import * as React from "react";
import { List } from "semantic-ui-react";
import "../css/MultiPageList.less";
import {
    DesignPage,
    DesignSpec,
    IDesignPage,
    IUndoRedoQueueActions,
    IWITDoc,
    IWITDocActions,
    ICanvasActions,
    IMultiPageInsertDeleteResult,
    ModalDialogManager,
    ModalDialogManagerEntry,
    ModalDialogResult,
    ModalDialogButtons,
    MultiPageDesignSpec,
    MultiPagePageType,
    MultiPageOperation,
    MyCloudObjectType,
    MyCloudSaverCode
} from "../store";
import { ILocalizeActions } from "../store/Localize";
import { DesignSpecUtil } from "../utils";
import { MultiPageDeletePagesControl } from "./MultiPageDeletePagesControl";
import { MultiPageListItem } from "./MultiPageListItem";
import { MultiPageMovePagesControl } from "./MultiPageMovePagesControl";
import { MultiPageCopyPageControl } from "./MultiPageCopyPageControl";
import CrossPageCoverConfirmationDialog from "./CrossPageCoverConfirmationDialog";


export enum MultiPageListMode {
    Normal = "normal",
    Move = "move",
    Copy = "copy",
    Delete = "delete",
    Insert = "insert",
    Reload = "reload"
}

interface MultiPageListProps {
    witdoc?:IWITDoc;
    undoredo?: IUndoRedoQueueActions;
    localize?: ILocalizeActions,
    multiPageDesignSpec?: MultiPageDesignSpec,
    emptyThumbImageWidth?: number,
    emptyThumbImageHeight?:number,
    //onBeforeChange?: (oldCanvas:ICanvas, newCanvas:ICanvas) => void;
    //onChange?: (canvas: ICanvas) => void;
    //designSpec?:DesignSpec
    onItemClick?: (page: IDesignPage) => void,

    modalDialogManager?: ModalDialogManager,
    designSpec?: DesignSpec,
}

interface MultiPageListState {
    //isOpened?: boolean;
    preloaderId?:string;
    mode?: MultiPageListMode,
    selectedPages?: string[],
    preSelectedPageHash?: string,
    dlgId?: string,
    showCrossPageVerifyCoverConfirmation?:boolean
    //canvas?:ICanvas
}

/**
 * Component for managing F/B sides of single page design
 */
@inject("witdoc", "localize", "multiPageDesignSpec", "designSpec", "modalDialogManager", "undoredo")
@observer
export default class MultiPageList extends React.Component<MultiPageListProps, MultiPageListState> {

    rootDiv: HTMLDivElement | null = null;
    multiPageInsertDeleteResult: IMultiPageInsertDeleteResult | null = null;
    requireCrossPageCoverPageConfirmation: boolean | undefined;

constructor(props: MultiPageListProps) {
        super(props);
        this.state = {mode:MultiPageListMode.Normal, selectedPages:[]};
    }

    onItemClick(page: IDesignPage, scrollItemIntoView?:boolean) {
        const { multiPageDesignSpec, modalDialogManager, designSpec } = this.props;
        const { trn } = this.props.localize!;

        if(this.props.onItemClick)
            this.props.onItemClick(page);

        if (this.state.preloaderId)
            modalDialogManager!.removeDialog(this.state.preloaderId);

        if (this.state.mode === MultiPageListMode.Normal) {

            if (this.requireCrossPageCoverPageConfirmation &&
                multiPageDesignSpec!.activePageHash === multiPageDesignSpec!.pages[0].hash) {
                this.assignState({ showCrossPageVerifyCoverConfirmation: true, preSelectedPageHash: page.hash });
                return;
            }

            if (multiPageDesignSpec && !multiPageDesignSpec.isLoading) {
                //Show global preloader
                this.setState({
                    preloaderId: modalDialogManager.preloader(trn("multiPageList.msgLoadNextPage")),
                    showCrossPageVerifyCoverConfirmation: false
                });
                const docContent = (this.props.undoredo && this.props.undoredo.isChanged())
                    ? MyCloudSaverCode.getDocJSONData(this.props.witdoc!,
                        this.props.witdoc!.name,
                        MyCloudObjectType.Design)
                    : undefined;

                multiPageDesignSpec
                    .setActivePage(page.hash, this.props.witdoc!.uid, docContent)
                    .then((newPageDesignSpec) => {
                        console.log("select page: ");


                        (this.props.witdoc as any as IWITDocActions).assignNewDoc(newPageDesignSpec.designModel);
                        
                        if (this.props.designSpec) {
                            this.hidePreloader();
                            //const page = this.props.witdoc!.selectedPage! as any as IPageActions;
                            const self = this;
                            this.props.designSpec.setValues(newPageDesignSpec);
                            this.props.designSpec.load(true).then((value) => {
                                const sd = value.sizeDimensionModel;
                                if (sd) {
                                    DesignSpecUtil.UpdateDocumentSpecInfoBySizeDimensionModel(this.props.witdoc!,
                                        sd,
                                        value);
                                }

                                DesignSpecUtil.UpdateVariableSpecInfo(multiPageDesignSpec,
                                    this.props.designSpec!,
                                    this.props.witdoc! as any);
                                this.scrollItemIntoView(page.hash);
                                if(this.props.undoredo)
                                    this.props.undoredo.reset();
                            });
                        }

                    })
                    .catch((error) => {
                        console.log("error loading page", error);
                        this.hidePreloader();
                        if(modalDialogManager)
                            modalDialogManager.error(trn("multiPageList.msgLoadPageErrorTitle"),
                                trn("multiPageList.msgLoadPageErrorMessage") + " " + error);
                    });
            }

        } else {
            //Selection mode
            if (multiPageDesignSpec) {
                //pre-selected page should aways be selected
                if (this.state.mode === MultiPageListMode.Move) {
                    if (!multiPageDesignSpec.isPreSelectionMoved()) {
                        const phash = page.hash;
                        const idx1 =
                            multiPageDesignSpec!.pages.findIndex(page => page.hash === this.state.preSelectedPageHash);
                        const idx2 = multiPageDesignSpec!.pages.findIndex(page => page.hash === phash);
                        const maxIdx = Math.max(idx1, idx2);
                        const minIdx = Math.min(idx1, idx2);
                        let selectedPages: string[] = [];
                        multiPageDesignSpec!.pages.forEach((page, index) => {
                            const cond = index >= minIdx && index <= maxIdx;
                            (page as any as DesignPage).setValue("preSelected", cond);
                            if (cond)
                                selectedPages.push(page.hash);
                        });
                        this.assignState({ selectedPages });
                    }
                } else if (this.state.mode === MultiPageListMode.Delete || this.state.mode === MultiPageListMode.Copy) {
                    if(page.type === MultiPagePageType.Page) {
                        (page as any as DesignPage).setValue("preSelected", !page.preSelected);
                        const selectedPages: string[] = multiPageDesignSpec.pages.filter(page => page.preSelected)
                            .map(page => page.hash);
                        this.assignState({ selectedPages });
                    }
                }
            } 
        }
        
    }

    hidePreloader() {
        const { modalDialogManager } = this.props;
        const { preloaderId } = this.state;
        if (modalDialogManager) {
            if (preloaderId)
                modalDialogManager.removeDialog(preloaderId);
            this.assignState({ preloaderId: "" });
        }
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    public assignState(newState: MultiPageListState) {
        this.setState(_.assign({}, this.state, newState));
    }

    pageControlClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, mode: MultiPageListMode, hash?: string) {
        const { multiPageDesignSpec, modalDialogManager } = this.props;        
        const {trn} = this.props.localize!;

        if (multiPageDesignSpec && modalDialogManager) {
            if (mode === MultiPageListMode.Insert) {
                this.setState({ preloaderId: modalDialogManager.preloader(trn("multiPageList.msgInsertingPages")) });
                multiPageDesignSpec.insertPages(hash!).then(value => this.onInsertDeletePageResult(value))
                    .catch(error => this.showError(error, MultiPageOperation.Insert));
            } else if (mode === MultiPageListMode.Reload) {
                this.showClearConfirmation({ preSelectedPageHash: hash });
            } else {
                multiPageDesignSpec.preSelectPages([hash!]);
                this.assignState({ mode: mode, selectedPages: hash ? [hash] : [], preSelectedPageHash: hash });
            }
        }
    }

    onInsertDeletePageResult(value: IMultiPageInsertDeleteResult) {
        const { multiPageDesignSpec, modalDialogManager } = this.props;
        const { translate } = this.props.localize!;
        if (multiPageDesignSpec) {

            if (this.state.preloaderId)
                modalDialogManager!.removeDialog(this.state.preloaderId);

            if (modalDialogManager && value.variableSpecInfoModel) {
                //if(multiPageDesignSpec.pages[0].hash === multiPageDesignSpec.activePageHash)
                this.multiPageInsertDeleteResult = value;
                const isCoverActive = multiPageDesignSpec.pages[0].hash ===
                    multiPageDesignSpec.activePageHash;
                const msg = <div>
                                {translate("multiPageList.dlgCrossPageCoverChanged.message")}
                                {!isCoverActive &&
                                    translate("multiPageList.dlgCrossPageCoverChanged.messageRedirect")}
                            </div>;
                const entry: ModalDialogManagerEntry = {
                    dialogProps: {
                        icon: "warning sign",
                        header: translate("multiPageList.dlgCrossPageCoverChanged.title"),
                        content: msg,
                        size: "tiny",
                        type: ModalDialogButtons.Okay,
                        onResult: (result) => this.onDlgCrossPageCoverChangedResult(result)
                        autoClose: true
                    }
                };
                const dlgId = modalDialogManager.addDialog(entry);
                this.assignState({ dlgId, preloaderId:undefined });
                return;
            }

            if (value.selectedHashAfterDelete) {
                this.onItemClick(multiPageDesignSpec.pages.find(p => p.hash === value.selectedHashAfterDelete)!);
                return;
            }           
        }
    }

    onDlgCrossPageCoverConfirmationResult(result: number) {
        if (result === ModalDialogResult.Okay) {
            const { multiPageDesignSpec } = this.props;
            this.requireCrossPageCoverPageConfirmation = false;
            this.onItemClick(multiPageDesignSpec!.pages.find(p => p.hash === this.state.preSelectedPageHash)!);
            return true;
        }
        this.assignState({ showCrossPageVerifyCoverConfirmation:false});
        return true;
    }

    onDlgCrossPageCoverChangedResult(result: number) {
        const { multiPageDesignSpec, designSpec, witdoc, modalDialogManager } = this.props;

        if (multiPageDesignSpec) {
            const isCoverActive = multiPageDesignSpec.pages[0].hash ===
                multiPageDesignSpec.activePageHash;
            multiPageDesignSpec.setValue("variableSpecInfo", this.multiPageInsertDeleteResult!.variableSpecInfoModel);
            this.requireCrossPageCoverPageConfirmation = true;

            if (isCoverActive) {
                //Need to change variable spec info right away
                DesignSpecUtil.UpdateVariableSpecInfo(multiPageDesignSpec, designSpec!, witdoc!);
            } else {
                //Need to load up cover page and then change a variable spec info
                //multiPageDesignSpec.setValue("variableSpecInfo", this.multiPageInsertDeleteResult!.variableSpecInfoModel);

                this.onItemClick(multiPageDesignSpec.pages[0], true);
            }
        }

        if (modalDialogManager && this.state.dlgId)
            modalDialogManager.removeDialog(this.state.dlgId);

        return true;
    }

    movePageAction(action: string) {
        const { multiPageDesignSpec } = this.props;
        const { selectedPages } = this.state;
        const itemHash = selectedPages
            ? (action === "up" ? selectedPages[0] : selectedPages[selectedPages.length - 1])
            : "";
        multiPageDesignSpec!.movePreSelectedPages(action === "up");
        window.setTimeout(() => {
                this.scrollItemIntoView(itemHash);
            },
            50);
    }

    selectPagesAction(action: string) {
        const { multiPageDesignSpec } = this.props;
        const { mode, preSelectedPageHash } = this.state;
        if (multiPageDesignSpec) {
            multiPageDesignSpec.preSelectAllPages(action === "deselect all");


            if (mode === MultiPageListMode.Copy) {
                const preSelectedPage = multiPageDesignSpec.pages.find(page => page.hash === preSelectedPageHash);
                if (preSelectedPage)
                    preSelectedPage.setValue("preSelected", true);
            }

            const selectedPages: string[] = action === "deselect all"
                ? []
                : multiPageDesignSpec.pages.filter(page => page.type === MultiPagePageType.Page).map(page => page.hash);

            if (mode === MultiPageListMode.Copy && selectedPages.length === 0)
                selectedPages.push(preSelectedPageHash!);

            this.assignState({selectedPages});
        }
    }

    movePagesControlClose() {
        const { multiPageDesignSpec } = this.props;
        const { selectedPages } = this.state;
        if (multiPageDesignSpec) {
            const isMoved = multiPageDesignSpec.isPreSelectionMoved();
            const firstHash = selectedPages ? selectedPages[0] : "";
            multiPageDesignSpec.restorePreSelectedItems();
            this.assignState({ mode: MultiPageListMode.Normal });
            //const elem = $(this.rootDiv as any).find("#li_" + firstHash)[0] as any as Element;
            //if (elem)
            //    elem.scrollIntoView();
            this.scrollItemIntoView(multiPageDesignSpec.pages.find(page => page.activeHash !== undefined)!.hash!);
        }
    }


    scrollItemIntoView(hash: string) {
        if (hash.indexOf("/") >= 0)
            hash = hash.substr(hash.lastIndexOf("/") + 1);

        hash = '#li_' + hash;
        const listNode = $(this.rootDiv as any);

        const viewPortHeight = $("body").height() || 0;
        const scrollerNode: any = listNode.parent()[0];
        const listOffset = listNode.parent().offset();
        const listScrollTop: number = scrollerNode.scrollTop;
        const itemNode = listNode.find(hash);
        const itemOffset = itemNode.offset();
        const itemHeight = itemNode.height() || 0;

        const visibleAreaHeight = viewPortHeight - listOffset!.top;

        if (itemOffset!.top < listOffset!.top)
            scrollerNode.scrollTop = listScrollTop + (itemOffset!.top - listOffset!.top);
        else if (itemOffset!.top + itemHeight > viewPortHeight)
            scrollerNode.scrollTop = listScrollTop + itemOffset!.top + itemHeight - visibleAreaHeight - listOffset!.top;
    }


    showDeleteConfirmation() {
        const { modalDialogManager, multiPageDesignSpec } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        if (modalDialogManager && multiPageDesignSpec) {
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "question circle outline",
                    header: translate("multiPageList.dlgDeletePagesConfirm.title"),
                    content: translateTemplate("multiPageList.dlgDeletePagesConfirm.message", multiPageDesignSpec.getPreSelectedPageCount()),
                    size: "tiny",
                    type: ModalDialogButtons.Yes | ModalDialogButtons.No,
                    onResult:(result) => this.onDeleteConfirmDialogResult(result)
                    
                }
            };
            const dlgId = modalDialogManager.addDialog(entry);
            this.assignState({dlgId:dlgId});
        }
    }

    onDeleteConfirmDialogResult(result?: number) {
        const { modalDialogManager } = this.props;
        if (modalDialogManager) {

            if (this.state.dlgId)
                modalDialogManager.removeDialog(this.state.dlgId);

            if (result === ModalDialogResult.Yes) {
                this.acceptAction(MultiPageListMode.Delete);
            }            
        }        
        return true;
    }

    showClearConfirmation(stateToAssign?:MultiPageListState) {
        const { modalDialogManager, multiPageDesignSpec } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        if (modalDialogManager && multiPageDesignSpec) {
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "question circle outline",
                    header: translate("multiPageList.dlgClearPageConfirm.title"),
                    content: translate("multiPageList.dlgClearPageConfirm.message"),
                    size: "tiny",
                    type: ModalDialogButtons.Yes | ModalDialogButtons.No,
                    onResult: (result) => this.onClearConfirmDialogResult(result)

                }
            };
            const dlgId = modalDialogManager.addDialog(entry);
            if (!stateToAssign) stateToAssign = {};
            stateToAssign.dlgId = dlgId;
            this.assignState(stateToAssign);
        }
    }

    onClearConfirmDialogResult(result?: number) {
        const { modalDialogManager } = this.props;
        if (modalDialogManager) {

            if (this.state.dlgId)
                modalDialogManager.removeDialog(this.state.dlgId);

            if (result === ModalDialogResult.Yes)
                this.acceptAction(MultiPageListMode.Reload);
        }
        return true;
    }

    showCopyConfirmation() {
        const { modalDialogManager, multiPageDesignSpec } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        if (modalDialogManager && multiPageDesignSpec) {
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "question circle outline",
                    header: translate("multiPageList.dlgCopyPageConfirm.title"),
                    content: translate("multiPageList.dlgCopyPageConfirm.message"),
                    size: "tiny",
                    type: ModalDialogButtons.Yes | ModalDialogButtons.No,
                    onResult: (result) => this.onCopyConfirmDialogResult(result)

                }
            };
            const dlgId = modalDialogManager.addDialog(entry);
            this.assignState({ dlgId: dlgId });
        }
    }

    onCopyConfirmDialogResult(result?: number) {
        const { modalDialogManager } = this.props;
        if (modalDialogManager) {

            if (this.state.dlgId)
                modalDialogManager.removeDialog(this.state.dlgId);

            if (result === ModalDialogResult.Yes) {
                this.acceptAction(MultiPageListMode.Copy);
            }
        }
        return true;
    }

    acceptAction(action: MultiPageListMode) {
        const { multiPageDesignSpec, modalDialogManager, undoredo, witdoc } = this.props;
        const { trn } = this.props.localize!;
        const { preSelectedPageHash } = this.state;
        let preloaderId: string | undefined = undefined;

        if(multiPageDesignSpec) {
            if (action === MultiPageListMode.Move) {
                multiPageDesignSpec.applyMoveAction().then(value => {

                }).catch(error => this.showError(error, MultiPageOperation.Move));
            }
            else if (action === MultiPageListMode.Delete) {
                preloaderId = modalDialogManager!.preloader(trn("multiPageList.msgDeletingPages"));
                multiPageDesignSpec.applyDeleteAction().then(value => this.onInsertDeletePageResult(value))
                    .catch(error => this.showError(error, MultiPageOperation.Delete));
            } else if (action === MultiPageListMode.Copy) {
                preloaderId = modalDialogManager!.preloader(trn("multiPageList.msgCopyPageContent"));
                const isSourcePreSelectedAndChanged = preSelectedPageHash! === multiPageDesignSpec.activePageHash && undoredo!.isChanged();
                this.setState({ preloaderId: preloaderId });
                multiPageDesignSpec.applyCopyAction(preSelectedPageHash!,
                    isSourcePreSelectedAndChanged ? getSnapshot(witdoc!) : null).then(value => {                        
                        if (preloaderId) {
                            modalDialogManager!.removeDialog(preloaderId);
                            this.assignState({ preloaderId: undefined });
                        }

                        if (value && value.currentPageModel) {
                            const witDoc = this.props.witdoc;
                            const witDocSnapshot: IWITDoc = value.currentPageModel.designModel;
                            const self = this;
                            if (witDoc && witDocSnapshot) {
                                (witDoc as any as IWITDocActions).changeSelection([]);
                                witDocSnapshot.pages.forEach((page, pageIndex) => {
                                    page.canvases.forEach((canvas, index) => {
                                        (witDoc.pages[pageIndex].canvases[index] as any as ICanvasActions)
                                            .addLayersBySnapshots(canvas.layers, undefined, undefined, true);
                                    });
                                });
                            }
                        }

                    }).catch(error => this.showError(error, MultiPageOperation.Copy));
            } else if (action === MultiPageListMode.Reload) {
                multiPageDesignSpec.applyReloadAction(preSelectedPageHash!);

                if (preSelectedPageHash! === multiPageDesignSpec.activePageHash && witdoc) {
                    (witdoc as any as IWITDocActions).changeSelection([]);
                    witdoc.pages.forEach(p => p.canvases.forEach(canvas => {
                        (canvas as any as ICanvasActions).addLayers([], true);
                    }));
                }
            }
        }
        this.assignState({ mode: MultiPageListMode.Normal, dlgId:undefined, preloaderId:preloaderId });
    }

    showError(error: any, operation: MultiPageOperation) {
        //console.log("MultiPage operation error", error);
        const { modalDialogManager } = this.props;
        const { translateTemplate, translate } = this.props.localize!;

        if (modalDialogManager) {

            let templateName = "";

            if (this.state.preloaderId) {
                modalDialogManager.removeDialog(this.state.preloaderId);
                this.assignState({preloaderId:undefined});
            }

            switch (operation) {
                case MultiPageOperation.Delete:
                    templateName = "multiPageList.deletePagesError";
                    break;
                case MultiPageOperation.Move:
                    templateName = "multiPageList.movePagesError";
                    break;
                case MultiPageOperation.Insert:
                    templateName = "multiPageList.insertPagesError";
                    break;
                case MultiPageOperation.Copy:
                    templateName = "multiPageList.copyPageError";
                    break;
                default:
                    break;
            }

            if (templateName)
                modalDialogManager.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate(templateName, error));
        }
    }

    render() {
        const { multiPageDesignSpec } = this.props;
        const { translate, trn } = this.props.localize!;
        const { mode, selectedPages, preSelectedPageHash } = this.state;
        const pageThumbStyle: React.CSSProperties = {
            width: "100%",
            height: "2rem",
            background: "1px solid #CCCCCC"
        }
        let preSelectedPageName = "";
        const preSelectedPage = multiPageDesignSpec!.pages.find(p => p.hash === preSelectedPageHash);
        if (preSelectedPage)
            preSelectedPageName = preSelectedPage.name;
        //Assign loading style
        const isSpecLoading = multiPageDesignSpec &&
            multiPageDesignSpec.isLoading &&
            multiPageDesignSpec.operation !== MultiPageOperation.Delete.toString();

        return <div ref={(rootDiv) => this.rootDiv = rootDiv} className="wdm-page-list wdm-mp-list">
                   {multiPageDesignSpec && <List selection className={isSpecLoading ? "wait" : ""}>
                {multiPageDesignSpec.pages.map((page, index, pages) => {
                    const canInsert = !multiPageDesignSpec.pageCountFixed &&
                        (page.type === MultiPagePageType.Page || (index <= 1 && pages[index + 1].type === MultiPagePageType.Page)) &&
                        multiPageDesignSpec.canInsertPages;
                    const canDelete = !multiPageDesignSpec.pageCountFixed &&
                        page.type === MultiPagePageType.Page && multiPageDesignSpec.canDeletePages;
                    const canDuplicate = page.type === MultiPagePageType.Page;
                    const canMove = page.type === MultiPagePageType.Page;
                    const canPreSelect =
                        (mode === MultiPageListMode.Move && !multiPageDesignSpec.isPreSelectionMoved());
                    const showPreSelection = (mode === MultiPageListMode.Copy && page.hash !== preSelectedPageHash) ||
                        (mode === MultiPageListMode.Move &&
                            (!multiPageDesignSpec.isPreSelectionMoved() || page.preSelected)) ||
                        (mode !== MultiPageListMode.Move && mode !== MultiPageListMode.Normal && mode !== MultiPageListMode.Copy);
                    return <MultiPageListItem key={index} page={page}
                                              type={multiPageDesignSpec.designType}
                                              canPreSelect={canPreSelect}
                                                canInsert={canInsert}
                                                canDuplicate={canDuplicate}
                                                canDelete={canDelete}
                                                canMove={canMove}
                                              showPreSelection={showPreSelection}
                                              preSelected={page.preSelected}
                                              selected={page.activeHash}
                                              showControls={mode === MultiPageListMode.Normal}
                                              onItemClick={(page) => this.onItemClick(page)}
                                              imageWidth={this.props.emptyThumbImageWidth}
                                              imageHeight={this.props.emptyThumbImageHeight}
                                              onControlClick={(e, mode, hash) => this.pageControlClick(e, mode, hash)}/>;
                })}
                    </List>}
                   {this.state.mode === MultiPageListMode.Move &&
                <MultiPageMovePagesControl
                    selectedPages={selectedPages}
                    multiPageDesignSpec={multiPageDesignSpec}
                    onAction={(action) => this.movePageAction(action)}
                    onClose={() => this.movePagesControlClose()}
                    onAccept={() => this.acceptAction(MultiPageListMode.Move)} />}
                   {this.state.mode === MultiPageListMode.Delete &&
                <MultiPageDeletePagesControl
                    selectedPages={selectedPages}
                    multiPageDesignSpec={multiPageDesignSpec}
                    onAction={(action) => this.selectPagesAction(action)}
                    onClose={() => this.movePagesControlClose()}
                    onAccept={() => this.showDeleteConfirmation()} />}
                   {this.state.mode === MultiPageListMode.Copy &&
                <MultiPageCopyPageControl
                    selectedPages={selectedPages}
                    sourcePageName={preSelectedPageName}
                    multiPageDesignSpec={multiPageDesignSpec}
                    onAction={(action) => this.selectPagesAction(action)}
                    onClose={() => this.movePagesControlClose()}
                    onAccept={() => this.showCopyConfirmation()} />}
            {this.state.showCrossPageVerifyCoverConfirmation &&
                <CrossPageCoverConfirmationDialog
                    open={true}
                    onResult={(result) => this.onDlgCrossPageCoverConfirmationResult(result)} />}
               </div>;
    }

    componentDidUpdate() {
        const { multiPageDesignSpec } = this.props;
        if (multiPageDesignSpec) {
            const rootParent = $(this.rootDiv as any).parent();
            const hasWaitClass = rootParent.hasClass("wait");
            if (!hasWaitClass && multiPageDesignSpec.isLoading)
                rootParent.addClass("wait");
            else if(hasWaitClass && !multiPageDesignSpec.isLoading)
                rootParent.removeClass("wait");
        }
        
    }
}