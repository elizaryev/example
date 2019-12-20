import * as $ from 'jquery';
import * as Logger from 'js-logger';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { DragSource, DragSourceConnector, DragSourceMonitor, DragSourceSpec } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ModelPrefixes, TransformTypes } from '../constants';
import { LayerSourceProps } from '../containers/WITElement';
import { ILayer, ILayerActions, LayerObjectType } from '../store/Layer';
import { ILayerModifierActions, LayerModifierTypes } from '../store/LayerModifier';
import { WritingMode } from "../store/TextEditor";
import { ITransformSelection } from '../store/TransformSelection';
import { IUndoRedoQueue } from '../store/UndoRedo';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';
import { Rectangle } from "../store/model/index";
import SelectionUtil from "../utils/SelectionUtils";
import SelectionArea from "./SelectionArea";
import { IEditorSize, TextLayerEditor} from './TextLayerEditor';
import { makeCancelable } from "../utils/DataLoader";
import { CursorUtil, CursorPosition, WDMTextUtil } from "../utils";
import { throttle } from "throttle-debounce";
import { textEditorState, TextLayer, TextAnchor } from "../store";

let __isHandleOverGlobal = false;
let __isHandleMouseDownGlobal = false;
let __globalMouseDown = false;


// Spec: drag events to handle.
let nodeSourceSpec: DragSourceSpec<IWITDocProps & Object> = {
    beginDrag: (props: IWITDocProps & Object) => {
        return {};
    },
    canDrag: (props: IWITDocProps & Object, monitor?: DragSourceMonitor) => {
        return !__isHandleOverGlobal &&
            !__isHandleMouseDownGlobal &&
            (!WDMTextUtil.isTextEditorActive() || __globalMouseDown);
    },
    endDrag: (props: IWITDocProps & Object,
        monitor?: DragSourceMonitor,
        component?: React.Component<IWITDocProps & Object>) => {
        if (component && component.context && component.context.mobxStores) {
            const transformSelection: ITransformSelection = {
                isTransforming: false,
                type: component.context.mobxStores.witdoc.transformSelection.type
            };
            //component.context.mobxStores.witdoc.transformSelection.setTransform(transformSelection);

            const witdoc = component.context.mobxStores.witdoc;
            const ids = witdoc.selection.map(layer => layer.uid);
            //witdoc.setUpdateSelectionFlag(true);
            //witdoc.setUpdateSelectionFlag(false);
            witdoc.changeSelection([], false);
            witdoc.changeSelection(ids, false);
            witdoc.selection.forEach(
                (layer) => (layer as any as ILayerActions).set("reRenderCounter", layer.reRenderCounter + 1));
        }
    }
};

// Collect: Put drag state into props
let nodeSourceCollector = (connect: DragSourceConnector, monitor: DragSourceMonitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        offset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }
};

interface IWITDocProps {
    witdoc: IWITDoc & IWITDocActions,    
    settings: IWITDocSettings,
    undoredo: IUndoRedoQueue,
    selection: ILayer[]
}

interface WITSelectionState {
    isHandleOver: boolean;
    currentTextLayerId?:string;
}

type WITSelectionProps = IWITDocProps & LayerSourceProps;

let isChangingByHandle = false;

@inject("witdoc", "undoredo")
@observer
class WITSelection extends React.Component<WITSelectionProps, WITSelectionState>
{
    private minX: number = 0;
    private maxX: number = 0;
    private minY: number = 0;
    private maxY: number = 0;
    private rotation: number = 0;

    private offsetMin: JQuery.Coordinates | undefined;
    private offsetMax: JQuery.Coordinates | undefined;

    private mouseDownScreenX: number = 0;
    private mouseDownScreenY: number = 0;
    private selectionRect: ClientRect;
    private selectionCenterX: number = 0;
    private selectionCenterY: number = 0;
    private currentAction: string = "";

    private updateAnchors = false;

    private textLayerEditor:TextLayerEditor | null = null;

