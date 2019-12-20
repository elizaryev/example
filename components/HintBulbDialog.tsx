import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Image, Message } from "semantic-ui-react";
import ModalDialog from "./ModalDialog";
import EnhancedButton from './EnhancedButton';
import { ILocalizeActions } from "../store/Localize";


export interface HintBulbDialogProps {
    className?:string;
    localize?: ILocalizeActions;
}

interface HintBulbDialogState {
    isLoading?: boolean;
    errorMessage?:string;
}


@inject("localize", "myCloudSaver", "witdoc")
@observer
/**
 * Cancel current design and exit to a home page.
 * Keep interval saved copy in appropriate __AutoSave folder
 */
export default class HintBulbDialog extends React.Component<HintBulbDialogProps, HintBulbDialogState> {

    constructor(props: HintBulbDialogProps) {
        super(props);
        this.state = {};
    }

    public render() {
        const { translate } = this.props.localize!;
        let className = this.props.className || "wdm-hint2";
        return <div className={className}>
                   <EnhancedButton basic
                                   ypIcon="YP1_question bulb"
                                   popup={translate("lblBtnHint1")} className="wdm-btn-simple no-border"/>
                   <span className="ver">ver 1.0.16</span>
               </div>;
    }
}
