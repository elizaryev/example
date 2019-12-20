import * as React from "react";
import { observer, inject } from "mobx-react";
import { getSnapshot } from "mobx-state-tree";
import { Segment, List, Icon } from "semantic-ui-react";
import EnhancedButton from "./EnhancedButton";
import ModalDialog from "./ModalDialog";
import { ModalDialogResult } from "../store/ModalDialog/ModalDialogManager";
import { IPage, IPageActions, Page } from "../store/Page";
import { ICanvas } from "../store/Canvas";
import { ILocalizeActions } from "../store/Localize";
import "../css/DesignPageList.less";
import { IViewMediaImageActions, ViewMediaType, getViewMediaTypeByIndex } from "../store/Gallery/Gallery";
import DesignPageItem from "../components/DesignPageItem";
import { DesignSpec, getDesignSpecSnapshot } from "../store/model/DesignSpec";

interface DesignPageListProps {
    page?:IPage,
    localize?: ILocalizeActions,
    onFold?: () => void,
    onBeforeChange?: (oldCanvas:ICanvas, newCanvas:ICanvas) => void;
    onChange?: (canvas: ICanvas) => void;
    designSpec?:DesignSpec
}

interface DesignPageListState {
    isOpened?: boolean;
    isDialogOpened?: boolean;
    canvas?:ICanvas
}

/**
 * Component for managing F/B sides of single page design
 */
@inject("localize", "designSpec")
@observer
export default class DesignPageList extends React.Component<DesignPageListProps, DesignPageListState> {

    maxSides: number = 2;
    minSides: number = 1;

    constructor(props: DesignPageListProps) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        if (this.props.page) {
            (this.props.page as any as IPageActions).initPreviews();
        }
    }

    private onFold() {
        if (this.props.onFold) this.props.onFold();
    }

    itemClickHandler(canvas: ICanvas) {
        if (this.props.page && this.props.page.isLoading) return;
        if (this.props.onBeforeChange) this.props.onBeforeChange(this.props.page!.selectedCanvas!, canvas);
        (this.props.page as any as IPageActions).selectCanvas(canvas);
        if (this.props.onChange) this.props.onChange(canvas);
    }

    itemRemoveHandler(canvas: ICanvas) {
        this.setState({isDialogOpened:true, canvas:canvas});
    }

    btnAddSideClickHandler() {
        const { designSpec } = this.props;
        if (this.props.page && this.props.page.isLoading) return;
        //(this.props.page as any as IPageActions).addCanvas(this.props.designSpec!.getProdTypeSpecGraphicUrls(true));
        (this.props.page as any as IPageActions).addCanvas(designSpec ? getDesignSpecSnapshot(designSpec) : undefined);
    }

    onRemoveDialogResult(result: number) {
        const { canvas } = this.state;
        const { page, onBeforeChange, onChange } = this.props;

        //close dialog immediately
        if (result !== ModalDialogResult.Okay ||
            !canvas ||
            (page && page.isLoading)) {
            this.setState({isDialogOpened:false});
             return false;
        }

        if (onBeforeChange) onBeforeChange(this.props.page!.selectedCanvas!, canvas);
        (this.props.page as any as IPageActions).removeCanvas(canvas);
        if (onChange) onChange(canvas);
        this.setState({
            isDialogOpened: false
        });
        return false;
    }

    render() {
        const { translate, trn } = this.props.localize!;
        const { page } = this.props;
        if (!page) return null;
        const galleryItem = page.galleryItem;

        if (!galleryItem) return null;

        return <div className="wdm-page-list">
                   <Segment inverted textAlign="center" className="hdr">
                       {translate("pageList.lblSides")}
                    {/*<div className="fold-ctl">
                           <EnhancedButton basic compact
                                           className="btn-unfold"
                                           ypIcon="YP2_arrow right2"
                                           popup={translate("pageList.ttlFold")}
                                           onClick={() => this.onFold()} />
                       </div>*/}
                   </Segment>
                   <div className="cont">
                       <List selection>
                           {galleryItem.viewMedia.map((image, index) => {
                        const currentImage = image.thumbImage!;
                        let contentOrUrl: string | undefined = currentImage.content || (currentImage as any as IViewMediaImageActions).getImageUrl(galleryItem.hash,
                            currentImage.hash || getViewMediaTypeByIndex(index));
                        let additionalProps = {};
                        //For new designs the result graphic is normally empty
                        if (currentImage.tag === "empty") {
                            contentOrUrl = `imggen/${currentImage.width}/${currentImage.height}/empty`;
                        }
                        const canvasIndex = page.selectedCanvas ? page.canvases.indexOf(page.selectedCanvas) : -1;
                        return <DesignPageItem src={contentOrUrl} key={index} {...additionalProps}
                            isLoading={page.isLoading}
                            canvas={page.canvases[index]}
                            canRemove={page.canvases.length > this.minSides}
                            selected={index === canvasIndex}
                            onItemClick={(canvas) => this.itemClickHandler(canvas)}
                            onItemRemove={(canvas) => this.itemRemoveHandler(canvas)}/>;
                    })}
                </List>
                       {page.canvases.length < this.maxSides && !page.isLoading &&
                    <div className="txt-centered add-page">
                    <EnhancedButton basic                        
                        labelPosition="right"
                        popup={translate("pageList.ttlAddSide")} className="btn-simple no-border"
                        onClick={() => this.btnAddSideClickHandler()}>
                            <Icon className="icon-YP2_plus" />
                            {translate("pageList.lblAddSide")}
                        </EnhancedButton>
                    </div>}
                    </div>
                    {this.state.isDialogOpened && <ModalDialog icon="warning sign"
                        trigger={<div style={{display:"none"}}/>}
                        open={this.state.isDialogOpened}
                        header={translate("pageList.dlgRemoveHeader")}
                        content={translate("pageList.dlgRemoveContent")}
                        size="tiny"
                        onResult={(result) => this.onRemoveDialogResult(result)} />}
               </div>;
    }
}