    constructor(props: any) {
        super(props);
        this.state = { isHandleOver: false };
        //catch the error in case of server-side rendering
        try {
            this.selectionRect = $("<empty/>")[0].getBoundingClientRect();
        }
        catch(err) {

        }
    }

    private handleMouseEnter = () => {
        this.setState(_.assign({}, this.state, { isHandleOver: true }));
        __isHandleOverGlobal = true;
    }

    private handleMouseLeave = () => {
        this.setState(_.assign({}, this.state, { isHandleOver: false }));
        __isHandleOverGlobal = false;
    }

    private handleMouseUp = () => {
        
    }

    private handleMouseDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
        isChangingByHandle = true;
        this.mouseDownScreenX = e.pageX;
        this.mouseDownScreenY = e.pageY;
        this.selectionRect = $("div.wit.selection > .area")[0].getBoundingClientRect();
        this.selectionCenterX = this.selectionRect.left + this.selectionRect.width / 2;
        this.selectionCenterY = this.selectionRect.top + this.selectionRect.height / 2;
        //($("div.wit-elem#" + layer.uid)[0] as any).getBoundingClientRect();
        $('body').css('cursor', $(e.currentTarget).children('div').css('cursor'));
        $(window).on('mouseup', $.proxy(this.windowMouseUpHandler, this));
        $(window).on('mousemove', this.proxyWindowMouseMove);

