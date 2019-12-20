import * as React from 'react';
import * as ReactDOM from "react-dom";
import { observer, inject } from 'mobx-react';
import {
    Editor,
    EditorState,
    Modifier, RichUtils,
    SelectionState,
    DraftHandleValue,
} from 'draft-js';
import { TextLayer } from '../store/TextLayer';
import { textEditorState, getEditorState, editorStateToJson, textEditorCustomStyleFn, turnOffInlineStylesByPrefix, TextInlineStyles, updateBoldItalicStyles,
    preloadFonts, textEditorBlockStyleFn, updateBlockStyle, getAnchorKeys, WritingMode, TextAnchor, extractTextFormatObject, TextAlign, TextBlockStyles,
    ILayerActions, ITransformSelection, IWITDoc, IWITDocSettings
} from '../store';
import {IFontLibrary} from "../store/FontLibrary";
import { Dimmer, Loader } from 'semantic-ui-react';
import * as Logger from 'js-logger';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { WDMTextUtil } from "../utils";

export interface IEditorSize {
    editorWidth?: number,
    editorHeight?: number,
    dx?: number,
    dy?:number
}

interface ITextLayerEditorState {
    editorState: EditorState,
    lastMouseEvent?: React.MouseEvent<{}>
}

interface ITextLayerEditorProps {
    docSettings?: IWITDocSettings,
    textLayer?: TextLayer,
    /**
     * Text should be rendered as focused
     */
    active?: boolean,
    style?: React.CSSProperties,
    fontLibrary?: IFontLibrary,
    onFocus?(e?: React.SyntheticEvent<{}>): void,
    onChange?(newState?: EditorState): void,
    onChanged?(editorSize: IEditorSize): void,
    onUpdated?():void, //Called after text has been changed and rendered, in componentDidUpdate method
    onLoseFocus?():void
}

export interface ITransformSelectionProps {
    transformSelection?: ITransformSelection;
}

@inject("docSettings", "fontLibrary")
@observer
export class TextLayerEditor extends React.Component<ITextLayerEditorProps & ITransformSelectionProps, ITextLayerEditorState> {

    private _editor: Editor | null = null;
    private hideEditor = true;
    private styleMap: any = {};
    private lastMouseEvent?: React.MouseEvent<{}>;
    private editorSize: IEditorSize = { editorWidth: 0, editorHeight: 0 };
    private isClearContentByBackspace = false;
    private previousEditorState:EditorState | undefined = undefined;

    constructor(props: any) {
        super(props);        
        const { textLayer } = this.props;
        var editorState = EditorState.createEmpty();
        if (textLayer !== undefined) {
            editorState = getEditorState(textLayer.data);           
        }
        
        // Generate color style map
        const defaultColorPalette = this.props.docSettings ? this.props.docSettings.defaultColorPalette : [];

        defaultColorPalette.map((color, index) => {
            color = color.toLowerCase();
            this.styleMap[`${TextInlineStyles.Color}-${color.replace('#', '')}`] = { color };
        });

        this.state = { editorState: editorState };
        textEditorState.toggleStyleManually = (style, returnFocus) => this.toggleStyleManually(style, returnFocus);
        textEditorState.setBlockDataStyleManually = (style, data) => this.setBlockStyleDataManually(style, data);
        this.onChange(editorState, true);
        if (this.props.onChange) {
            this.props.onChange(editorState);
        }
        Logger.info('calling constructor again');
    }

    lastZoomValue = 1;

    public getEditorSize(): IEditorSize {

        const { zoom } = this.props.docSettings!;

        const nd = ReactDOM.findDOMNode(this);
        const editorNode = nd ? $(nd).find(".DraftEditor-root") : null;

        //console.log('geteditorsize: ' + this.props.docSettings.zoom);

        let w = editorNode ? editorNode.width() || 0 : 0;
        let h = editorNode ? editorNode.height() || 0 : 0;

        if (zoom !== this.lastZoomValue) {
            w *= zoom / this.lastZoomValue;
            h *= zoom / this.lastZoomValue;
        }

        this.lastZoomValue = zoom;

        return {
            editorWidth: w,
            editorHeight: h,
            dx: this.editorSize.dx,
            dy: this.editorSize.dy
        };
    }

