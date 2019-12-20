import * as $ from 'jquery';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { ColorResult } from 'react-color';
import EnhancedTwitterPicker from "./EnhancedTwitterPicker";
import { NumberPicker } from 'react-widgets';
import { Form, Grid, Icon, InputOnChangeData, Transition, Button, Popup, Checkbox } from 'semantic-ui-react';
import { TransformTypes } from '../constants';
import '../css/ColorPicker.less';
import { ILayer, ILayerActions, Layer, LayerObjectType } from '../store/Layer';
import { ILocalizeStore } from '../store/Localize';
import { TextLayer } from '../store/TextLayer';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings, IWITDocSettingsActions } from '../store/WITDocSettings';
import ScreenUtil from '../utils/ScreenUtil';
import MathUtil from '../utils/MathUtil';
import TextPropertyWindow from './TextPropertyWindow';
import {maxGraphicScale, graphicConfig} from "conf";
import { AlignmentType, ICanvasActions, LayerDepth } from "../store/Canvas";
import { Rectangle } from "../store/model";
import EnhancedButton from "./EnhancedButton";
import ClipboardToolbar from "./ClipboardToolbar";
import LayerSizeGrid from "./LayerSizeGrid";
import SlideStepper from "./SlideStepper";
import { PropwinAlignmentPopup, PropwinAlignmentStagePopup } from "./PropwinPopup";
import TextSpacingPopup from "./TextSpacingPopup";
import * as _ from "lodash";
import { ILayerModifierActions, LayerModifierTypes } from "../store/LayerModifier";
import WdmColorPicker from "./ColorPicker/WdmColorPicker";


var numberLocalizer = require('react-widgets-simple-number') as Function;
numberLocalizer();

interface PropertyWindowProps {
    selection: ILayer[],
    witdoc?: IWITDoc & IWITDocActions,
    docSettings?: IWITDocSettings,
    onHidden?: () => void;
    onShow?: () => void;
}

interface CPickerState {
    showPicker: boolean,
    selectedColorId?: number,
    isStrokePicker?: boolean
}

@inject('localize', 'witdoc', 'docSettings')
@observer
export default class PropertyWindow extends React.Component<PropertyWindowProps & ILocalizeStore, CPickerState> {

    maxWidth = 0;
    maxHeight = 0;

    constructor(props: PropertyWindowProps & ILocalizeStore) {
        super(props);
        this.state = {
            showPicker: false,
            selectedColorId: -1
        }
    }

    private windowMouseUpHandler(e: JQuery.Event) {
        $(window).off('mousedonw', this.windowMouseUpHandler);
        if (!$(e.target).parents('.cpicker').length) {
            this.setState({
                showPicker: false
            });
        }
    }

    private renderButtons(isStrokeButtons: boolean = false) {

        var defaultColorPalette = this.props.docSettings ? this.props.docSettings.defaultColorPalette : [];

        if (this.props.selection.length != 1) {
            return null;
        }

        if (isStrokeButtons && !this.props.selection[0].strokes) {
            return null;
        }

        let colors = isStrokeButtons ?
            this.props.selection[0].strokes!.map((value) => value.stroke) : 
            this.props.selection[0].fillColors;

        if (colors === undefined) {

            if (this.props.selection[0].type === LayerObjectType.TEXT) {
                colors = [(this.props.selection[0] as TextLayer).extractFillColors()[0]];
            } else {
                return null;
            }
        }

        // Allow no more than 5 colors
        if (colors.length > 5) {
            return null;
        }

        return colors.map((value, index) => {
            var colorBtnClassName = "ui button";
            var style: React.CSSProperties = {                
            };

            if (value == "none") {
                colorBtnClassName += " col-none";
            } else {
                style.backgroundColor = value;
            }

            var selectColor = (index: number) => {
                console.log(this.refs['picker_' + index]);
                this.setState({
                    showPicker: true,
                    selectedColorId: index,
                    isStrokePicker: isStrokeButtons
                });
                $(window).on('mousedown', $.proxy(this.windowMouseUpHandler, this));
            }

            return <div key={index} className='pbtn'>
                <div className={colorBtnClassName} style={style} onTouchStart={() => selectColor(index)} onMouseDown={() => selectColor(index)} />
                {this.state.showPicker && this.state.isStrokePicker == isStrokeButtons && this.state.selectedColorId == index ? <div className='cpicker-body'>
                    <WdmColorPicker ref={'picker_' + index} colors={defaultColorPalette.slice()} color={value}
                        onChange={(color) => this.changeColorHandler(color, isStrokeButtons)}/>
                </div> : null} </div>;
        }, this);
    }

