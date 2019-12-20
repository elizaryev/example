import * as React from 'react';
import {
    Transition, Grid, Button, Form,
    InputOnChangeData, Dropdown, Image, Divider, Segment, Icon, DropdownProps
} from 'semantic-ui-react';
import { ILayer, Layer, ILayerActions, LayerObjectType } from '../store/Layer';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { observer, inject } from 'mobx-react';
import { NumberPicker } from 'react-widgets';
import { ILocalizeStore } from '../store/Localize';
import '../css/ColorPicker.less';
import { IWITDocSettings, IWITDocSettingsActions } from '../store/WITDocSettings';
import { textEditorState, TextInlineStyles, TextAlign, TextBlockStyles,
    WritingMode,
    TextAnchor, extractTextFormatObject} from '../store';
import { EnumUtil } from '../utils/EnumUtil';
import { DropdownItemProps } from 'semantic-ui-react';
import { IFontLibrary, FontLibrary } from '../store/FontLibrary';
import { TextLayer } from '../store/TextLayer';
import EnhancedButton from "./EnhancedButton";
import { DropdownFont } from "../containers";


const numberLocalizer = require('react-widgets-simple-number') as Function;
numberLocalizer();

interface TextPropertyWindowProps {
    selection: ILayer[],
    witdoc?: IWITDoc & IWITDocActions,
    docSettings?: IWITDocSettings,    
    fontLibrary?: IFontLibrary,
}

@inject('localize', 'witdoc', 'docSettings', 'fontLibrary')
@observer
export default class TextPropertyWindow extends React.Component<TextPropertyWindowProps & ILocalizeStore> {

    sizePicker:any | null = null;

    private toggleInlineStyle(style: string, value?: any) {
        console.log(document.activeElement, this.sizePicker);
        const keys = Object.keys(TextInlineStyles);
        let resultStyle = style;
        //Handle complex styles
        if (EnumUtil.enumHasValue(TextInlineStyles, resultStyle)) {
            resultStyle += '-' + value!;
        }
        textEditorState.toggleStyleManually(resultStyle, true);       

        //Change document default style props
        const { docSettings } = this.props;
        if (docSettings) {
            //const textFmtPair = inlineStyleToTextFormat(style, value);
            //if(textFmtPair)
            (docSettings as any as IWITDocSettingsActions).applyDefaultTextFormatStyle(style, value);
        }
    }

    private setBlockDataStyle(style: string, value: any) {
        textEditorState.setBlockDataStyleManually(style, value);
    }

    private get currentLayers() {
        let layers: (Array<ILayer> | undefined); 
        //= this.props.textEditor !== undefined
        //    ? [this.props.textEditor.props.textLayer as any as ILayer]
        //    : undefined;
        //(textLayer as any as ILayerActions).set("textAnchor", data.value);

        if (!layers) {
            if (this.props.selection.length === 1 && this.props.selection[0].type === LayerObjectType.GROUP) {
                layers = this.props.selection[0].children;
            } else {
                layers = this.props.selection;
            }
        }
        return layers;
    }

    private setWritingMode(mode: WritingMode) {
        const currentLayers = this.currentLayers;
        if (currentLayers) {
            currentLayers.forEach((layer) => {
                if (layer.type === LayerObjectType.TEXT) {
                    (layer as any as TextLayer).setWritingMode(mode);
                }
            });
        }
    }

    private renderLabel = (item: DropdownItemProps) => {
        return {
            image: item.image
        };
    };

    private getAnchorOptions(writingMode: string, currentAnchor:string) {
        let result = [
            this.getAnchorOption(writingMode === WritingMode.Vertical ? TextAnchor.Right : TextAnchor.Top, writingMode !== WritingMode.Vertical),
            this.getAnchorOption(writingMode === WritingMode.Vertical ? TextAnchor.Center : TextAnchor.Middle, writingMode !== WritingMode.Vertical),            
            this.getAnchorOption(writingMode === WritingMode.Vertical ? TextAnchor.Left : TextAnchor.Bottom, writingMode !== WritingMode.Vertical)            
        ];

        //if (!(currentAnchor == TextAnchor.Left ||
        //    currentAnchor == TextAnchor.Right ||
        //    currentAnchor == TextAnchor.Center)) {
        //    result = result.reverse();
        //}

        result.forEach((value) => value.selected = value.value === currentAnchor);

        return result;
    }

