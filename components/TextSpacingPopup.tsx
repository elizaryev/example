import * as React from "react";
import { inject, observer } from "mobx-react";
import { Popup } from "semantic-ui-react";
import SlideStepper from "./SlideStepper";
import { ILocalizeActions } from "../store/Localize";
import { textEditorState, TextInlineStyles, extractTextFormatObject, editorStateToJson } from "../store";
import { EnumUtil } from "../utils/EnumUtil";
import { ILayer, LayerObjectType } from "../store/Layer";
import { TextLayer } from "../store/TextLayer";


interface TextSpacingPopupProps {
    localize?: ILocalizeActions;
    selection: ILayer[];
}

@inject("localize")
@observer
export default class TextSpacingPopup extends React.Component<TextSpacingPopupProps> {

    private toggleInlineStyle(style: string, value?: any) {
        const keys = Object.keys(TextInlineStyles);
        //Handle complex styles
        if (EnumUtil.enumHasValue(TextInlineStyles, style)) {
            let suffix = "-" + value!;

            //Negative values have 'n' prefix
            if (suffix.startsWith("--")) {
                suffix = "-n" + suffix.substr(2);
            }

            style += suffix;
        }
        textEditorState.toggleStyleManually(style);
    }

    letterSpacingChangeHandler(value: number) {
        this.toggleInlineStyle(TextInlineStyles.LetterSpacing, value.toString() + "px");
    }

    lineHeightChangeHandler(value: number) {
        this.toggleInlineStyle(TextInlineStyles.LineHeight, value.toString() + "%");
    }

    private get currentLayers() {
        let layers: (Array<ILayer> | undefined);
        if (this.props.selection.length === 1 && this.props.selection[0].type === LayerObjectType.GROUP) {
            layers = this.props.selection[0].children;
        } else {
            layers = this.props.selection;
        }
        return layers;
    }

    render() {
        const { trn } = this.props.localize!;

        const textLayer = (this.currentLayers!).find((layer) => layer.type === LayerObjectType.TEXT) as any as TextLayer;
        const textFormat = extractTextFormatObject(textEditorState, textLayer);

        return <Popup.Content className="propwin-spacing">
                   <SlideStepper title={trn("propwin.lblLetterSpacing")} units={trn("propwin.lblPixel")}
                                 min={-10} max={10} step={1} precision={1}
                                 value={textFormat.letterSpacing}
                                 onChange={(value) => this.letterSpacingChangeHandler(value || 0)}/>
                   <SlideStepper title={trn("propwin.lblLineSpacing")} units={trn("propwin.lblPercent")}
                                 min={0} max={400} step={1} precision={1}
                                 value={textFormat.lineHeight}
                                 onChange={(value) => this.lineHeightChangeHandler(value || 0)}/>
               </Popup.Content>;
    }
}