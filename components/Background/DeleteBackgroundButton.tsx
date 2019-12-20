import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { ICanvasActions, ILocalizeActions, IWITDoc, IWITDocActions } from "../../store";
import { ModalDialogButtons, ModalDialogManager, ModalDialogManagerEntry, ModalDialogResult } from "../../store/ModalDialog/ModalDialogManager";
import { EnhancedButton } from "../";
import { DeleteBackgroundAction } from "../actions";

interface IDeleteBackgroundButtonProps {
    witdoc?:IWITDoc & IWITDocActions,
    localize?: ILocalizeActions,
    modalDialogManager?: ModalDialogManager
}

@inject("witdoc", "localize", "modalDialogManager")
@observer
export class DeleteBackgroundButton extends React.Component<IDeleteBackgroundButtonProps> {

    private dlgId = "";    

    constructor(props: IDeleteBackgroundButtonProps) {
        super(props);
    }

    deleteBackgroundClick() {
        const { witdoc, localize, modalDialogManager } = this.props;
        const deleteBackgroundAction =
            new DeleteBackgroundAction(witdoc!, localize!, modalDialogManager!);
        deleteBackgroundAction.execute();
    }

    render() {
        const { translate } = this.props.localize!;
        return <EnhancedButton basic icon className="wdm-btn-simple wdm-style-5 wdm-btn-bg"
                               ypIcon="YP2_deletebg"
                               labelPosition="left"
                               popup={translate('ttlBtnDeleteBackground')}
                               onClick={() => this.deleteBackgroundClick()}>
                   {translate('lblBtnDeleteBackground')}
               </EnhancedButton>;
    }
}