    private getUpdateNewLayerDimensions(getDimensionsFlag:boolean = true) {
        const { zoom } = this.props.docSettings!;
        let dimensions: any = {};
        if (this._editor) {
            const { editorWidth, editorHeight } = getDimensionsFlag ? this.getEditorSize() :
                { editorWidth: (this.editorSize.editorWidth!) * zoom, editorHeight: (this.editorSize.editorHeight!) * zoom };
            dimensions.newWidth = this.editorSize.editorWidth = (editorWidth!)/zoom;
            dimensions.newHeight = this.editorSize.editorHeight = (editorHeight!)/zoom;
        }
        return dimensions;
    }

    private setContentBackToTextLayer(editorState:EditorState, skipUpdate:boolean = false) {
        // force content update for the entire layer            
        editorState = this.applySelectionStyle(editorState, false);
        const dimensions = this.getUpdateNewLayerDimensions(!skipUpdate);
        this.props.textLayer!.setContent(editorStateToJson(editorState), dimensions.newWidth, dimensions.newHeight);
        Logger.info('set content back: ' + editorStateToJson(editorState));
        if (skipUpdate) {
            this._editor!.focus();
        } else {
            this._editor!.forceUpdate(() => this.loseFocus(true));
        }
        //this._editor!.forceUpdate(() => this.loseFocus());
    }

    private applySelectionStyle(editorState: EditorState, preserveSelection?:boolean) {
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();
        if (!selectionState.getHasFocus() && preserveSelection !== false) {
            // Maintain non focused selection   
            //console.log('applyselstate ', contentState, selectionState);
            editorState = EditorState.push(editorState,
                Modifier.applyInlineStyle(contentState,
                    selectionState,
                    TextInlineStyles.Selection),
                'change-inline-style');      
            //console.log(editorState);
        } else {
            // Remove non-focused selection if necessary
            editorState = EditorState.push(editorState,
                Modifier.removeInlineStyle(contentState,
                    selectionState,
                    TextInlineStyles.Selection),
                'change-inline-style');
            Logger.info('Is collapsed? ' + selectionState.isCollapsed());
        }
        return editorState;
    }

    private toggleStyleManually(style: string, returnFocus?:boolean) {
        var editorState = this.state.editorState;
        const stylePrefix = style.substr(0, style.indexOf('-'));
        const currentSelection = editorState.getSelection();
        const applyToWholeContent = this.hideEditor ||
        (currentSelection.isCollapsed() &&
            currentSelection.getStartKey() === currentSelection.getEndKey() &&
            currentSelection.getStartOffset() === currentSelection.getEndOffset());


        if (applyToWholeContent) {
            // Apply style to the whole layer
            const selection = editorState.getSelection().merge({
                ...getAnchorKeys(editorState), anchorOffset: 0, focusOffset: editorState.getCurrentContent().getLastBlock().getLength()
            }) as SelectionState;
            //Editor is hidden so we need to set a selection to the entire object
            editorState = EditorState.acceptSelection(editorState, selection);
        }

        const indexOfDelimiter = style.indexOf('-');
        if (indexOfDelimiter > 0) {
            editorState = turnOffInlineStylesByPrefix(style.substr(0, indexOfDelimiter), editorState);
        }

        //editorState = EditorState.setInlineStyleOverride(editorState, editorState.getCurrentInlineStyle());
        editorState = updateBoldItalicStyles(RichUtils.toggleInlineStyle(editorState, style));
        
        this.onChange(editorState);
        
        if (applyToWholeContent) {
            this.setContentBackToTextLayer(editorState);
        } else if (stylePrefix === TextInlineStyles.FontFamily) {
            preloadFonts(editorStateToJson(editorState));
        }

        if(returnFocus)
            setTimeout(() => {
                if (this._editor) this._editor.focus();
            }, 100);
    }

