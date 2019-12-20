import * as React from "react";
import { observer, inject } from "mobx-react";
import * as _ from "lodash";
import { TransitionablePortal, Card, Button, Icon, Header } from 'semantic-ui-react';
import { ILocalizeActions, MultiPageDesignSpec } from "../store";
import { MultiPageDesignTypes } from "../constants/enums";
import EnhancedButton from "./EnhancedButton";

export interface MultiPageDeletePagesControlProps {
    localize?: ILocalizeActions;
    selectedPages?: string[];
    onClose?: () => void;
    onAccept?: () => void;
    onAction?:(action:string) => void;
    multiPageDesignSpec?:MultiPageDesignSpec;
}

@inject("localize")
@observer
export class MultiPageDeletePagesControl extends React.Component<MultiPageDeletePagesControlProps> {

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

        const deleteInfo = multiPageDesignSpec!.getDeletePreSelectedItemsInfo();
        const msgClassName =
            deleteInfo.count > 0 && deleteInfo.addToDelete === undefined && deleteInfo.removeToDelete === undefined
                ? "msg-positive"
                : "msg-negative";
        const minPageCountTxt = multiPageDesignSpec!.minPageCount +
            (multiPageDesignSpec!.pageCountIncludesCovers ? 0 : multiPageDesignSpec!.coverCount);
        const infoContent = <div className={msgClassName}>
                                {deleteInfo.count === 0 &&
                                    translate("multiPageList.dlgDeletePages.infoTextNoSelection")}
                                {deleteInfo.count > 0 &&
                                    translateTemplate("multiPageList.dlgDeletePages.infoText", deleteInfo.count)}
                                {deleteInfo.addToDelete !== undefined &&
                                    translateTemplate("multiPageList.dlgDeletePages.infoTextNeedToSelect",
                                        deleteInfo.addToDelete)}
                                {deleteInfo.removeToDelete !== undefined &&
                                    translateTemplate(deleteInfo.overRun
                                        ? "multiPageList.dlgDeletePages.infoTextMinPagesExceededNeedToDeselect"
                                        : "multiPageList.dlgDeletePages.infoTextNeedToDeselect",
                                        minPageCountTxt, deleteInfo.removeToDelete)}
                            </div>;

        return <TransitionablePortal
                   open={true}
                   closeOnDocumentClick={false}
                   closeOnEscape={false}>
                    <div className="wdm mp-ctl-window">
                       <Card fluid>
                           <Card.Content header={trn("multiPageList.dlgDeletePages.title")}/>
                           <Card.Content description={infoContent}/>
                    <Card.Content description={translate("multiPageList.dlgDeletePages.text")}/>
                           <Card.Content extra>
                               <div className="btn-area">
                                   <EnhancedButton size="tiny"
                                                   className="wdm-style-1 wdm-btn-simple"
                                                   disabled={multiPageDesignSpec!.isAllPagesPreSelected()}
                                                   labelPosition="left"
                                                   onClick={() => this.onAction("select all")}>
                                       {trn("multiPageList.dlgDeletePages.lblBtnSelectAll")}
                                   </EnhancedButton>
                                   <EnhancedButton size="tiny"
                                                   className="wdm-style-1 wdm-btn-simple"
                                                   disabled={multiPageDesignSpec!.getPreSelectedPageCount() === 0}
                                                   labelPosition="left"
                                                   onClick={() => this.onAction("deselect all")}>
                                       {trn("multiPageList.dlgDeletePages.lblBtnDeselectAll")}
                                   </EnhancedButton>
                               </div>
                               <div className="btn-area">
                                   <Button primary size="tiny" disabled={!multiPageDesignSpec!.canDeletePreSelectedItems()}
                                           onClick={() => this.acceptDialogHandler()}>
                                       {trn("multiPageList.dlgDeletePages.lblBtnOk")}
                                   </Button>
                                   <Button secondary size="tiny"
                                           onClick={() => this.closeDialogHandler()}>
                                       {trn("multiPageList.dlgDeletePages.lblBtnCancel")}
                                   </Button>
                               </div>
                           </Card.Content>
                       </Card>
                   </div>
               </TransitionablePortal>;
    }
};