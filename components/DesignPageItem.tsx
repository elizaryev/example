import * as React from "react";
import { observer, inject } from "mobx-react";
import { Segment, List, Image, ListItemProps, Dimmer, Loader } from "semantic-ui-react";
import EnhancedButton from "./EnhancedButton";
import { IPage, IPageActions, Page } from "../store/Page";
import { ICanvas } from "../store/Canvas";
import { ILocalizeActions } from "../store/Localize";
import * as _ from "lodash";
import "../css/DesignPageList.less";
import { IViewMediaImageActions, ViewMediaType, getViewMediaTypeByIndex } from "../store/Gallery/Gallery";
import MouseUtil from "../utils/MouseUtil";

interface DesignPageItemProps {
    selected?:boolean,
    src?: string,
    localize?: ILocalizeActions,
    canvas:ICanvas,
    canRemove?: boolean,
    isLoading?:boolean,
    onItemClick?(canvas:ICanvas): void,
    onItemRemove?(canvas: ICanvas): void,
    imageWidth?: number,
    imageHeight?:number
}

interface DesignPageItemState {
    isMouseOver?: boolean;    
    isCloseMouseOver?:boolean;
}

/**
 * Component for managing F/B sides of single page design
 */
@inject("localize")
@observer
export default class DesignPageItem extends React.Component<DesignPageItemProps, DesignPageItemState> {

    constructor(props: DesignPageItemProps) {
        super(props);
        this.state = {};
    }

    itemClickHandler() {
        if (this.props.onItemClick) this.props.onItemClick(this.props.canvas);
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

    btnRemoveClickHandler(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (this.props.onItemRemove) this.props.onItemRemove(this.props.canvas);
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: DesignPageItemState) {
        this.setState(_.assign({}, this.state, newState));
    }

    render() {
        const { translate, trn } = this.props.localize!;
        const { src, selected, isLoading, canRemove, canvas } = this.props;
        if (!src) return null;
        const selectionClass = selected ? "selected" : "";
        const animationClass = this.state.isCloseMouseOver === true ? "animated zoomIn" : "animated zoomOut";

        const style: React.CSSProperties = {};
        if (this.props.imageWidth !== undefined) {
            style.width = this.props.imageWidth + "px";
        }
        if (this.props.imageHeight !== undefined) {
            style.height = this.props.imageHeight + "px";
        }

        return <List.Item className={`${selectionClass} `}
              onClick={() => this.itemClickHandler()}
              onMouseOver={(e:React.MouseEvent<HTMLDivElement>) => this.mouseOverHandler(e)}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => this.mouseLeaveHandler(e)} >
            {isLoading && <Dimmer active inverted>
                              <Loader size='mini'/>
                          </Dimmer>}
            <Image bordered spaced src={src} style={style} />
            <div className="title">{canvas ? canvas.title : ""}</div>
            {!isLoading && canRemove && this.state.isMouseOver && <div className={"btn-remove " + animationClass}>
                <EnhancedButton circular
                    ypIcon="YP2_cancel cross"
                    popup={translate("pageList.ttlRemoveSide")}
                    onClick={(e: React.MouseEvent) => this.btnRemoveClickHandler(e)}
                    onMouseOver={() => this.assignState({ isCloseMouseOver: true })}
                    onMouseOut={() => this.assignState({ isCloseMouseOver: false })}/>
            </div>}  
               </List.Item>;              
    }
}