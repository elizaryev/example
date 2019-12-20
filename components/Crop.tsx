import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Transition } from 'semantic-ui-react';
import * as interact from 'interact.js';
import { ILayer, ILayerActions } from '../store/Layer';
import { IRect } from '../store/model';
import { inject, observer } from 'mobx-react';
import { IWITDoc } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';
import ScreenUtil from '../utils/ScreenUtil';
import * as $ from 'jquery';

interface CropProps {
    layer?: ILayer,
    witdoc?: IWITDoc,
    docSettings?: IWITDocSettings,
}

/**
 * Manually applied translation is attached by 'translate' transform of selection and original image
 * Width and height are applied by 'data-width' and 'data-height' attributes.
 */
@inject("witdoc", "localize", "docSettings")
@observer
export default class CropWindow extends React.Component<CropProps, any> {

    private contentDiv: HTMLDivElement | null = null;

    private originalRect?: IRect;
    private croppingRect?: IRect;
    private offset?: JQuery.Coordinates;
    private transform?: string;
    private zoom: number = 1;
    private originalX: number = 0;
    private originalY: number = 0;
    private originalWidth: number = 0;
    private originalHeight: number = 0;
    private currentAction = '';

    //private updateOffset(props: CropProps) {
    //    if (!props.layer) {
    //        return;
    //    }
    //    this.offset = $('div#' + props.layer!.uid).offset();
    //    this.transform = $('div#' + props.layer!.uid).css("transform");
    //}

    private handleMouseEnter = () => {
        //var localState: WITSelectionState = { isHandleOver: true };
        //this.setState(localState);
    }

    private handleMouseLeave = () => {
        //var localState: WITSelectionState = { isHandleOver: false };
        //this.setState(localState);
    }

    private handleMouseUp = () => {

    }

    private handleMouseDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
        //this.mouseDownScreenX = e.pageX;
        //this.mouseDownScreenY = e.pageY;
        //this.selectionRect = $("div.wit.selection > .area")[0].getBoundingClientRect();
        //this.selectionCenterX = this.selectionRect.left + this.selectionRect.width / 2;
        //this.selectionCenterY = this.selectionRect.top + this.selectionRect.height / 2;
        ////($("div.wit-elem#" + layer.uid)[0] as any).getBoundingClientRect();
        //$('body').css('cursor', $(e.currentTarget).children('div').css('cursor'));
        //$(window).on('mouseup', $.proxy(this.windowMouseUpHandler, this));
        //$(window).on('mousemove', $.proxy(this.windowMouseMoveHandler, this));