    private changeColorHandler(color: ColorResult, isStrokeColor: boolean) {
        if (isStrokeColor) {
            (this.props.selection[0] as any as ILayerActions).setStroke({stroke:color.hex}, this.state.selectedColorId || 0);
        } else {
            (this.props.selection[0] as any as ILayerActions).setFillColor(color.hex, this.state.selectedColorId || 0);
        }

        (this.props.docSettings as any as IWITDocSettingsActions).applyDefaultFillColor(this.props.selection[0].type || "", color.hex);
    }

    private strokeWidthChangeHandler(strokeWidthVal: number | undefined) {
        if (strokeWidthVal === undefined) {
            return;
        }
        if (this.props.selection.length > 0 && this.props.selection[0].strokes) {
            this.props.selection[0].strokes!.forEach((value, index) => {
                this.props.selection.forEach((value) => {
                    (value as any as ILayerActions).setStroke({ strokeWidth: strokeWidthVal });
                });
            });
        }
    }

    private rotationChangeHandler(value: number | undefined) {
        if (this.props.selection.length > 0) {
            var transformSelection: ITransformSelection = {
                type: TransformTypes.ROTATE,
                isTransforming: true, 
                rotation: value === undefined ? 0 : value
            }
            console.log(this.props.witdoc!.transformSelection);
            this.props.witdoc!.applyTransform(transformSelection);
            transformSelection.isTransforming = false;
            if (this.props.witdoc && this.props.witdoc.transformSelection) {
                this.props.witdoc.transformSelection.setTransform(transformSelection);
            }
        }
    }

    private layerScaleChangeHandler(value: number | undefined) {
        if (this.props.selection.length > 0) {
            const val = value === undefined ? 1 : (value/100);
            const layer = this.props.selection[0];
            const transformSelection: ITransformSelection = {
                type: "",
                isTransforming: true,
                scaleX: val,
                scaleY: val
            }
            console.log(this.props.witdoc!.transformSelection);
            this.props.witdoc!.applyTransform(transformSelection);
            transformSelection.isTransforming = false;
            if (this.props.witdoc && this.props.witdoc.transformSelection) {
                this.props.witdoc.transformSelection.setTransform(transformSelection);
            }
        }
    }

    private sizeChangeHandler(value: number, isWidth: boolean, keepRatio: boolean) {
        if (!value || this.props.selection.length === 0) return;

        const { units } = this.props.docSettings;

        const transformSelection: ITransformSelection = {
            type: '',
            isTransforming: true,            
        }

        //const val = value * graphicConfig.defaultBrowserScreenDpi / 25.4;
        const val = ScreenUtil.getPixelValueByUnitValue(value, units);
        const layer = this.props.selection[0];
        const ratio = (layer.width / layer.unscaledWidth) / (layer.height / layer.unscaledHeight);
        //const maxWidth = this.maxWidth * graphicConfig.defaultBrowserScreenDpi / 25.4;
        //const maxHeight = this.maxHeight * graphicConfig.defaultBrowserScreenDpi / 25.4;
        const maxWidth = ScreenUtil.getPixelValueByUnitValue(this.maxWidth, units);
        const maxHeight = ScreenUtil.getPixelValueByUnitValue(this.maxHeight, units);
        if (isWidth) {
            transformSelection.scaleX = val / layer.unscaledWidth;
            if (keepRatio) {
                transformSelection.scaleY = transformSelection.scaleX / ratio;
            }
        } else {
            transformSelection.scaleY = val / layer.unscaledHeight;
            if (keepRatio) {
                transformSelection.scaleX = transformSelection.scaleY * ratio;
            }
        }   

        if (transformSelection.scaleX && layer.unscaledWidth * transformSelection.scaleX > maxWidth) {
            transformSelection.scaleX = maxWidth / layer.unscaledWidth;
            if (keepRatio) {
                transformSelection.scaleY = transformSelection.scaleX / ratio;
            }
        }

        if (transformSelection.scaleY && layer.unscaledHeight * transformSelection.scaleY > maxHeight) {
            transformSelection.scaleY = maxHeight / layer.unscaledHeight;
            if (keepRatio) {
                transformSelection.scaleX = transformSelection.scaleY * ratio;
            }
        }

        this.props.witdoc!.applyTransform(transformSelection);

    }