    private setBlockStyleDataManually(style: string, data: any) {

        let editorState = this.state.editorState;
        const currentSelection = editorState.getSelection();
        const applyToWholeContent = this.hideEditor ||
        (currentSelection.isCollapsed() &&
            currentSelection.getStartKey() === currentSelection.getEndKey() &&
            currentSelection.getStartOffset() === currentSelection.getEndOffset());
        if (applyToWholeContent) {
            // Apply style to the whole layer
            const selection = currentSelection.merge({
                ...getAnchorKeys(editorState), anchorOffset: 0, focusOffset: editorState.getCurrentContent()
                    .getLastBlock().getLength()
            }) as SelectionState;

            //Editor is hidden so we need to set a selection to the entire object
            editorState = EditorState.acceptSelection(editorState, selection);
        }

        editorState = updateBlockStyle(editorState, style, data);


        this.onChange(editorState);

        if (applyToWholeContent) {
            this.setContentBackToTextLayer(editorState);
        }
    }

    isTextChanged = false;

    onChange = (editorState: EditorState, isInitial?: boolean) => {

        const isTransforming = this.props.transformSelection && this.props.transformSelection.isTransforming;

        //console.log("onChange", isTransforming);
        //if (isTransforming) return;

        editorState = this.applySelectionStyle(editorState);
        if (isInitial)
            this.state = { editorState };
        else
            this.setState({ editorState });
        textEditorState.contentChangedCounter++;
        textEditorState.lastState = editorState;
        
        if (this.props.onChange) {
            this.props.onChange(editorState);
        }

        this.isTextChanged = true;
    }