    private getAnchorOption(currentAnchor: string, isVertical?:boolean) {

        //let currentIcon: any = 'align left';
        const anchorVal = currentAnchor;
        let currentIcon = "icon-YP3_anchor ";

        if (isVertical && currentAnchor === "middle") {
            currentIcon += "vertical ";
        }

        if (!currentAnchor) currentAnchor = "left";

        currentIcon += currentAnchor;

        console.log("Current anchor: ", currentAnchor, currentIcon);        

        return {
            value: anchorVal,
            content: <Icon className={currentIcon}/>,
            selected: false
        };
    }

    renderAnchorValue(currentAnchor:string, currentWritingMode:string) {
        return <Button icon className="btn-ddl-anchor">{this.getAnchorOption(currentAnchor, currentWritingMode !== WritingMode.Vertical).content}</Button>
    }

    anchorOptionsChangeHandler(data: DropdownProps) {
        //const textLayer = this.props.textEditor !== undefined
        //    ? this.props.textEditor.props.textLayer
        //    : this.props.selection[0] as any as TextLayer;
        //(textLayer as any as ILayerActions).set("textAnchor", data.value);

        const currentLayers = this.currentLayers;
        if (currentLayers) {
            currentLayers.forEach((layer) => {
                if (layer.type === LayerObjectType.TEXT) {
                    (layer as any as ILayerActions).set("textAnchor", data.value);
                }
            });
        }

        (this.props.docSettings as any as IWITDocSettingsActions).applyDefaultTextAnchor(EnumUtil.enumByValue(TextAnchor, data.value));
    }

    renderValue(val: string) {
        const { fontLibrary } = this.props;
        if (!fontLibrary) return undefined;
        const foundVal = fontLibrary.fontList.find((item) => item.typefaceName === val);
        if (!foundVal) return undefined;
        return <Image src={foundVal!.fontGraphic}/>
    }

    getFontList(fontLibrary:IFontLibrary | undefined) {
        if (fontLibrary) {
            return fontLibrary!.fontList.map((value) => {
                return {
                    key: value.typefaceName,
                    value: value.typefaceName,
                    text: value.typefaceName,
                    //image: value.fontGraphic,
                    content: <Image src={value.fontGraphic} />
                    //icon: value.fontGraphic                
                } as any as DropdownItemProps;
            });
        }
        return undefined;
    }

