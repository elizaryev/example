import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Image, Message } from "semantic-ui-react";
import ModalDialog from "./ModalDialog";
import EnhancedButton from './EnhancedButton';
import { ILocalizeActions } from "../store/Localize";
import { ModalDialogResult } from "../store/ModalDialog/ModalDialogManager";
import { IMyCloudSaverActions } from "../store/MyCloudSaver";
import { IWITDoc, IWITDocActions } from "../store/WITDoc";
import { ICanvasActions } from "../store/Canvas";
import { IPageActions } from "../store/Page";


export interface ExitCancelDialogProps {
    localize?: ILocalizeActions;
}

interface ExitCancelDialogState {
    isLoading?: boolean;
    errorMessage?:string;
}


@inject("localize", "myCloudSaver", "witdoc")
@observer
/**
 * Cancel current design and exit to a home page.
 * Keep interval saved copy in appropriate __AutoSave folder
 */
export default class ExitCancelDialog extends React.Component<ExitCancelDialogProps, ExitCancelDialogState> {

    constructor(props:ExitCancelDialogProps) {
        super(props);
        this.state = {};
    }

    exitCancelDialogResult(result: number) {
        if (result === ModalDialogResult.Okay) {
            //
            this.setState({isLoading:true});
            this.redirectToHomePage();
            return false;
        }
        return true;
    }

    redirectToHomePage() {
        window.skipNavChecking = true;
        window.location.href = "/";
    }

    public render() {
        const { translate } = this.props.localize!;
        const { isLoading } = this.state;
        return <ModalDialog loading={isLoading}
                            icon="icon-YP2_question"
                            trigger={<EnhancedButton circular size="large"
                                                     ypIcon="YP2_cancel cross"
                                                     className="btn-wdm-cancel-design"
                                                     popup={translate('ttlCancelDesign')} />}
                            header={translate("dlgExitCancel.header")}
                            content={<div>
                                    {translate("dlgExitCancel.content")}
                                    {this.state.errorMessage && <Message negative>{this.state.errorMessage}</Message>}
                                    </div>}
                            onResult={(result) => this.exitCancelDialogResult(result)}/>;
    }
}
