import * as React from "react";
import { observer, inject } from "mobx-react";
import * as _ from "lodash";
import { TransitionablePortal, Card, Button, Icon, Header } from 'semantic-ui-react';
import { ILocalizeActions, MultiPageDesignSpec } from "../store";
import { MultiPageDesignTypes } from "../constants/enums";
import EnhancedButton from "./EnhancedButton";

export interface MultiPageCopyPageControlProps {
    localize?: ILocalizeActions;
    selectedPages?: string[];
    sourcePageName?:string;
    onClose?: () => void;
    onAccept?: () => void;
    onAction?:(action:string) => void;
    multiPageDesignSpec?:MultiPageDesignSpec;
}

@inject("localize")
@observer
export class MultiPageCopyPageControl extends React.Component<MultiPageCopyPageControlProps> {

    closeDialogHandler() {
        if (this.props.onClose) this.props.onClose();
    }

    acceptDialogHandler() {
        if (this.props.onAccept) this.props.onAccept();
    }

    onAction(action: string) {
        if (this.props.onAction) this.props.onAction(action);
    }

    render() {
        const { translate, trn, translateTemplate } = this.props.localize!;
        const { selectedPages, multiPageDesignSpec } = this.props;

        return <TransitionablePortal
                   open={true}
                   closeOnDocumentClick={false}
                   closeOnEscape={false}>
                    <div className="wdm mp-ctl-window">
                       <Card fluid>
                           <Card.Content header={translateTemplate("multiPageList.dlgCopyPage.title", this.props.sourcePageName)}/>
                    <Card.Content description={translateTemplate("multiPageList.dlgCopyPage.message", selectedPages.length-1)}/>
                           <Card.Content extra>
                               <div className="btn-area">
                                   <EnhancedButton size="tiny"
                                                   className="wdm-style-1 wdm-btn-simple"
                                                   disabled={multiPageDesignSpec!.isAllPagesPreSelected()}
                                                   labelPosition="left"
                                                   onClick={() => this.onAction("select all")}>
                                       {trn("multiPageList.dlgCopyPage.lblBtnSelectAll")}
                                   </EnhancedButton>
                                   <EnhancedButton size="tiny"
                                                   className="wdm-style-1 wdm-btn-simple"
                                                   disabled={multiPageDesignSpec!.getPreSelectedPageCount() === 1}
                                                   labelPosition="left"
                                                   onClick={() => this.onAction("deselect all")}>
                                       {trn("multiPageList.dlgCopyPage.lblBtnDeselectAll")}
                                   </EnhancedButton>
                               </div>
                               <div className="btn-area">
                                   <Button primary size="tiny" disabled={selectedPages.length === 0}
                                           onClick={() => this.acceptDialogHandler()}>
                                       {trn("multiPageList.dlgCopyPage.lblBtnOk")}
                                   </Button>
                                   <Button secondary size="tiny"
                                           onClick={() => this.closeDialogHandler()}>
                                       {trn("multiPageList.dlgCopyPage.lblBtnCancel")}
                                   </Button>
                               </div>
                           </Card.Content>
                       </Card>
                   </div>
               </TransitionablePortal>;
    }
};