        // 2nd class is an action
        if (e.currentTarget.classList.length >= 2) {
            this.currentAction = e.currentTarget.classList[1];
        }
        this.updateAnchors = true;
        __isHandleMouseDownGlobal = true;
        this.forceUpdate();
    }

    private windowMouseMoveHandler = (e: JQuery.Event) => {
        // Do handle drag actions  
        console.log('window mouse move handler ', this);
        
        var transformSelection = this.getCurrentTransform(e.pageX, e.pageY, true, this.updateAnchors);
        this.updateAnchors = false;
        if (transformSelection !== undefined) {
            if (transformSelection.type === TransformTypes.ROTATE) {
                SelectionUtil.rotateSelection(this.props.selection, transformSelection.deltaRotation!);
            } else {
                this.props.witdoc.transformSelection!.setTransform(transformSelection);
            }
        }
    }

    proxyWindowMouseMove = throttle(50, true, $.proxy(this.windowMouseMoveHandler, this));

    private windowMouseUpHandler = (e: JQuery.Event) => {

        $('body').css('cursor', '');
        //$(window).off('mouseup', this.windowMouseUpHandler);
        //$(window).off('mousemove', this.windowMouseMoveHandler);

        $(window).off('mouseup', $.proxy(this.windowMouseUpHandler, this));
        $(window).off('mousemove', this.proxyWindowMouseMove);

        isChangingByHandle = false;

        // Get current transform and stop further transformin
        var transformSelection = this.getCurrentTransform(e.pageX, e.pageY, false);
        if (this.currentAction === "rot") {            
            if (transformSelection !== undefined) {
                this.props.witdoc.applyTransform(transformSelection);
                this.props.witdoc.transformSelection!.setTransform(transformSelection);
            }
        }
        else {
            this.props.witdoc.applyTransformByView(undefined, transformSelection);
            //console.log('apply transform by view (SELECTION)');
            if (transformSelection !== undefined) {                
                this.props.witdoc.transformSelection!.setTransform(transformSelection);
            }            
        }

        SelectionUtil.stopTransformingSelection();
        textEditorState.contentChangedCounter++;
        this.forceUpdate(() => this.updateSelectionBeforeRendering());
        __isHandleMouseDownGlobal = false;
    }

    private windowResizeHandler = () => {
       this.forceUpdate();
    }

    private globalWindowMouseDownHandler = () => {
        __globalMouseDown = true;
        window.addEventListener('mouseup', this.globalWindowMouseUpHandler);
        //console.log('global mouse down');
    }

    private globalWindowMouseUpHandler = () => {
        __globalMouseDown = false;
        window.removeEventListener('mouseup', this.globalWindowMouseUpHandler);
        //console.log('global mouse up');
    }


    private getCurrentTransform(pageX: number, pageY: number, isTranforming: boolean = true, updateAnchors: boolean = false) {
        var transformSelection: ITransformSelection | undefined;
        const { selection } = this.props;
        switch (this.currentAction) {
            case 'rot':
                var deltaRotation = Math.atan2(pageY - this.selectionCenterY, pageX - this.selectionCenterX);
                deltaRotation -= Math.atan2(this.mouseDownScreenY - this.selectionCenterY, this.mouseDownScreenX - this.selectionCenterX);
                deltaRotation *= 180 / Math.PI;
                transformSelection = {
                    type: TransformTypes.ROTATE,
                    isTransforming: isTranforming,
                    deltaRotation: deltaRotation
                };
                break;
            case 'l':
            case 'tl':
            case 't':
            case 'tr':
            case 'r':
            case 'br':
            case 'b':
                transformSelection = {
                    // Types are also described in TransformTypes constants
                    type: "scale_" + this.currentAction,
                    isTransforming: isTranforming,
                    offsetX: (pageX - this.mouseDownScreenX), // / this.props.settings.zoom,
                    offsetY: (pageY - this.mouseDownScreenY), // / this.props.settings.zoom,
                    width: Math.abs(this.maxX - this.minX),
                    height: Math.abs(this.maxY - this.minY),
                    zoom: this.props.settings.zoom
                };

                if (selection.length === 1) {
                    transformSelection.width = (transformSelection.width || 0) / transformSelection.zoom!;
                    transformSelection.height = (transformSelection.height || 0) /transformSelection.zoom!;
                }

                if (updateAnchors) {
                    transformSelection.anchorX = this.currentAction.indexOf('l') >= 0 ? this.maxX : this.minX;
                    transformSelection.anchorY = this.currentAction.indexOf('t') >= 0 ? this.maxY : this.minY;
                }
                else {
                    transformSelection.anchorX = this.props.witdoc.transformSelection!.anchorX;
                    transformSelection.anchorY = this.props.witdoc.transformSelection!.anchorY;
                }

                var selectedPage = this.props.witdoc.selectedPage;
                if (selectedPage) {
                    transformSelection.pageOffset = $('#' + selectedPage.uid).offset();
                }
                break;
            default:

        }

        if (transformSelection !== undefined) {            
            transformSelection.singleLayer = selection.length === 1;
        }

        return transformSelection;
    }

    private cancelableResizeHandler: any;
    private cancelableScrollHandler: any;

    public componentDidMount() {
        this.props.connectDragPreview(getEmptyImage(), {
            // IE fallback: specify that we'd rather screenshot the node
            // when it already knows it's being dragged so we can hide it with CSS.
            captureDraggingState: true,
        });

        this.cancelableResizeHandler = makeCancelable(
            new Promise(r => {
                this.windowResizeHandler();
            })
        );
        this.cancelableScrollHandler = makeCancelable(
            new Promise(r => {
                this.windowResizeHandler();
            })
        );

        window.addEventListener('resize',
            this.cancelableResizeHandler.promise
            .then(() => {})
            .catch((reason: any) => console.log('cancelableResizeHandler catch error', reason.isCanceled)));

        window.addEventListener('scroll', this.cancelableScrollHandler.promise
            .then(() => { })
            .catch((reason: any) => console.log('cancelableScrollHandler catch error', reason.isCanceled)));

        window.addEventListener('mousedown', this.globalWindowMouseDownHandler);
    }

    public componentWillUnmount() {
        this.cancelableResizeHandler.cancel(); // Cancel the promise
        this.cancelableScrollHandler.cancel(); // Cancel the promise
        window.removeEventListener('mousedown', this.globalWindowMouseDownHandler);

    }

    componentWillReceiveProps(nextProps: WITSelectionProps) {
        //this.updateSelectionBeforeRendering(nextProps.selection);        
    }

    public componentWillReact() {
        //this.updateSelectionBeforeRendering();
    }

    public updateSelectionBeforeRendering(selection?:ILayer[]) {
          
        const { zoom } = this.props.settings;

        if (!selection) {
            selection = this.props.selection;
        }

        if (selection.length === 1) {
            // Handle single selection            
            let layer = selection[0];
            this.minX = Math.min(layer.x, layer.x + layer.width) * zoom;
            this.maxX = Math.max(layer.x, layer.x + layer.width) * zoom;
            this.minY = Math.min(layer.y, layer.y + layer.height) * zoom;
            this.maxY = Math.max(layer.y, layer.y + layer.height) * zoom;
            this.rotation = layer.rotation;
        }
        else {
            if (selection !== undefined) {
                // Handle multiple selection
                selection.forEach((value, index) => {
                    var actions = (value as any) as ILayerActions;
                    if (actions !== undefined) {
                        let bounds = actions.getScreenBounds();
                        //bounds.x *= zoom;
                        //bounds.y *= zoom;
                        //bounds.width *= zoom;
                        //bounds.height *= zoom;
                        if (index == 0) {
                            this.minX = Math.min(bounds.x, bounds.x + bounds.width);
                            this.maxX = Math.max(bounds.x, bounds.x + bounds.width);
                            this.minY = Math.min(bounds.y, bounds.y + bounds.height);
                            this.maxY = Math.max(bounds.y, bounds.y + bounds.height);
                        }
                        else {
                            this.minX = Math.min(this.minX, bounds.x, bounds.x + bounds.width);
                            this.maxX = Math.max(this.maxX, bounds.x, bounds.x + bounds.width);
                            this.minY = Math.min(this.minY, bounds.y, bounds.y + bounds.height);
                            this.maxY = Math.max(this.maxY, bounds.y, bounds.y + bounds.height);
                        }
                    }
                }, this);
                this.minX *= zoom;
                this.minY *= zoom;
                this.maxX *= zoom;
                this.maxY *= zoom;
                this.rotation = 0;
            }
        };
    }

    private selectionDoubleClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        const { selection } = this.props;
        if (selection.length === 1) {
            var layer = selection[0];
            // Cropping mode
            // TODO: check if the layer is pixel graphic's container
            if (layer.type === 'image') {
                (this.props.witdoc!.layerModifier as any as ILayerModifierActions).modify(LayerModifierTypes.CROP, layer);
            }
        }
    }

    textChangeHandler = () => {
        //this.forceUpdate();
        //window.setTimeout(() =>        
        //100);
        this.updateTextAreaSizeAndPosition();

    }

    onTextEditorUpdated = () => {
        //this.updateSelectionByTextEditorSize();
        this.updateTextAreaSizeAndPosition();
    }

    updateTextAreaSizeAndPosition() {
        const { selection } = this.props;
        if (selection.length === 0) return;

        const textLayer = selection[0].type === LayerObjectType.TEXT ? selection[0] :
            (selection[0].type === LayerObjectType.GROUP ? selection[0].children!.find((layer) => layer.uid === this.state.currentTextLayerId) : undefined);
        
        // Update text area styles
        if (this.textLayerEditor && textLayer) {
            const editorNode = $("#wit-text-edit");
            const editorStyle = editorNode.attr("style");
            if (editorStyle) {
                const areaNode = editorNode.siblings(".area");
                const draftEditorRootNode = editorNode.find(".DraftEditor-root");
                areaNode.attr("style", editorStyle);
                const editorWidth = draftEditorRootNode.width()!;
                const editorHeight = draftEditorRootNode.height()!;
                const editorOffset = draftEditorRootNode.offset()!;
                areaNode.width(editorWidth);
                areaNode.height(editorHeight);
                areaNode.offset(editorOffset);
                //const areaPosition = areaNode.position()!;

                //const hdlNodes = editorNode.siblings(".hdl");
                //if (hdlNodes) {
                //    hdlNodes.each((index, elem) => {
                //        const elemNode = $(elem as any);

                //        if (elemNode.hasClass("tl")) {
                //            elemNode.css({ top: areaPosition.top, left: areaPosition.left });
                //        } else if (elemNode.hasClass("t")) {
                //            elemNode.css({ top: areaPosition.top, left: areaPosition.left + editorWidth/2 });
                //        } else if (elemNode.hasClass("tr")) {
                //            elemNode.css({ top: areaPosition.top, left: areaPosition.left + editorWidth });
                //        } else if (elemNode.hasClass("r")) {

                //        } else if (elemNode.hasClass("br")) {

                //        } else if (elemNode.hasClass("b")) {

                //        } else if (elemNode.hasClass("l")) {

                //        }
                //    });
                //}
            }
        } else {
            const areaNode = $('div.wit.selection#witsel > .area');            
            areaNode.css("width", "");
            areaNode.css("height", "");
            areaNode.css("top", "");
            areaNode.css("left", "");
        }

        if(selection.length === 1) {
            const offs = $("#" + selection[0].uid).offset();
            if (offs)
                $("div.wit.selection#witsel").offset(offs);
        }        //
    }

    textChangedHandler = (editorSize: IEditorSize) => {
        // Adjust size depending on edited text
        //if (this.textLayerEditor) {
        //    const { selection } = this.props.witdoc;
        //    const { zoom } = this.props.settings;
        //    const { editorWidth, editorHeight, dx, dy } = editorSize;
        //    if (selection.length === 1) {
        //        const textLayer = selection[0] as any as TextLayer;
        //        // Round text object size to avoid unexpected shifting
        //        const selectionNode = $('.wit .selection');
        //        if (editorWidth !== undefined && Math.abs(textLayer.width - editorWidth / zoom) >= 2.0) {
        //            selectionNode.css("width", editorWidth);
        //            if (dx) {
        //                // Update left
        //                let selectionLeft = ScreenUtil.getPixelValue(selectionNode.css("left"));
        //                selectionLeft += dx / zoom;
        //                //selectionNode.css("left", `${selectionLeft}px`);
        //            }
        //        }

        //        if (editorHeight !== undefined && Math.abs(textLayer.height - editorHeight/zoom) >= 2.0) {
        //            selectionNode.css("height", editorHeight);
        //            if (dy) {
        //                // Update top
        //                let selectionTop = ScreenUtil.getPixelValue(selectionNode.css("top"));
        //                selectionTop += dy / zoom;
        //                //selectionNode.css("top", `${selectionTop}px`);
        //            }
        //        }
        //    }
        //}

        this.updateTextAreaSizeAndPosition();

        const { selection } = this.props.witdoc!;
        if (this.textLayerEditor && selection.length === 1 && selection[0].type === LayerObjectType.GROUP) {                        
            const textLayer = selection[0].children!.find((layer) => layer.uid === this.state.currentTextLayerId);
            (selection[0] as any as ILayerActions).updateGroupDimensionsByTextLayer(textLayer);
            return;
        }
    }

    updateSelectionByTextEditorSize() {
        let witsel = $('div.wit.selection#witsel');

        const { selection } = this.props;

        if (selection.length === 1 && selection[0].type === LayerObjectType.TEXT) {

         

            const editorNode = witsel.find("div#wit-text-edit > div");
            
            const w = editorNode.width() || 0;
            const h = editorNode.height() || 0;
            const w0 = witsel.width() || 0;
            const h0 = witsel.height() || 0;
            let dw = 0;
            let dh = 0;
            if (w0 !== w) {
                dw = w - w0;
                //itsel.width(w!);
            }

            if (h0 !== h) {
                dh = h - h0;
                //witsel.height(h!);
            }
        }
    }

    componentDidUpdate() {
        this.componentDidUpdateInternal();
        window.setTimeout(() => this.componentDidUpdateInternal(),50);
    }

    componentDidUpdateInternal() {
        this.updateSelectionOffsetValues();
        this.updateSelectionPosition();
        this.updateTextAreaSizeAndPosition();
    }

    updateSelectionPosition() {
        let witsel = $('div.wit.selection#witsel');

        this.updateSelectionByTextEditorSize();
        if (witsel.length > 0 && this.offsetMin) {
            const oldTransform = witsel.css('transform');
            witsel.css('transform', '');
            witsel.offset(this.offsetMin);
            witsel.css('transform', oldTransform);
        }
    }

    updateSelectionOffsetValues() {
        const { selection } = this.props;
        selection.forEach((layer, index) => {
            const elem = $("div.wit-elem#" + layer.uid)[0] as any;

            if (elem) {
                let layerRect: ClientRect | Rectangle = elem.getBoundingClientRect();
                if (selection.length > 1 && layerRect && layer.rotation) {
                    //Get rotated bounds in case of multiple selection
                    //layerRect = Rectangle.getClientRectBounds(layerRect, layer.rotation);
                }
                if (layerRect) {
                    if (index === 0) {
                        this.offsetMin = { top: layerRect.bottom, left: layerRect.right };
                        this.offsetMax = { top: layerRect.top, left: layerRect.left };
                    }
                    if (index > 0 && this.offsetMin !== undefined && this.offsetMax !== undefined) {
                        this.offsetMin.top = Math.min(this.offsetMin.top, layerRect.top);
                        this.offsetMin.left = Math.min(this.offsetMin.left, layerRect.left);

                        this.offsetMax.top = Math.max(this.offsetMax.top, layerRect.bottom);
                        this.offsetMax.left = Math.max(this.offsetMax.left, layerRect.right);
                    } else {
                        this.offsetMin = { top: layerRect.top, left: layerRect.left };
                        this.offsetMax = { top: layerRect.bottom, left: layerRect.right }
                    }
                }
            }
        }, this);
    }

    onTextLayerSelect = (textLayer: ILayer) => {
        Logger.info('on text layer select ' + textLayer.uid);
        if (this.state.currentTextLayerId) {
            const { selection } = this.props.witdoc!;
            if (selection.length === 1 && selection[0].type === LayerObjectType.GROUP) {
                const foundLayer =
                    selection[0].children!.find((layer) => layer.uid === this.state.currentTextLayerId);
                if (foundLayer) {
                    (foundLayer as any as TextLayer).updateCurrentBounds();
                }
            }
        }
        (textLayer as any as TextLayer).updateCurrentBounds();
        this.setState(_.assign({}, this.state, { currentTextLayerId: textLayer.uid  }));
    }

    onTextLayerLoseFocus = () => {
        this.setState(_.assign({}, this.state, { currentTextLayerId: undefined }));
    }

    shouldComponentUpdate(nextProps: WITSelectionProps, nextState: WITSelectionState) {
        //DnD performance fix
        if (!nextProps.isDragging && nextProps.offset !== this.props.offset)
            return false;
        return true;
    }

    public render() {
        if(!isChangingByHandle)
            this.updateSelectionBeforeRendering();
        const zoom = this.props.settings.zoom;
        const witdoc = this.props.witdoc as (IWITDoc & IWITDocActions);
        const { selection } = this.props;
        const tran = this.props.witdoc.transformSelection;
  
        var centerX: number = 0;
        var centerY: number = 0;

        if (selection.length === 0) {
            return null;
        }        

        this.props.undoredo && this.props.undoredo.undoQueue.length;
        this.props.undoredo && this.props.undoredo.redoQueue.length;        

        //if (selection.length === 1) {
        selection.forEach((layer, index) => {
                // Touch values to make mobx-react work
                layer.rotation;
                layer.width;
                layer.height;

            const elem = $("div.wit-elem#" + layer.uid)[0] as any;
            
            if (elem) {
                let layerRect: ClientRect | Rectangle = elem.getBoundingClientRect();       
                if (selection.length > 1 && layerRect && layer.rotation) {
                    //Get rotated bounds in case of multiple selection
                    //layerRect = Rectangle.getClientRectBounds(layerRect, layer.rotation);
                }
                if (layerRect) {
                    this.updateSelectionOffsetValues();
                }
            }
        }, this);
        //}
        //Calculate transform
        let style: React.CSSProperties = {
        };
        let transformStr = '';

        var selectedPage:any = witdoc.selectedPage;

        var offsetWidth: number = 0;
        var offsetHeight: number = 0;
        var layerWidth: number = (this.maxX - this.minX);
        var layerHeight: number = (this.maxY - this.minY);

        //console.log("layer width before:", layerWidth);

        if (this.offsetMin && this.offsetMax) {
            offsetWidth = this.offsetMax.left - this.offsetMin.left;
            offsetHeight = this.offsetMax.top - this.offsetMin.top;
            if (selection.length === 1) {
                centerX = this.offsetMin.left + offsetWidth / 2;
                centerY = this.offsetMin.top + offsetHeight / 2;

                if (tran!.isTransforming && selection.length === 1) {
                    var wStr = $("div.wit-elem#" + selection[0].uid).css("width");
                    var hStr = $("div.wit-elem#" + selection[0].uid).css("height");
                    layerWidth = +wStr.substr(0, wStr.length - 2);
                    layerHeight = +hStr.substr(0, hStr.length - 2);
                    //console.log("measured layer width", layerWidth);
                }

                this.offsetMin.left = centerX - layerWidth / 2; // * zoom;
                this.offsetMin.top = centerY - layerHeight / 2; // * zoom;
            } else {
                layerWidth = offsetWidth;
                layerHeight = offsetHeight;
            }
            let witsel = $('div.wit.selection#witsel');

            if (witsel.length > 0) {
                const oldTransform = witsel.css('transform');
                witsel.css('transform', '');
                witsel.offset(this.offsetMin);
                witsel.css('transform', oldTransform);
            } else {
                //Need to update twice otherwise position is off (offset is not calculated properly)
                //this.forceUpdate();
            }
        }

        var deltaRotation = 0;
        if (tran!.isTransforming) {
            if (tran!.deltaRotation !== undefined) {
                deltaRotation = tran!.deltaRotation || 0;
            }
        }

        /// Use transform properties to react accordingly
        if (tran!.offsetX !== undefined && tran!.offsetY !== undefined && tran!.deltaRotation !== undefined) {
            //console.log('transformin now');
        }

            //transformStr += `translate(${mx}px, ${my}px)`;

        if (this.rotation) {
            transformStr = ` rotateZ(${this.rotation + deltaRotation}deg)` + transformStr;
        }

        if (transformStr) {
            style.transform = transformStr;
        }

        style.width = layerWidth + 'px';
        style.height = layerHeight + 'px';

        //console.log('layer width is: ', layerWidth, this);

        let containerStyle: React.CSSProperties = {
            display: (selection === undefined || selection.length === 0) ? 'none' : 'block'
        };

        if (witdoc.selectionDisabled) {
            containerStyle.pointerEvents = "none";
            containerStyle.userSelect = "none";
        }

        let canStretchH = false;
        let canStretchV = false;
        let canStretchHV = true;
        let textLayer: TextLayer | undefined = undefined;
        let isLayerInAGroup = false;
        let textEditorStyle: React.CSSProperties | undefined = undefined;

        if (selection.length === 1) {
            textLayer = selection[0].type === LayerObjectType.TEXT ? selection[0] as any as TextLayer : undefined;

            if (!textLayer && selection[0].type === LayerObjectType.GROUP) {
                textLayer =
                    selection[0].children!.find((layer) => layer.uid === this.state.currentTextLayerId) as any as
                    TextLayer;
                if (textLayer) {
                    isLayerInAGroup = true;
                    textEditorStyle = {
                        left: textLayer.x * zoom,
                        top: textLayer.y * zoom,
                        transform: `rotateZ(${textLayer.rotation}deg)`
                    };
                }
            } else {

            }

            if (textLayer) {
                canStretchH = textLayer.writingMode !== WritingMode.Vertical;
                canStretchV = textLayer.writingMode === WritingMode.Vertical;
                canStretchHV = true;
            } else {                
                var gitem = (selection[0] as any as ILayerActions).getLoadingData();
                if (gitem && gitem.parser) {
                    canStretchH = gitem.parser.canStretchHorizontally;
                    canStretchV = gitem.parser.canStretchVertically;
                } else {

                }
            }
        }

        let rotationRad = selection.length > 1 ? 0 : (deltaRotation + selection[0].rotation) / 180 * Math.PI;
        var result = <div draggable={!this.state.isHandleOver}
            className='wit draggable'
            style={containerStyle}
            onDoubleClick={(e) => this.selectionDoubleClickHandler(e)}>
            <div className='wit selection' id='witsel' style={style} >
                <SelectionArea selection={selection}
                    zoom={zoom}
                    style={textLayer !== undefined ? textEditorStyle : undefined}
                    onSelect={(textLayer) => this.onTextLayerSelect(textLayer)} />
                {textLayer !== undefined && <TextLayerEditor ref={(textLayerEditor) => this.textLayerEditor = textLayerEditor} style={textEditorStyle}
                    transformSelection={this.props.witdoc!.transformSelection}
                    textLayer={textLayer} onChange={this.textChangeHandler}
                    onChanged={(editorSize) => this.textChangedHandler(editorSize)}
                    onUpdated={() => this.onTextEditorUpdated()}
                    active={textLayer && isLayerInAGroup} />}
                {/* Filter handles depending on selection */}
                {selection.length === 1 && canStretchHV &&
                    <a className='hdl tl'                       
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.TopLeft, rotationRad) }}
                    onDragStart={(e)=>e.preventDefault()}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseDown={e => this.handleMouseDown(e)}
                        onMouseUp={this.handleMouseUp} ><div /></a>}
                {selection.length === 1 && canStretchV &&
                    <a className='hdl t'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.Top, rotationRad) }}
                       onDragStart={(e) => e.preventDefault()}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseDown={e => this.handleMouseDown(e)}
                        onMouseUp={this.handleMouseUp} ><div /></a>}
                {selection.length == 1 && canStretchHV &&
                    <a className='hdl tr'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.TopRight, rotationRad) }}
                       onDragStart={(e) => e.preventDefault()}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseDown={e => this.handleMouseDown(e)}
                        onMouseUp={this.handleMouseUp} ><div /></a>}
                {selection.length == 1 && canStretchH &&
                    <a className='hdl r'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.Right, rotationRad) }}
                       onDragStart={(e) => e.preventDefault()}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseDown={e => this.handleMouseDown(e)}
                        onMouseUp={this.handleMouseUp} ><div /></a>}
                {canStretchHV &&
                    <a className='hdl br'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.BottomRight, rotationRad) }}
                       onDragStart={(e) => e.preventDefault()}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseDown={e => this.handleMouseDown(e)}
                        onMouseUp={this.handleMouseUp} ><div /></a>
                    /*<Handle cursorPosition={CursorPosition.BottomRight} rotationRad={rotationRad} />*/}
                {selection.length == 1 && canStretchV && <a className='hdl b'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.Bottom, rotationRad) }}
                    onDragStart={(e) => e.preventDefault()}
                    onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}
                    onMouseDown={e => this.handleMouseDown(e)}
                    onMouseUp={this.handleMouseUp} ><div /></a>}
                {/*<a className='hdl bl'></a>*/}
                {selection.length == 1 && canStretchH && <a className='hdl l'
                    style={{ cursor: CursorUtil.getBiDirectionalResizeCursorClass(CursorPosition.Left, rotationRad) }}
                    onDragStart={(e) => e.preventDefault()}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    onMouseDown={e => this.handleMouseDown(e)}
                    onMouseUp={this.handleMouseUp} ><div /></a>}
                {selection.length == 1 && <a className='hdl rot'
                    onDragStart={(e) => e.preventDefault()}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    onMouseDown={e => this.handleMouseDown(e)}
                    onMouseUp={this.handleMouseUp} ><div /></a>}
            </div>
        </div>;

        //if (textLayer !== undefined && !textLayer.cursorFocus) {
        //    return result;
        //}

        if (this.props.witdoc.selectionDisabled) return result;

        return this.props.connectDragSource(result);
    }
}

export default DragSource('layer', nodeSourceSpec, nodeSourceCollector)(WITSelection) as any;