    render() {

        // Do not render anything if there's no text editor
        if (!textEditorState.isEditorVisible) {
            return null;
        }

        const { translate } = this.props.localize!;
        const { fontLibrary } = this.props;

        const fontList = this.getFontList(fontLibrary);

        let isBoldEnabled = false;
        let isItalicEnabled = false;
        let isUnderlineEnabled = false;        

        const textLayer = (this.currentLayers!).find((layer) => layer.type === LayerObjectType.TEXT) as any as TextLayer;
        const fmt = extractTextFormatObject(textEditorState, textLayer);
        isBoldEnabled = isItalicEnabled = isUnderlineEnabled = fmt.hasFontStyle || false;

        const currentLanguageFont = (fontLibrary as any as FontLibrary).getFont(fmt.fontFamily);        

        const textAlignIconClass = `YP3_align${fmt.writingMode === WritingMode.Vertical ? " vertical" : ""} `;

        return <Grid.Column width={5} className="txt-props">
            <Grid columns={4} className='propgrid' verticalAlign='middle'>
                <Grid.Row className="wit-btn-block">
                    {fontLibrary !== undefined &&
                        <DropdownFont value={fmt.fontFamily}
                              onChange={(e: any, data: any) => this.toggleInlineStyle(TextInlineStyles.FontFamily, data.value as any)} />
}
                    {currentLanguageFont && currentLanguageFont.hasBoldFlg &&
                        <Button icon='bold' toggle size='small' disabled={!isBoldEnabled} active={fmt.isBold}
                            onClick={(e) => this.toggleInlineStyle('BOLD')} />}
                    {currentLanguageFont && currentLanguageFont.hasItalicFlg &&
                        <Button icon='italic' toggle size='small' disabled={!isItalicEnabled} active={fmt.isItalic}
                            onClick={(e) => this.toggleInlineStyle('ITALIC')} />}
                    <Button icon='underline' toggle size='small' disabled={!isUnderlineEnabled} active={fmt.isUnderline}
                            onClick={(e) => this.toggleInlineStyle('UNDERLINE')} />
                    {/* Temporary hide shadow button
                    <EnhancedButton basic compact toggle style={{visibility:"hidden"}}
                        className="btn-shadow btn-prop">
                        {translate("propwin.lblTextShadow")}
                    </EnhancedButton>*/}
                </Grid.Row>
                <Grid.Row>
                    <Grid divided className="wit-btn-grid">
                        <Grid.Row>
                            <Grid.Column id="sizepicker" width={5}>
                                {translate("propwin.lblFontSize")}
                                <NumberPicker min={1} max={1000}
                                    defaultValue={100} value={fmt.fontSize}
                                    precision={1} step={1} ref={(r) => this.sizePicker = r}                                    
                                    onChange={(value) => this.toggleInlineStyle(TextInlineStyles.Size, value as any)} />
                            </Grid.Column>
                            <Grid.Column width={11} className="wit-btn-block-col text-no-wrap" >
                                {/*When working with draft.js we need to intercept MouseDown event and prevent default action.
                                    Otherwise it will cause DraftJS editor to lose focus and selection will disapper.
                                    So we are gonna use a div wrapper for all controls which apply styling to sub-selected text.
                                    https://github.com/facebook/draft-js/issues/696
                                */}                                
                                    <div className="wit-btn-block" onMouseDown={(e) => e.preventDefault()}>                                        
                                        <EnhancedButton basic compact toggle ypIcon={`${textAlignIconClass} ${fmt.writingMode === WritingMode.Vertical ? "top" : "left"}`}
                                            active={fmt.textAlign === TextAlign.Left}
                                            popup={translate(fmt.writingMode === WritingMode.Vertical ? "propwin.text.ttlAlignTop" : "propwin.text.ttlAlignLeft")}
                                            onClick={() => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Left)} />
                                        <EnhancedButton basic compact toggle ypIcon={`${textAlignIconClass} ${fmt.writingMode === WritingMode.Vertical ? "middle" : "center"}`}
                                            active={fmt.textAlign === TextAlign.Center}
                                            popup={translate(fmt.writingMode === WritingMode.Vertical ? "propwin.text.ttlAlignMiddle" : "propwin.text.ttlAlignCenter")}
                                            onClick={() => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Center)} />
                                        <EnhancedButton basic compact toggle ypIcon={`${textAlignIconClass} ${fmt.writingMode === WritingMode.Vertical ? "bottom" : "right"}`}
                                            active={fmt.textAlign === TextAlign.Right}
                                            popup={translate(fmt.writingMode === WritingMode.Vertical ? "propwin.text.ttlAlignBottom" : "propwin.text.ttlAlignRight")}
                                            onClick={() => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Right)} />
                                        <EnhancedButton basic compact toggle ypIcon={`${textAlignIconClass} justify`}
                                            active={fmt.textAlign === TextAlign.Justify}
                                            popup={translate("propwin.text.ttlAlignJustify")}
                                            onClick={() => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Justify)} />
                                        <div className="delim" />
                                        <EnhancedButton basic compact toggle ypIcon="YP3_horizontal text"
                                            active={fmt.writingMode === WritingMode.Horizontal}
                                            popup={translate("propwin.text.ttlHorizontalText")}
                                            onClick={() => this.setWritingMode(WritingMode.Horizontal)} />
                                        <EnhancedButton basic compact toggle ypIcon="YP3_vertical text"
                                            active={fmt.writingMode === WritingMode.Vertical}
                                            popup={translate("propwin.text.ttlVerticalText")}
                                        onClick={() => this.setWritingMode(WritingMode.Vertical)} />    
                                        <div className="delim" />
                                        <Dropdown compact options={this.getAnchorOptions(fmt.writingMode, fmt.textAnchor)}
                                                  trigger={this.renderAnchorValue(fmt.textAnchor, fmt.writingMode)}
                                                  className="ddl-anchor"
                                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => this.anchorOptionsChangeHandler(data)} />                                    
                                    </div>
                            </Grid.Column>
                            {/*<Grid.Column width={5} className="wit-btn-block-col" >
                                {/*When working with draft.js we need to intercept MouseDown event and prevent default action.
                                    Otherwise it will cause DraftJS editor to lose focus and selection will disapper.
                                    So we are gonna use a div wrapper for all controls which apply styling to sub-selected text.
                                    https://github.com/facebook/draft-js/issues/696
                                }
                                <div className="wit-btn-block" onMouseDown={(e) => e.preventDefault()}>
                                    <Button icon toggle size='small' active={textAlignValue === TextAlign.Left}                                            
                                        onClick={(e) => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Left)}>
                                        <Icon name='align left' rotated={currentWritingMode == WritingMode.Vertical ? 'counterclockwise' : undefined} />
                                    </Button>
                                    <Button icon toggle size='small' active={textAlignValue === TextAlign.Center}
                                        onClick={(e) => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Center)} >
                                        <Icon name='align center' rotated={currentWritingMode == WritingMode.Vertical ? 'counterclockwise' : undefined} />
                                    </Button>
                                    <Button icon toggle size='small' active={textAlignValue === TextAlign.Right}
                                        onClick={(e) => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Right)} >
                                        <Icon name='align right' rotated={currentWritingMode == WritingMode.Vertical ? 'counterclockwise' : undefined} />
                                    </Button>
                                    <Button icon toggle size='small' active={textAlignValue === TextAlign.Justify}
                                        onClick={(e) => this.setBlockDataStyle(TextBlockStyles.Align, TextAlign.Justify)} >
                                        <Icon name='align justify' rotated={currentWritingMode == WritingMode.Vertical ? 'counterclockwise' : undefined} />
                                    </Button>
                                </div>
                            </Grid.Column>*/}
                            {/*<Grid.Column width={3} className="wit-btn-block-col" >
                                {/*When working with draft.js we need to intercept MouseDown event and prevent default action.
                                    Otherwise it will cause DraftJS editor to lose focus and selection will disapper.
                                    So we are gonna use a div wrapper for all controls which apply styling to sub-selected text.
                                    https://github.com/facebook/draft-js/issues/696
                                }
                                <div className="wit-btn-block" onMouseDown={(e) => e.preventDefault()}>       
                                    <Button icon='text width' size='small' toggle active={currentWritingMode == WritingMode.Horizontal}
                                        onClick={(e) => this.setWritingMode(WritingMode.Horizontal)} />                                       
                                    <Button icon='text height' size='small' toggle active={currentWritingMode == WritingMode.Vertical}
                                        onClick={(e) => this.setWritingMode(WritingMode.Vertical)} />
                                </div>
                            </Grid.Column>*/}
                            {/*<Grid.Column width={2} className="wit-btn-block-col" >
                                {/*When working with draft.js we need to intercept MouseDown event and prevent default action.
                                    Otherwise it will cause DraftJS editor to lose focus and selection will disapper.
                                    So we are gonna use a div wrapper for all controls which apply styling to sub-selected text.
                                    https://github.com/facebook/draft-js/issues/696
                                }
                                <div className="wit-btn-block" onMouseDown={(e) => e.preventDefault()}>
                                    <Dropdown compact options={this.getAnchorOptions(currentWritingMode, currentTextAnchor)}
                                        trigger={this.renderAnchorValue(currentTextAnchor)} onChange={(event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => this.anchorOptionsChangeHandler(data)}/>
                                </div>
                            </Grid.Column>*/}
                        </Grid.Row>
                    </Grid>
                </Grid.Row>
            </Grid>
        </Grid.Column>;
    }
}
