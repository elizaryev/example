import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { observer, inject } from 'mobx-react';
import { convertFromHTML, convertFromRaw, Editor, EditorState, ContentState } from 'draft-js';
import WITElement, { ILayerElement, ITransformSelectionProps } from '../containers/WITElement';
import { ILayerActions, LayerObjectType } from '../store/Layer';
import { TextLayer, TextLayerCode } from '../store/TextLayer';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDocSettings } from '../store/WITDocSettings';
import WITPictureImg from './WITPictureImg';
import WITPictureVector from './WITPictureVector';
import { getEditorState, editorStateToJson, textEditorCustomStyleFn, TextInlineStyles, extractRawStylesUnique,
    textEditorBlockStyleFn, 
    WritingMode} from '../store/TextEditor';
import { Dimmer, Loader } from 'semantic-ui-react';
import {IFontLibrary, IFontLibraryActions } from "../store/FontLibrary";

interface IWITTextProps {
    docSettings?: IWITDocSettings;
    fontLibrary?:IFontLibrary;
}

@inject("docSettings", "fontLibrary")
@observer
export default class WITText extends React.Component<ILayerElement & ITransformSelectionProps & IWITTextProps, {}>{
    onChange = (editorState: EditorState) => {
        //this.setState({ editorState });
    }

    public render() {
        const { fontLibrary } = this.props;
        let isLoadingFonts = false;
        const zoom = this.props.docSettings ? this.props.docSettings.zoom : 1;
        const layerActions = this.props.layer as any as ILayerActions;
        const textLayer = this.props.layer as TextLayer;
        let result: any = null;               

        const style: React.CSSProperties = {
            //writingMode: 'vertical-rl',
            fontSize: this.props.docSettings!.zoom * layerActions.getScaleX() * 100 + '%',
            lineHeight: textLayer.lineHeight
        };        

        const layerHasContent = this.props.layer.data !== undefined;
        let layerContent = '';
        var editorState = EditorState.createEmpty();
        //getEditorState uses document under the hood which may cause errors in SSR
        if (typeof document !== "undefined" && layerHasContent) {
            editorState = getEditorState(this.props.layer.data!);
        }

        if (textLayer.writingMode !== WritingMode.Horizontal) {
            (style as any).writingMode = textLayer.writingMode.toString();
            style.position = "absolute";
            style.right = "0";
        }

        if (fontLibrary !== undefined && fontLibrary.isLoadingFonts) {
            // Check if any font is in loading state
            try {
                extractRawStylesUnique(textLayer.data, TextInlineStyles.FontFamily)
                    .forEach((typefaceName) => {
                        const font = (fontLibrary as any as IFontLibraryActions).getFont(typefaceName);
                        if (font !== undefined && font.isLoading) {
                            isLoadingFonts = true;
                            // This exception has thrown for the purpose of break out ot the routine
                            throw {};
                        }
                    });
            } catch (error) {
                // No action required
            }
        }        

        result = <WITElement {...this.props} className={"wit-text " + (textLayer.writingMode === WritingMode.Vertical ? "vert" : "hor")}>
            {/*<div style={style} dangerouslySetInnerHTML={{ __html: layerHasContent ? htmlContent : '' }} ></div>*/}
            <div style={style}>
                <Editor editorState={editorState}
                    onChange={this.onChange} 
                    customStyleFn={textEditorCustomStyleFn}
                    blockStyleFn={textEditorBlockStyleFn}
                    readOnly={true} />
                <Dimmer active={isLoadingFonts && textLayer.visibility} inverted>
                    <Loader indeterminate />
                </Dimmer>
            </div>
        </WITElement>;

        return result;
    }
}