    alphaChangeHandler(value: number) {
        const witdoc = this.props.witdoc!;
        const transformSelection: ITransformSelection = {
            type: '',
            isTransforming: true,
            alpha: (+value)/100
        }
        witdoc.applyTransform(transformSelection);

        (this.props.docSettings as any as IWITDocSettingsActions).applyDefaultAlpha((+value)/100);

    }

    setLayersDepth(e: React.MouseEvent<HTMLButtonElement>, depth: LayerDepth) {
        e.preventDefault();
        e.stopPropagation();
        const selectedPage = this.props.witdoc!.selectedPage;
        if (this.props.selection && selectedPage)
            (selectedPage.selectedCanvas! as any as ICanvasActions).arrangeLayers(this.props.selection, depth);
    }

    deleteSelection() {
        (this.props.witdoc as IWITDocActions).removeLayers(this.props.selection);
    }

    lockUnlockLayers(layers: ILayer[], value?: boolean) {
        layers.forEach((layer) => (layer as any as ILayerActions).setLocked(value === undefined ? !layer.locked : value));
    }

    btnCropClickHandler() {
        (this.props.witdoc!.layerModifier as any as ILayerModifierActions).modify(LayerModifierTypes.CROP, this.props.selection[0]);
    }

    public render() {
        const { selection, docSettings, onHidden, onShow} = this.props;
        var layer = this.props.selection.length > 0 ? this.props.selection[0] as Layer : undefined;
        var rotation = 0;
        var scaleX = 0;
        var scaleY = 0;
        var alpha = 100;

        //Width and height values are in units defined by settings
        let currentWidth = 0;
        let currentHeight = 0;
        if (layer !== undefined) {
            if (this.props.witdoc && this.props.witdoc.transformSelection && this.props.witdoc.transformSelection.isTransforming) {
                this.props.witdoc.transformSelection.isTransforming;
                this.props.witdoc.transformSelection.deltaRotation;
                this.props.witdoc.transformSelection.width;
                this.props.witdoc.transformSelection.height;
                this.props.witdoc.transformSelection.offsetX;
                this.props.witdoc.transformSelection.offsetY;
                var screenTransform = ScreenUtil.getElementTransformValues(layer.uid);
                rotation = screenTransform.rotation;
                scaleX = screenTransform.width / layer.unscaledWidth * 100;
                scaleY = screenTransform.height / layer.unscaledHeight * 100;
            }
            else {
                rotation = layer.rotation;
                scaleX = layer.getScaleX() * 100;
                scaleY = layer.getScaleY() * 100;                
            }
            alpha = Math.round(layer.alpha * 100);

            if (layer.type === LayerObjectType.IMAGE) {
                this.maxWidth = ScreenUtil.getUnitValue(layer.unscaledWidth, docSettings!.units);
                this.maxHeight = ScreenUtil.getUnitValue(layer.unscaledHeight, docSettings!.units);
            } else {
                this.maxWidth = this.maxHeight = 10000;
            }

            currentWidth = ScreenUtil.getUnitValue(layer.unscaledWidth * scaleX / 100, docSettings!.units);
            currentHeight = ScreenUtil.getUnitValue(layer.unscaledHeight * scaleY / 100, docSettings!.units);
        }
        const { translate, trn } = this.props.localize!;
        var layerModifier = this.props.witdoc!.layerModifier;

        const canChangeFill = layer && (layer.type == LayerObjectType.TEXT || (layer.fillColors && layer.fillColors.length > 0));
        const canChangeStrokes = layer && layer.strokes && layer.strokes.length > 0;
        let fillPickers: JSX.Element[] | null = null;
        let strokePickers: JSX.Element[] | null = null;

        if (canChangeFill) {
            fillPickers = this.renderButtons();
        }
        if (canChangeStrokes) {
            strokePickers = this.renderButtons(true);
        }

        let isSelectionLocked = selection.length > 0;
        if (selection.length > 0) {
            selection.forEach((layer) => isSelectionLocked = isSelectionLocked && layer.locked === true);
        }

        let layerScale = 100;
        const isTextLayer = (this.props.selection.length === 1 &&
        (this.props.selection[0].type === LayerObjectType.TEXT ||
            this.props.selection[0].type === LayerObjectType.GROUP));
        const buttonAreaWidth = (canChangeFill && fillPickers !== null && !isTextLayer) ? (canChangeStrokes ? 5 : 7) : 6;

        let layerType = "";
        if (layer) {
            layerType = layer.type || "";
            layerScale = Math.round(layer.width / layer.unscaledWidth * 100);
        }

        return <Transition animation='slide down' duration={200}
                           visible={this.props.selection.length > 0 && !layerModifier!.isModifying}
                           mountOnShow={false} unmountOnHide={true}
                        onHide={() => onHidden && onHidden()}
                        onShow={() => onShow && onShow()}>
                   <div className='wit-propwin'>
                       <Grid divided verticalAlign="middle">
                        {(canChangeStrokes && strokePickers !== null) &&
                            <Grid.Column mobile={9} tablet={6} computer={2} className='cpicker stroke'>
                                <div className="lbl-color">{translate("propwin.lblStroke")}</div>
                                {this.renderButtons(true)}
                                <div className="text-no-wrap">
                                    <SlideStepper min={0} max={40} defaultValue={1}
                                        value={layer!.strokes![0].strokeWidth} precision={0}
                                        onChange={(value) => this.strokeWidthChangeHandler(value)}
                                        title={trn("propwin.lblLineWeight")} units={trn("propwin.lblPt")} />
                                </div>
                            </Grid.Column>}
                        {(canChangeFill && fillPickers !== null) &&
                            <Grid.Column mobile={9} tablet={6} computer={2} className='cpicker'>
                                <div className="lbl-color">{translate("propwin.lblColor")}</div>
                                {this.renderButtons()}
                                <div className="text-no-wrap">&nbsp;</div>
                            </Grid.Column>}
                    {(this.props.selection.length === 1 && (this.props.selection[0].type === LayerObjectType.TEXT || this.props.selection[0].type === LayerObjectType.GROUP)) &&
                        <TextPropertyWindow selection={this.props.selection}/>}
                    {!isTextLayer && <Grid.Column mobile={9} tablet={5} computer={3} className="propgrid-size-parent">                        
                        {selection.length === 1 && <LayerSizeGrid width={currentWidth} height={currentHeight}
                            maxWidth={this.maxWidth} maxHeight={this.maxHeight}
                            units={docSettings!.units}
                            sizeChangeHandler={(value, isWidth, keepScale) => this.sizeChangeHandler(value, isWidth, keepScale)} />}
                           </Grid.Column>}                          
                    {/*translate('propwin.lblAlpha')} {alpha.toString()}{translate('propwin.lblPercent')*/}
                    <Grid.Column width={(this.props.selection.length === 1 && isTextLayer) ? 3 : 3}
                        className={!(this.props.selection.length === 1 && isTextLayer) ? "propgrid-alpha-fixed" : ""}>
                        <Grid.Row>
                            <SlideStepper title={trn("propwin.lblAlpha")} min={0} max={100} step={1} value={alpha}
                                onChange={(value) => this.alphaChangeHandler(value || 0)}/>
                        </Grid.Row>
                        <Grid.Row>
                            <SlideStepper title={trn("propwin.lblRotation")} units={trn("propwin.lblDegree")}
                                min={-180} max={180} step={1} value={rotation}
                                onChange={(value) => this.rotationChangeHandler(value || 0)}/>
                        </Grid.Row>
                        {this.props.selection.length === 1 &&
                            (layerType === LayerObjectType.TEXT || layerType === LayerObjectType.VECTOR) &&
                            /* So far scale is only available for text and vector objects*/
                            <Grid.Row>
                                <SlideStepper title={trn("propwin.lblTextScale")} units={trn("propwin.lblPercent")}
                                              min={1} max={layer ? (layer.type === LayerObjectType.IMAGE ? 100 : 500) : 500} step={1} value={layerScale}
                                              onChange={(value) => this.layerScaleChangeHandler(value || 0)} />
                            </Grid.Row>}
                    </Grid.Column>
                    {selection.length === 1 && selection[0].type === LayerObjectType.IMAGE
                        && !(canChangeFill
                            && fillPickers !== null) &&
                        <Grid.Column width={3}>  
                            {/*<Grid.Row>
                                <EnhancedButton basic compact
                                                className="btn-effect btn-prop">
                                    {translate("propwin.lblImageEffect")}
                                </EnhancedButton>
                            </Grid.Row>*/}
                            <Grid.Row>
                                {selection.length === 1 && selection[0].type === LayerObjectType.IMAGE && <EnhancedButton basic compact
                                                className="btn-effect btn-prop" onClick={() => this.btnCropClickHandler()}>
                                    {translate("propwin.lblCrop")}
                                </EnhancedButton>}
                            </Grid.Row>
                           </Grid.Column>}
                    <Grid.Column width={buttonAreaWidth} textAlign="right" className="propwin-btns">    
                        {isTextLayer &&
                            <EnhancedButton basic compact ypIcon="YP3_text props circular"
                                className="btn-prop" labelPosition="left"
                                popupProps={{ flowing: true, hoverable: true, position: "bottom center" }}
                                popupContent={<TextSpacingPopup selection={selection}/>}>
                                {translate("propwin.lblTextSpacing")}
                            </EnhancedButton>}
                        {selection.length > 1 && <EnhancedButton basic compact ypIcon="YP3_align objects circular"
                            className="btn-prop" labelPosition="left"
                            popupProps={{ flowing: true, hoverable: true, position: "bottom center" }}
                            popupContent={<PropwinAlignmentStagePopup selectedPage={this.props.witdoc!.selectedPage} selection={selection} />}>
                                {translate("propwin.lblAlignToObjects")}
                            </EnhancedButton>}
                            <EnhancedButton basic compact ypIcon="YP3_align stage left circular"
                            className="btn-prop" labelPosition="left"
                                            popupProps={{flowing:true, hoverable:true, position:"bottom center"}}
                            popupContent={<PropwinAlignmentPopup selectedPage={this.props.witdoc!.selectedPage} selection={selection} />}>
                                {translate("propwin.lblAlignToStage")}
                            </EnhancedButton>
                        {/*<EnhancedButton basic compact ypIcon="YP3_flip horizontally circular"
                                            className="btn-prop" labelPosition="left">
                                {translate("propwin.lblFlip")}
                            </EnhancedButton>*/}
                            <EnhancedButton basic compact ypIcon="YP3_arrange circular"
                            className="btn-prop" labelPosition="left"
                            popupProps={{ flowing: true, hoverable: true, position: "bottom center" }}
                            popupContent={<Popup.Content className="propwin-popup-btns depth">
                                <div className="cont">
                                    <EnhancedButton basic compact ypIcon="YP3_depth top circular"
                                        className="btn-prop" labelPosition="left"
                                        onClick={(e) => this.setLayersDepth(e, LayerDepth.Front)}>
                                        {translate("dlgAlign.lblDepthBringToFront")}
                                    </EnhancedButton>
                                    <EnhancedButton basic compact ypIcon="YP3_depth up circular"
                                        className="btn-prop" labelPosition="left"
                                        onClick={(e) => this.setLayersDepth(e, LayerDepth.Up)}>
                                        {translate("dlgAlign.lblDepthMoveForward")}
                                    </EnhancedButton>
                                    <EnhancedButton basic compact ypIcon="YP3_depth down circular"
                                        className="btn-prop" labelPosition="left"
                                        onClick={(e) => this.setLayersDepth(e, LayerDepth.Down)}>
                                        {translate("dlgAlign.lblDepthSendBackward")}
                                    </EnhancedButton>
                                    <EnhancedButton basic compact ypIcon="YP3_depth bottom circular"
                                                    className="btn-prop" labelPosition="left"
                                        onClick={(e) => this.setLayersDepth(e, LayerDepth.Back)}>
                                        {translate("dlgAlign.lblDepthSendToBack")}
                                    </EnhancedButton>
                                </div>                                
                            </Popup.Content>}>
                                {translate("propwin.lblArrange")}
                            </EnhancedButton>
                            <div className="delim" />
                        {selection.length === 1 && selection[0].type === LayerObjectType.IMAGE && <EnhancedButton basic compact ypIcon="YP3_crop circular"
                                            className="btn-prop" labelPosition="left">
                                {translate("propwin.lblCrop")}
                            </EnhancedButton>}
                        <ClipboardToolbar />
                        {selection.length > 0 && <EnhancedButton basic compact ypIcon={`YP3_${isSelectionLocked ? "lock" : "unlock"} circular`}
                            className="btn-prop" labelPosition="left"
                            popup={translate(isSelectionLocked ? "propwin.ttlUnlock" : "propwin.ttlLock")}
                            onClick={() => this.lockUnlockLayers(selection, !isSelectionLocked)}>
                            {translate(isSelectionLocked ? "propwin.lblUnlock" : "propwin.lblLock")}
                        </EnhancedButton>}
                            <EnhancedButton basic compact ypIcon="YP3_trash circular"
                                            className="btn-prop" labelPosition="left"   
                                            onClick={() => this.deleteSelection()}>
                                {translate("propwin.lblDelete")}
                            </EnhancedButton>
                        </Grid.Column>
                       </Grid>
                   </div >
               </Transition>;
    }
}