        //// 2nd class is an action
        if (e.currentTarget.classList.length >= 2) {
            this.currentAction = e.currentTarget.classList[1];            
        }
        //this.updateAnchors = true;

    }

    public render() {
        var layer = this.props.layer;
        var layerActions = layer as any as ILayerActions;
        if (this.props.witdoc!.selection.length == 0 || !layer) {
            return null;
        }
        this.zoom = this.props.docSettings ? this.props.docSettings.zoom : 1;

        var dataParams: any = {};

        if (!this.originalRect) {
            if (layer.croppingArea) {
                this.originalRect = layer.croppingArea;
                this.croppingRect = {
                    x: 0,
                    y: 0,
                    width: layer.width,
                    height: layer.height
                };
            }
            else {
                this.originalRect = {
                    x: 0,
                    y: 0,
                    width: layer.unscaledWidth,
                    height: layer.unscaledHeight
                };
                this.croppingRect = {
                    x: layer.width/3,
                    y: layer.height/3,
                    width: layer.width/3,
                    height: layer.height/3
                }

                //dataParams["data-x"] = layer.unscaledWidth / 3 * layerActions.getScaleX();
                //dataParams["data-y"] = layer.unscaledHeight / 3 * layerActions.getScaleY();
                //dataParams["data-width"] = layer.unscaledWidth / 3 * layerActions.getScaleX();
                //dataParams["data-height"] = layer.unscaledHeight / 3 * layerActions.getScaleY();

            }
        }

        this.originalWidth = this.originalRect.width * this.zoom * layerActions.getScaleX();
        this.originalHeight = this.originalRect.height * this.zoom * layerActions.getScaleY();

        var style: React.CSSProperties = {
            width: this.originalWidth + "px",
            height: this.originalHeight + "px"
        }

        this.originalX = this.originalRect.x * this.zoom * layerActions.getScaleX();
        this.originalY = this.originalRect.y * this.zoom * layerActions.getScaleY();
        style.left = this.originalX + "px";
        style.top = this.originalY + "px";    

        var contentStyle: React.CSSProperties = {
            width: layer.width * this.zoom + "px",
            height: layer.height * this.zoom + "px"
        }
        //if (layer.rotation) {
        //    style.transform = "rotateZ(" + layer.rotation + "deg)";
        //}

        const layerSrc = layerActions.getSrc();

        //dimmed class means that the element will block keyboard shortcuts
        return <div className='wit-cropping dimmed' >
                <div className='bg' />
                <div className='content' ref={(contentDiv) => { this.contentDiv = contentDiv; }} style={contentStyle}>
                    <img src={layerSrc || '/my-gallery/item75.jpg'} style={style} />
                    <div className='wit-custom-sel' {...dataParams} >
                        <a className='hdl tl' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}
                            onMouseDown={e => this.handleMouseDown(e)} onMouseUp={this.handleMouseUp} ><div /></a>
                        <a className='hdl tr' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}
                            onMouseDown={e => this.handleMouseDown(e)} onMouseUp={this.handleMouseUp} ><div /></a>
                        <a className='hdl br' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}
                            onMouseDown={e => this.handleMouseDown(e)} onMouseUp={this.handleMouseUp} ><div /></a>
                        <a className='hdl bl' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}
                            onMouseDown={e => this.handleMouseDown(e)} onMouseUp={this.handleMouseUp} ><div /></a>
                    </div>
                </div>
            </div>;
    }

    public componentDidUpdate() {
        this.updateContentByTimer();
    }

    public componentDidMount() {
        this.updateContentByTimer();
    }

    public componentWillUnmount() {
        interact('div.wit-custom-sel').unset();
    }

    private dragResizeStart(event: any) {
        var selElement = $('div.wit-custom-sel');
        var width = ScreenUtil.getPixelValue(selElement.css('width'));
        var height = ScreenUtil.getPixelValue(selElement.css('height'));
        selElement.attr('data-width', width / this.zoom);
        selElement.attr('data-height', height / this.zoom);
    }

    private updateContentByTimer() {
        var layer = this.props.layer!;
        var zoom = this.zoom;        
        var ths = this;
        var selElement = $('div.wit-custom-sel');
        var dx = 0;
        var dy = 0;
        var dw = 0;
        var dh = 0;
        interact('div.wit-custom-sel')
            .draggable({
                max: Infinity
            })
            .resizable({
                // resize from all edges and corners
                edges: { left: true, right: true, bottom: true, top: true },

                // keep the edges inside the parent
                restrictEdges: {
                    outer: 'parent',
                    endOnly: true,
                },

                // minimum size
                restrictSize: {
                    min: { width: 100, height: 50 },
                },
                allowFrom: '.hdl',
                inertia: true,
            })
            .on('resizestart', (event:any) => this.dragResizeStart(event))
            .on('resizemove', function (event: any) {
                var minSize = 10;
                var top = ScreenUtil.getPixelValue(selElement.css('top'));
                var left = ScreenUtil.getPixelValue(selElement.css('left'));
                var width = +(selElement.attr('data-width') || 0);
                var height = +(selElement.attr('data-height') || 0);

                var datax = parseFloat(selElement.attr('data-x') || '0') * zoom;
                var datay = parseFloat(selElement.attr('data-y') || '0') * zoom;

                //var dataw = parseFloat(selElement.attr('data-width') || '0') * zoom;
                //var datah = parseFloat(selElement.attr('data-height') || '0') * zoom;

                var deltaX = (event.pageX - event.x0) / zoom;
                var deltaY = (event.pageY - event.y0) / zoom;

                var r = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * zoom;
                var angle = Math.atan2(deltaY, deltaX) - layer.rotation / 180 * Math.PI;
                dx = r * Math.cos(angle);
                dy = r * Math.sin(angle);

                dw = width*zoom;
                dh = height*zoom;

                var anchorX = left + datax;
                var anchorY = top + datay;
                var signX = 1, signY = 1;



                if (ths.currentAction.indexOf('l') >= 0) {
                    dw -= dx;
                    dx += datax;

                    var minX = -left + ths.originalX;
                    if (dx < minX) {
                        dw -= minX - dx;
                        dx = minX;
                    }

                    if (dw < minSize) {
                        dx -= minSize - dw;
                        dw = minSize;
                    }
                }
                else if (ths.currentAction.indexOf('r') >= 0){
                    dw += dx;
                    dx = datax;
                    var maxw = -left + ths.originalX + ths.originalWidth - dx;
                    if (dw > maxw) {
                        dw = maxw;
                    }

                    if (dw < minSize) {
                        dw = minSize;
                    }
                }

                if (ths.currentAction.indexOf('t') >= 0) {
                    dh -= dy;
                    dy += datay;

                    var minY = -top + ths.originalY;
                    if (dy < minY) {
                        dh -= minY - dy;
                        dy = minY;
                    }

                    if (dh < minSize) {
                        dy -= minSize - dh;
                        dh = minSize;
                    }
                }
                else if (ths.currentAction.indexOf('b') >= 0) {
                    dh += dy;
                    dy = datay;
                    var maxh = -top + ths.originalY + ths.originalHeight - dy;
                    if (dh > maxh) {
                        dh = maxh;
                    }

                    if (dh < minSize) {
                        dh = minSize;
                    }
                }



                selElement.css('transform', 'translate(' + dx + 'px, ' + dy + 'px)');
                selElement.css('width', dw + 'px');
                selElement.css('height', dh + 'px');

            })
            .on('resizeend', function (event: any) {
                selElement.attr('data-x', dx / zoom).attr('data-y', dy / zoom);                
                selElement.attr('data-width', dw / zoom).attr('data-height', dh / zoom);                
            })
            .on('dragstart', (event:any) => this.dragResizeStart(event))
            .on('dragmove', function (event: any) {
                //console.log(event);                
                var top = ScreenUtil.getPixelValue(selElement.css('top'))
                var left = ScreenUtil.getPixelValue(selElement.css('left'))

                var datax = parseFloat(selElement.attr('data-x') || '0') * zoom;
                var datay = parseFloat(selElement.attr('data-y') || '0') * zoom;
                var width = +(selElement.attr('data-width') || 0);
                var height = +(selElement.attr('data-height') || 0);
                //top += datay;
                //left += datax;

                var deltaX = (event.pageX - event.x0) / zoom;
                var deltaY = (event.pageY - event.y0) / zoom;

                var r = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * zoom;
                var angle = Math.atan2(deltaY, deltaX) - layer.rotation / 180 * Math.PI;
                dx = r * Math.cos(angle);
                dy = r * Math.sin(angle);

                dx += datax;
                dy += datay;

                if (top + dy < ths.originalY) {
                    dy = ths.originalY - top;
                }

                if (left + dx < ths.originalX) {
                    dx = ths.originalX - left;
                }

                if (left + dx + width*zoom > ths.originalX + ths.originalWidth) {
                    dx = ths.originalX + ths.originalWidth - left - width*zoom;
                }

                if (top + dy + height*zoom > ths.originalY + ths.originalHeight) {
                    dy = ths.originalY + ths.originalHeight - top - height*zoom;
                }

                selElement.css('transform', 'translate(' + dx + 'px, ' + dy + 'px)');
                
            })
            .on('dragend', function (event: any) {
                //selElement.attr('data-x', '').attr('data-y', '');
                selElement.attr('data-x', dx / zoom).attr('data-y', dy / zoom);
            });
        
        this.updateContent();
        setTimeout(() => {
            this.updateContent();
        }, 20);
    }

    private updateContent() {
        //this.updateOffset(this.props);
        var layer = this.props.layer!;
        this.offset = $('div#' + this.props.layer!.uid).offset();
        this.transform = $('div#' + this.props.layer!.uid).css("transform");
        if (this.offset !== undefined && this.contentDiv !== null) {
            var nd = ReactDOM.findDOMNode(this.contentDiv);
            var transformValues = ScreenUtil.getTransformValues('div#' + this.props.layer!.uid);
            if (nd) {
                $(nd).offset(this.offset);
                if (this.transform !== undefined && this.transform != "none") {
                    $(nd).css('transform', 'rotateZ(' + this.props.layer!.rotation + 'deg) ')
                    //$(nd).css("transform", this.transform);
                    //$(nd).siblings('.wit-custom-sel').css("transform", this.transform);
                }
                // We are expecting pixel values
                var left = this.croppingRect!.x * this.zoom;
                var top = this.croppingRect!.y * this.zoom;
            
                //if () {
                var selElement = $(nd).children('div.wit-custom-sel');
                var cropWidth = (+(selElement.attr('data-width') || 0) || this.croppingRect!.width) * this.zoom;
                var cropHeight = (+(selElement.attr('data-height') || 0) || this.croppingRect!.height) * this.zoom;
                selElement   //.css('transform', 'rotateZ(' + this.props.layer!.rotation + 'deg) ')
                    .css('width', cropWidth + 'px')
                    .css('height', cropHeight + 'px')
                    .css('top', top + 'px').css('left', left + 'px');                
                //$(nd).children('.wit-custom-sel').offset(this.offset);

                var datax = selElement.attr('data-x');
                var datay = selElement.attr('data-y');

                if (datax !== undefined && datay !== undefined) {
                    selElement.css('transform', 'translate(' + parseFloat(datax) * this.zoom + 'px, ' + parseFloat(datay) * this.zoom + 'px)');
                }
            }
            //$(nd).children('img').offset($('div#' + this.props.layer!.uid + ">img").offset()!);

            //}
            //this.offset = undefined;
        }
    }
}