    onEditorFocus = (e?: React.SyntheticEvent<{}>, editorState?:EditorState, stateModifier?:(editorState:EditorState) => EditorState) => {
        Logger.info(' on editor focus', e);

        this.props.textLayer!.setFocus(WDMTextUtil.isTextEditorActive());

        let finalState = editorState || getEditorState(this.props.textLayer!.data!);
        if (stateModifier) finalState = stateModifier(finalState);
        this.setState({ editorState: finalState, lastMouseEvent: this.lastMouseEvent });
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }
    }

    onEditorBlur = (e: React.SyntheticEvent<{}>) => {
        Logger.info('lose focus (blur)');
    }

    handleBeforeInput = (chars: string):DraftHandleValue => {
        Logger.info("Handle before input: " + chars);
        return "handled";
    }

    /**
     * This handler automatically migrates block data with styles
     * to the newly created block
     */
    handleReturn = (event: React.KeyboardEvent<{}>) => {
        const { editorState } = this.state;
        Logger.info("handle return");
        // Your handleNewLine function imported from this package
        //const newEditorState = handleNewLine(editorState, event);
        //if (newEditorState) {
        //    this.onChange(newEditorState);
        //    return true;
        //}

        // Maintain content of the "data" property of the current block when splitting to create the
        // new block (instead of draftjs normal behavior of not maintaining any part of data).
        // This is adapted from https://github.com/facebook/draft-js/issues/723#issuecomment-367918580
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const startKey = selection.getStartKey();
        const currentBlock = contentState.getBlockForKey(startKey);
        if (currentBlock) {
            const blockData = currentBlock.getData();
            if (blockData) {
                const newContentState = Modifier.splitBlock(contentState, selection);
                const splitState = EditorState.push(
                    editorState,
                    newContentState,
                    'split-block'
                );
                const splitStateWithData = Modifier.mergeBlockData(
                    splitState.getCurrentContent(),
                    splitState.getSelection(),
                    blockData
                );
                const finalState = EditorState.push(
                    editorState,
                    splitStateWithData,
                    'split-block'
                );
                this.onChange(finalState);
                return "handled";
            }
        }
        return "not-handled";
    }

    onStubDivMouseUp(e?: React.MouseEvent<{}>) {
        if (this.props.textLayer!.visibility !== false) {
            this.lastMouseEvent = e;
            this.onEditorFocus(e);
            // Set cursor based on mouse position

        }
    }

    componentWillMount() {
        const { zoom } = this.props.docSettings!;
        this.lastZoomValue = zoom;
        const textLayer = this.props.textLayer!;
        if (this.props.textLayer) {
            this.editorSize = {
                editorWidth: textLayer.width * zoom,
                editorHeight: textLayer.height * zoom
            };
        }
    }

    componentWillReceiveProps(newProps: ITextLayerEditorProps & ITransformSelectionProps) {
        //Logger.info('TextEditor will receive props: ' + this.props.textLayer!.uid + ' ' + newProps.textLayer!.uid);        
        if (this.props.textLayer && this.props.textLayer !== newProps.textLayer) {

            this.updateContentDimensions(false);
            this.checkForChanges = true;
            // Update old layer
            this.loseFocus();

            let editorState = getEditorState(newProps.textLayer!.data!);

            this.setState({ editorState: editorState, lastMouseEvent: this.lastMouseEvent });
            textEditorState.lastState = editorState;
            textEditorState.contentChangedCounter++;
            return;
        }


    }

    componentWillUnmount() {        
        this.loseFocus();
        textEditorState.contentChangedCounter++;
        //textEditorState.lastState = undefined;
        textEditorState.isEditorVisible = false;
    }

    componentWillUpdate(nextprops, nextstate) {
        this.editorSize = this.getEditorSize();
    }

    componentDidUpdate(newProps:ITextLayerEditorProps) {        
        const { transformSelection, textLayer } = this.props;

        if (textLayer && this.props.active && textLayer.visibility) {
            //Set focus automatically
            this.onStubDivMouseUp();
        }

        this.updateContentDimensions(true);
        this.checkForChanges = false;
        textEditorState.isEditorVisible = $('.wit.selection > #wit-text-edit').css('visibility') !== 'hidden';

        //if (this._editor) {
            if (this.props.textLayer && this.props.textLayer.mode === "new") {                
                this.props.textLayer!.set("mode", "");
                this.onEditorFocus(undefined,
                    this.state.editorState,
                    editorState => this.applySelectionStyle(this.selectAll()));
                setTimeout(() => {
                    if (this._editor) this._editor.focus();
                }, 100);
            }

        //if (this.props.transformSelection && this.props.transformSelection.isTransforming) {
        //    const editorSize = this.getEditorSize();
        //    if (this.editorSize.editorWidth !== editorSize.editorWidth ||
        //        this.editorSize.editorHeight !== editorSize.editorHeight) {
        //        this.editorSize.editorWidth = editorSize.editorWidth;
        //        this.editorSize.editorHeight = editorSize.editorHeight;
        //        if (this.props.onChanged) {
        //            console.log('editorsize onchanged');
        //            this.props.onChanged(this.editorSize);
        //        }
        //    }
        //}

        if (transformSelection && transformSelection.isTransforming && transformSelection.type.indexOf("scale_") >= 0) {
            const editorSize = this.getEditorSize();
            this.editorSize.editorWidth = editorSize.editorWidth;
            this.editorSize.editorHeight = editorSize.editorHeight;
        }

        if (this.isTextChanged && this.props.onUpdated) this.props.onUpdated();

        if (this.isClearContentByBackspace && this.previousEditorState) {
            //console.log("handling backspace situation");
            this.isClearContentByBackspace = false;
            let editorState = this.state.editorState;
            const selection = editorState.getSelection().merge({
                ...getAnchorKeys(editorState), anchorOffset: 0, focusOffset: editorState.getCurrentContent().getLastBlock().getLength()
            }) as SelectionState;
            //Editor is hidden so we need to set a selection to the entire object
            editorState = EditorState.acceptSelection(editorState, selection);
            editorState =
                EditorState.setInlineStyleOverride(editorState, this.previousEditorState.getCurrentInlineStyle());
            this.setState({ editorState: editorState, lastMouseEvent: this.state.lastMouseEvent });
            return;
        }
        //}
    }

    checkForChanges = false;

    updateContentDimensions(checkForChanges: boolean = true) {
        const textLayer = this.props.textLayer;

        // Update layer dimensions
        this.getUpdateNewLayerDimensions(checkForChanges);
        
        const { zoom } = this.props.docSettings!;
        this.editorSize.dx = this.editorSize.dy = 0;
        if (textLayer && (textLayer.visibility === false || !checkForChanges)) {

            const sizeDiffX = this.getSizeDiff(this.editorSize.editorWidth!, textLayer.width);
            const sizeDiffY = this.getSizeDiff(this.editorSize.editorHeight!, textLayer.height);
            let sizeDiff = textLayer.writingMode === WritingMode.Vertical
                ? sizeDiffX
                : sizeDiffY;
            if (sizeDiff || !checkForChanges) {
                if (textLayer.textAnchor !== TextAnchor.Top && textLayer.textAnchor !== TextAnchor.Right) {
                    if (textLayer.writingMode === WritingMode.Vertical) {
                        if (textLayer.textAnchor === TextAnchor.Left) {
                            this.editorSize.dx = -sizeDiff;
                        } else { // TextAnchor.Center
                            this.editorSize.dx = -sizeDiff / 2;
                        }
                    } else {
                        if (textLayer.textAnchor === TextAnchor.Bottom) {
                            this.editorSize.dy = -sizeDiff;
                        } else { //TextAnchor.Middle
                            this.editorSize.dy = -sizeDiff / 2;
                        }
                    }

                    sizeDiff *= zoom;
                    if (textLayer.textAnchor !== TextAnchor.Right && textLayer.textAnchor !== TextAnchor.Top) {
                        $('#wit-text-edit').css(textLayer.writingMode === WritingMode.Vertical ? "left" : "top",
                            (textLayer.textAnchor === TextAnchor.Bottom || textLayer.textAnchor === TextAnchor.Left
                                ? -sizeDiff
                                : -sizeDiff / 2) +
                            "px");
                    } else {
                        //(textLayer.textAnchor === TextAnchor.Right || textLayer.textAnchor === TextAnchor.Top) 
                        $('#wit-text-edit').css(textLayer.writingMode === WritingMode.Vertical ? "left" : "top",
                            (textLayer.textAnchor === TextAnchor.Top || textLayer.textAnchor === TextAnchor.Right
                                ? -sizeDiff
                                : -sizeDiff / 2) +
                            "px");
                    }
                } 
                //Size has been changed so need to resize selection
                //this.setContentBackToTextLayer(this.state.editorState, true);
            } else if (sizeDiffX && sizeDiffY) {
                //console.log("both sizes are changing", sizeDiffX, sizeDiffY);
            }
        }
        if (this.props.onChanged) {
            const editorSize = this.getEditorSize();
            editorSize.dx = editorSize.dx! * zoom;
            editorSize.dy = editorSize.dy! * zoom;
            this.props.onChanged(editorSize);
        }
    }

    private getSizeDiff(val1: number, val2: number, precision: number = 2.0) {
        if (Math.abs(val1 - val2) >= precision) {
            return val1 - val2;
        }
        return 0;
    }

    private loseFocus(updateDimensions?:boolean) {
        Logger.info('lose focus');
        this.isClearContentByBackspace = false;
        if (this._editor !== null) {
            try {
                const rawStateJson = editorStateToJson(this.applySelectionStyle(this.state.editorState, false));
                const dimensions = updateDimensions
                    ? this.getUpdateNewLayerDimensions()
                    : { newWidth: this.editorSize.editorWidth, newHeight: this.editorSize.editorHeight };
                this.props.textLayer!.loseFocus(rawStateJson, dimensions.newWidth, dimensions.newHeight);
                //this.props.textLayer!.loseFocus(rawStateJson);
            } catch (err) {
                // Sometimes text layer has been already removed by the user
            }
            //Logger.info(rawStateJson);
            if (this.props.onChange) {
                this.props.onChange();
            }
        }

        if (this.props.onLoseFocus) {
            this.props.onLoseFocus();
        }
    }

    render() {
        //Logger.info('re-render editor:', editorStateToJson(this.state.editorState));

        const { zoom } = this.props.docSettings!;
        const { textLayer, fontLibrary } = this.props;
        this.hideEditor = textLayer!.visibility !== false;
        let layerScale = (textLayer as any as ILayerActions).getScaleX();

        const { transformSelection } = this.props;
        //let width = textLayer!.width * zoom;
        //let height = textLayer!.height * zoom;
        let width = textLayer!.isFocused ? this.editorSize.editorWidth : textLayer!.width * zoom;
        let height = textLayer!.isFocused ? this.editorSize.editorHeight : textLayer!.height * zoom;
        //console.log("render", textLayer.isFocused);
        if (transformSelection && transformSelection.isTransforming && transformSelection.type.indexOf("scale_") >= 0) {
            const typeSuffix = transformSelection.type.split("_")[1];
            const isLeftScale = typeSuffix.indexOf("l") >= 0;
            const isTopScale = typeSuffix.indexOf("t") >= 0;
            const isBottomScale = typeSuffix.indexOf("b") >= 0;
            const isRightScale = typeSuffix.indexOf("r") >= 0;
            const isVScale = isTopScale || isBottomScale;
            const isHScale = isLeftScale || isRightScale;
            if (transformSelection.offsetX) width = transformSelection.width * zoom + (isLeftScale ? -1 : 1) * transformSelection.offsetX;
            if (transformSelection.offsetY) height = transformSelection.height * zoom + (isTopScale ? -1 : 1) * transformSelection.offsetY;
            //console.log(transformSelection.offsetX, transformSelection.offsetY, transformSelection.width);         
            console.log("ishscale", isHScale, isVScale);
            if (isHScale && isVScale) {
                //width = this.editorSize.editorWidth;
                //height = this.editorSize.editorHeight;
                if(textLayer) {
                    if (textLayer.writingMode === WritingMode.Horizontal)
                        layerScale = width / (textLayer.unscaledWidth! * zoom);
                    else
                        layerScale = height / (textLayer.unscaledHeight! * zoom);
                }
            } else {
                if (isVScale)
                    width = this.editorSize.editorWidth;
                else if (isHScale)
                    height = this.editorSize.editorHeight;
            }
        }

        const style: React.CSSProperties = {
            fontSize: zoom * layerScale * 100 + '%',
            //cursor: this.hideEditor ? 'text' : 'auto',
            cursor: "move",
            height: height + 'px',
            width: width + 'px',
            //height: (this.editorSize ? this.editorSize.editorHeight/zoom : textLayer!.height) * zoom + 'px',
            //width: (this.editorSize ? this.editorSize.editorWidth / zoom : textLayer!.width) * zoom + 'px',


            lineHeight: textLayer!.lineHeight
        };

        if (this.props.style) {
            _.assign(style, this.props.style);
        }

        const editorSubstyle: React.CSSProperties = {  
        };

        if (this.hideEditor) {
            editorSubstyle.visibility = 'hidden';
        }   

        if (textLayer && textLayer.writingMode !== WritingMode.Horizontal) {
            (style as any).writingMode = textLayer.writingMode.toString();
        }

        //textLayer!.extractFillColors().forEach((value) => {
        //    this.updateColorMap('color-' + value.replace('#', ''));
        //}, this);       

        const editorClasses = `wit-edittxt-ltr ${(textLayer.writingMode === WritingMode.Vertical ? "vert" : "hor")}${textLayer.cursorFocused ? " focused" : ""}`;


        return <div id='wit-text-edit' className={editorClasses}
            style={style} onMouseUp={(e) => this.onStubDivMouseUp(e)}>
            <div style={editorSubstyle}>
                <Editor ref={(editor) => this._editor = editor} editorState={this.state.editorState}
                    stripPastedStyles={true}
                    customStyleFn={textEditorCustomStyleFn}
                    blockStyleFn={textEditorBlockStyleFn}
                    onChange={(es) => this.onChange(es)}
                    handleDrop={() => true}
                    handleKeyCommand={(key) => this.handleKeyDown(key)}
                    handleReturn={(e) => this.handleReturn(e)}                    
                    onFocus={(e) => this.onEditorFocus(e)} onBlur={(e) => this.onEditorBlur(e)}/>
                <Dimmer active={fontLibrary!.isLoadingFonts} inverted>
                    <Loader indeterminate/>
                </Dimmer>
            </div>
       </div>;
    }

    handleKeyDown(key: string) {
        console.log("handle key down", key);
        if (key === "backspace") {
            this.isClearContentByBackspace = true;
            this.previousEditorState = this.state.editorState;
        }
    }

    selectAll(editorState?: EditorState) {
        if (!editorState) editorState = this.state.editorState;
        const selection = editorState.getSelection().merge({
            ...getAnchorKeys(editorState), anchorOffset: 0, focusOffset: editorState.getCurrentContent().getLastBlock().getLength()
        }) as SelectionState;
        //Editor is hidden so we need to set a selection to the entire object
        return EditorState.acceptSelection(editorState, selection);
    }

}