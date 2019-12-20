import * as React from "react";
import { observer, inject } from "mobx-react";
import { Popup, List, Image, ListItemProps, Dimmer, Loader } from "semantic-ui-react";
import * as _ from "lodash";
import { IDesignPage, ILocalizeActions } from "../store";
import { IViewMediaImageActions, ViewMediaType, getViewMediaTypeByIndex } from "../store/Gallery/Gallery";
import EnhancedButton from "./EnhancedButton";
import { MultiPageListMode } from "./MultiPageList";
import { MultiPagePageType } from "../store/model/MultiPageDesignSpec";
import { MultiPageDesignTypes } from "../constants/enums";

interface MultiPageListItemProps {
    type?:string,
    canPreSelect?:boolean,
    showPreSelection?: boolean,
    canInsert?: boolean,
    canDuplicate?:boolean,
    canDelete?:boolean,
    canMove?:boolean,
    selected?:boolean,
    localize?: ILocalizeActions,
    isLoading?:boolean,     
    imageWidth?: number,
    imageHeight?:number,
    page?: IDesignPage,
    showControls?:boolean,
    onItemClick?: (page: IDesignPage) => void,
    onControlClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, mode: MultiPageListMode, hash?: string) => void;
}

interface MultiPageListItemState {
    isMouseOver?: boolean;    
    isCloseMouseOver?:boolean;
}

/**
 * Component for managing F/B sides of single page design
 */
@inject("localize")
@observer
export class MultiPageListItem extends React.Component<MultiPageListItemProps, MultiPageListItemState> {

    constructor(props: MultiPageListItemProps) {
        super(props);
        this.state = {};
    }

    itemClickHandler() {
        //if (this.props.onItemClick) this.props.onItemClick(this.props.canvas);
        if (this.props.onItemClick) this.props.onItemClick(this.props.page);
    }

    mouseOverHandler(event: React.MouseEvent<HTMLDivElement>) {
        this.setState({isMouseOver:true});
    }
    
    mouseLeaveHandler(event: React.MouseEvent<HTMLDivElement>) {        
        //const self = this;
        //MouseUtil.makeAbsolutePositionMouseOutFn(event.target as any, (e) => {
        //    console.log("mouse out ", e.target, e.fromElement, e.toElement, e.srcElement);
        //    self.setState({ isMouseOver: false });
        //})(event.nativeEvent);
        this.setState({ isMouseOver: false });
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: MultiPageListItemState) {
        this.setState(_.assign({}, this.state, newState));
    }

    controlClickHandler(e:React.MouseEvent<HTMLButtonElement, MouseEvent>, mode: MultiPageListMode, hash?:string) {
        if (this.props.onControlClick) this.props.onControlClick(e, mode, hash);
    }

    render() {
        const { translate, trn } = this.props.localize!;
        const { page, selected, isLoading, showControls, canPreSelect, type } = this.props;
        const showPreSelection = this.props.showPreSelection && (page && page.type === MultiPagePageType.Page);
        //if (!src) return null;
        const selectionClass = selected ? "selected" : "";
        const animationClass = this.state.isCloseMouseOver === true ? "animated zoomIn" : "animated zoomOut";

        const style: React.CSSProperties = {};
        //if (this.props.imageWidth !== undefined) {
        //    style.width = this.props.imageWidth + "px";
        //}
        //if (this.props.imageHeight !== undefined) {
        //    style.height = this.props.imageHeight + "px";
        //}

        let contentOrUrl: string | undefined = "";

        if(page && page.galleryItem) {
            const galleryItem = page.galleryItem;
            const currentImage = galleryItem.viewMedia[0].thumbImage;
            contentOrUrl = currentImage.content ||
                (currentImage as any as IViewMediaImageActions).getImageUrl(galleryItem.hash,
                    currentImage.hash || getViewMediaTypeByIndex(0));

            //For new designs the result graphic is normally empty
            if (currentImage.tag === "empty") {
                const imageWidth = this.props.imageWidth || currentImage.width;
                const imageHeight = this.props.imageHeight || currentImage.height;
                contentOrUrl = `imggen/${imageWidth}/${imageHeight}/empty`;
            }
        }

        const isPopupDisabled = showControls === undefined ? false : !showControls;

        const listItem = <List.Item id={"li_" + page!.hash} className={`${selectionClass} `}
                                    onClick={() => this.itemClickHandler()}
                                    onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => this.mouseOverHandler(e)}
                                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => this.mouseLeaveHandler(e)}>
                             {isLoading &&
                                 <Dimmer active inverted>
                                     <Loader size='mini'/>
                                 </Dimmer>}
                             <div>
                                 {type !== MultiPageDesignTypes.CROSS_PAGE_DB.toString() &&
                                     showPreSelection &&
                                     <div className="div-inline-block">
                                         <EnhancedButton basic compact icon="check" size="tiny"
                                                         className="circular"
                                                         popupContent={canPreSelect
                                                             ? translate("multiPageList.lblBtnSelect")
                                                             : undefined}
                                                         color={page && !page.preSelected ? "grey" : "green"}/>
                                     </div>}
                                 <Image bordered spaced src={contentOrUrl} style={style}/>
                                 {type === MultiPageDesignTypes.CROSS_PAGE_DB &&
                                     showPreSelection &&
                                     <div className="div-cp-presel">
                                         <EnhancedButton basic compact icon="check" size="tiny"
                                                         className="circular"
                                                         popupContent={canPreSelect ? translate("multiPageList.lblBtnSelect") : undefined}
                                                         color={page && !page.preSelected ? "grey" : "green"}/>
                                     </div>}
                             </div>
                             <div className="title">{page && page.name}</div>
                         </List.Item>;

        if (isPopupDisabled) return listItem;

        return <Popup disabled={isPopupDisabled} trigger={listItem}
                      className="mp-list-item"
                      position="left center" hoverable>
                   {this.props.canDuplicate &&
                       <EnhancedButton basic compact ypIcon="YP3_copy circular"
                                       popupContent={translate("multiPageList.lblBtnCopyPage")}
                                       onClick={(e) => this.controlClickHandler(e,
                                       MultiPageListMode.Copy,
                    this.props.page!.hash)}className="btn-prop labeled"/>}
                   { this.props.canInsert &&
                       <EnhancedButton basic compact ypIcon="YP3_duplicate circular"
                                       popupContent={translate("multiPageList.lblBtnInsertPages")}
                                       onClick={(e) => this.controlClickHandler(e,
                                        MultiPageListMode.Insert,
                                        this.props.page!.hash)}
                                       className="btn-prop labeled"/>}
                   {this.props.canMove &&
                       <EnhancedButton basic compact ypIcon="YP3_move vertically circular"
                                       popupContent={translate("multiPageList.lblBtnMovePages")}
                                       onClick={(e) => this.controlClickHandler(e,
                                           MultiPageListMode.Move,
                                           this.props.page!.hash)}
                                       className="btn-prop labeled"/>}
                   <EnhancedButton basic compact ypIcon="YP3_reload circular"
                                   popupContent={translate("multiPageList.lblBtnClearPage")}
                                    onClick={(e) => this.controlClickHandler(e,
                                    MultiPageListMode.Reload,
                                    this.props.page!.hash)}className="btn-prop labeled"/>
                   {this.props.canDelete &&
                       <EnhancedButton basic compact ypIcon="YP3_trash circular"
                                       popupContent={translate("multiPageList.lblBtnDeletePages")}
                                       onClick={(e) => this.controlClickHandler(e,
                                           MultiPageListMode.Delete,
                                           this.props.page!.hash)}
                                       className="btn-prop labeled"/>}
               </Popup>;
    }
}