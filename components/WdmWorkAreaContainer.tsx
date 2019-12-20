import * as React from "react";
import * as $ from "jquery";
import { observer, inject } from "mobx-react";
import { ILayerModifier, LayerModifierTypes } from '../store/LayerModifier';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';
import { ILocalizeActions, } from '../store/Localize';
import { TransformTypes } from '../constants';
import { ITransformSelection } from '../store/TransformSelection';
import {
    ConnectDropTarget, DragDropContext, DropTarget,
    DropTargetConnector, DropTargetMonitor, DropTargetSpec
} from 'react-dnd';
import { IPage, IPageActions } from "../store/Page";
import Page from "../containers/Page";
import Crop from "../components/Crop";
import SelectionUtil from "../utils/SelectionUtils";
import { defaultLayerAdjustmentFunction, GalleryItemType, IGalleryItem } from "../store";
import { ILayer } from "../store/Layer";



interface IWITDocProps {
    witdoc?: IWITDoc & IWITDocActions,
    transformSelection: ITransformSelection,
    localize: ILocalizeActions,
    docSettings: IWITDocSettings,
    layerModifier: ILayerModifier;
}

interface CanvasSourceProps {
    connectDropTarget: ConnectDropTarget,
    isOver: boolean;
}

const canvasDropTargetSpecification: DropTargetSpec<WdmWorkAreaContainerExtendedProps> = {
    drop(props: WdmWorkAreaContainerExtendedProps, monitor: DropTargetMonitor, component: React.Component<WdmWorkAreaContainerExtendedProps, any>) {
        const itemType = monitor.getItemType();        
        let pos = monitor.getSourceClientOffset();
        const witdoc = component.context.mobxStores.witdoc as IWITDoc;
        var zoom: number = component.context.mobxStores.docSettings.zoom;
        console.log('dropped', itemType);
        if (itemType === "layer") {
            //console.log(component);
            var offset = monitor.getDifferenceFromInitialOffset();

            SelectionUtil.stopTransformingSelection();
            // How to avoid that??? No static typization
            //if (component.context && component.context.mobxStores && component.context.mobxStores.transformSelectionStore) {    
            if (component.context && component.context.mobxStores) {                
                var transformSelection: ITransformSelection = {
                    isTransforming: false,
                    type: TransformTypes.OFFSET,
                    offsetX: offset.x / zoom,
                    offsetY: offset.y / zoom
                };


                // Stop monitoring
                component.context.mobxStores.witdoc.transformSelection.setTransform(transformSelection);
                // apply transformation
                (component.context.mobxStores.witdoc as IWITDocActions).applyTransform(transformSelection)
            }
        } else if (itemType === "item") {
            const sourceClientOffset = monitor.getSourceClientOffset();
            const initialClientSourceOffset = monitor.getInitialSourceClientOffset();
            const clientOffset = monitor.getClientOffset();
            const initialClientOffset = monitor.getInitialClientOffset();
            let offs = $("div.wdm-gallery-list").offset();
            let scrollTop = $("div.wdm-gallery-list").parent().parent().parent().scrollTop();

            const initialPosition = (witdoc.selectedPage! as any as IPageActions).globalToPage(clientOffset.x, clientOffset.y, zoom);
            const galleryItem = monitor.getItem() as IGalleryItem;
            if (galleryItem && galleryItem.type !== GalleryItemType.Background && galleryItem.viewMedia && galleryItem.viewMedia[0].thumbImage) {
                const w = galleryItem.viewMedia[0].screenImage.width;
                const h = galleryItem.viewMedia[0].screenImage.height;
                if (w && h) {
                    const layer: ILayer = {
                        uid: "l0",
                        x: 0,
                        y: 0,
                        width: w,
                        height: h,
                        unscaledWidth: w,
                        unscaledHeight: h,
                        rotation: 0,
                        alpha: 1
                    };
                    //calculate layer position
                    defaultLayerAdjustmentFunction(layer, undefined, witdoc);
                    initialPosition.x -= layer.width / 2;
                    initialPosition.y -= layer.height / 2;
                }
            }

            //console.log('on gallery item selected');
            //onGalleryItemSelected(monitor.getItem() as any as IGalleryItem,
            //    component);
            //(witdoc.selectedPage! as any as IPageActions).globalToPage(sourceClientOffset.x - initialClientOffset.x, sourceClientOffset.y - initialClientOffset.y));
            if (component.props.onGalleryItemSelected) {
                component.props.onGalleryItemSelected(galleryItem, initialPosition);
                //(witdoc.selectedPage! as any as IPageActions).globalToPage(sourceClientOffset.x - initialClientOffset.x, sourceClientOffset.y - initialClientOffset.y));
            }
        }
    },
    hover(props: WdmWorkAreaContainerExtendedProps, monitor: DropTargetMonitor, component: React.Component<WdmWorkAreaContainerExtendedProps, any>) {

        const itemType = monitor.getItemType();
        const witdoc = component.context.mobxStores.witdoc as IWITDoc;
        if (itemType === "layer") {            
            const offset = monitor.getDifferenceFromInitialOffset();
            // How to avoid that??? No static typization
            if (component.context && component.context.mobxStores) {
                var zoom: number = component.context.mobxStores.docSettings.zoom;                
                SelectionUtil.moveSelection(witdoc.selection, offset, zoom);
            }
        } else if (itemType === "item") {
            //console.log("over: " + monitor.canDrop());
            //(witdoc as any as IWITDocActions).disableSelection(true);
        }
    }
};

const canvasDropTargetCollector = (connect: DropTargetConnector, monitor: DropTargetMonitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    };
};

export interface WdmWorkAreaContainerProps {
    page?:IPage,
    zoom?:number,
    layerModifier?:ILayerModifier,
    onBackgroundMouseDown?(e: React.MouseEvent<HTMLDivElement>):void;
    onGalleryItemSelected?:(item: IGalleryItem | undefined, initialPosition?: { x: number, y: number }) => void;
}

export interface WdmWorkAreaContainerState {
}

type WdmWorkAreaContainerExtendedProps = WdmWorkAreaContainerProps & CanvasSourceProps;

@inject("witdoc")
@observer
class WdmWorkAreaContainer extends React.Component<WdmWorkAreaContainerExtendedProps, WdmWorkAreaContainerState> {

    constructor(props: WdmWorkAreaContainerExtendedProps) {
        super(props);
        this.state = {};
    }

    onBackgroundMouseHandler(e:React.MouseEvent<HTMLDivElement>) {
        if (this.props.onBackgroundMouseDown)
            this.props.onBackgroundMouseDown(e);
    }

    render() {
        const { layerModifier, page, zoom } = this.props;
        if (!page) return null;
        return this.props.connectDropTarget(<div className="cont">
                   <div className='main-canvas-area'>
                       {layerModifier && layerModifier!.isModifying &&
                           layerModifier!.action === LayerModifierTypes.CROP &&
                           <Crop layer={layerModifier!.layer}/>}
                       <div className='wit stagebg' onMouseDown={(e:React.MouseEvent<HTMLDivElement>) => this.onBackgroundMouseHandler(e)}/>
                       <Page page={page} zoom={zoom} 
                             onBackgroundMouseDown={e => this.onBackgroundMouseHandler(e)}/>
                   </div>
                   <div className="witsel-stub-parent">
                       <div id="witsel-stub"/>
                   </div>
               </div>);
    }
}

export default DropTarget(['item'], canvasDropTargetSpecification, canvasDropTargetCollector)(WdmWorkAreaContainer) as any;