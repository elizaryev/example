import * as React from "react";
import { inject, observer } from "mobx-react";
import { Popup } from "semantic-ui-react";
import EnhancedButton from "../EnhancedButton";
import { ILocalizeActions, IWITDoc, IWITDocActions, ICanvasActions } from "../../store";
import { UploadBackgroundButton } from "./UploadBackgroundButton";
import { DeleteBackgroundButton } from "./DeleteBackgroundButton";

interface BackgroundToolboxPopupProps {
    localize?: ILocalizeActions,
    witdoc: IWITDoc & IWITDocActions
}

/**
 * Align to stage component
 */
@inject("localize", "witdoc")
@observer
export class BackgroundToolboxPopup extends React.Component<BackgroundToolboxPopupProps>
{
    editBackgroundClick() {
        const { witdoc } = this.props;
        if (witdoc) {
            //witdoc.changeSelection([]);
            const canvas = witdoc.selectedPage!.selectedCanvas!;
            //(canvas as any as ICanvasActions).setEditMode(canvas.editMode === CanvasEditMode.Background
            //    ? CanvasEditMode.Normal
            //    : CanvasEditMode.Background);
            witdoc.changeSelection([(canvas as any as ICanvasActions).getBackground()!.uid]);
        }
    }

    render() {
        const { witdoc } = this.props;
        const { translate } = this.props.localize!;
        const selectedCanvas = witdoc!.selectedPage!.selectedCanvas! as any as ICanvasActions;
        return <Popup.Content className="propwin-popup-btns">
                   <UploadBackgroundButton />
                   {selectedCanvas && selectedCanvas.hasBackground() &&
                <EnhancedButton basic icon className="wdm-btn-simple wdm-style-5 wdm-btn-bg"
                    ypIcon="YP2_edit"
                    labelPosition="left"
                    popup={translate('ttlBtnEditBackground')}
                    onClick={() => this.editBackgroundClick()}>
                    {translate('lblBtnEditBackground')}
                </EnhancedButton>}
                   {selectedCanvas && selectedCanvas.hasBackground() &&
                <DeleteBackgroundButton />}              
               </Popup.Content>;
    }
}