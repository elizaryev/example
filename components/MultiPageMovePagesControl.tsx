import * as React from "react";
import { observer, inject } from "mobx-react";
import * as _ from "lodash";
import { TransitionablePortal, Card, Button, Icon, Header } from 'semantic-ui-react';
import { ILocalizeActions, MultiPageDesignSpec } from "../store";
import { MultiPageDesignTypes } from "../constants/enums";
import EnhancedButton from "./EnhancedButton";
import "../css/MultiPageList.less";

export interface MultiPageMovePagesControlProps {
    localize?: ILocalizeActions;
    selectedPages?: string[];
    onClose?: () => void;
    onAccept?: () => void;
    onAction?:(action:string) => void;
    multiPageDesignSpec?:MultiPageDesignSpec;
}

interface MultiPageMovePagesControlState {
    showPopup?:boolean
}

@inject("localize")
@observer
export class MultiPageMovePagesControl extends React.Component<MultiPageMovePagesControlProps> {

    constructor(props: MultiPageMovePagesControlProps) {
        super(props);
        this.state = {};
    }

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
        let selectedPagesText = selectedPages ? selectedPages.length : 0;
        if (multiPageDesignSpec!.designType === MultiPageDesignTypes.CROSS_PAGE_DB.toString())
            selectedPagesText *= 2;
        return <TransitionablePortal
                   open={true}
                   closeOnDocumentClick={false}
                   closeOnEscape={false}>
                    <div className="wdm mp-ctl-window">
                       <Card fluid>
                           <Card.Content header={trn("multiPageList.dlgMovePages.title")}/>
                           <Card.Content description={translateTemplate("multiPageList.dlgMovePages.infoText",
                    selectedPagesText)}/>
                    <Card.Content description={
                        <div>
                            <div className="txt-centered ctl-btns">
                                <div>
                                    <EnhancedButton ypIcon="YP3_depth up" size="large"
                                                className="wdm-style-1 wdm-btn-simple"
                                                disabled={!multiPageDesignSpec!.canMoveUp()}
                                                labelPosition="left"
                                                onClick={() => this.onAction("up")}
                                                popup={translate("multiPageList.dlgMovePages.ttlBtnMoveUp")}>
                                    {trn("multiPageList.dlgMovePages.lblBtnMoveUp")}
                                    </EnhancedButton>
                                </div>
                                <div>
                                    <EnhancedButton ypIcon="YP3_depth down" size="large"
                                                    className="wdm-style-1 wdm-btn-simple"
                                                    disabled={!multiPageDesignSpec!.canMoveDown()}
                                                    labelPosition="left"
                                                    onClick={() => this.onAction("down")}
                                                    popup={translate("multiPageList.dlgMovePages.ttlBtnMoveDown")}>
                                        {trn("multiPageList.dlgMovePages.lblBtnMoveDown")}
                                        </EnhancedButton>
                                </div>
                            </div>
                            {translate("multiPageList.dlgMovePages.text")}
                        </div>}/>
                           <Card.Content extra>
                               <div className="btn-area">
                                   <Button primary size="tiny" disabled={!(selectedPages &&
                            selectedPages.length > 0 &&
                            multiPageDesignSpec!.isPreSelectionMoved())}
                                           onClick={() => this.acceptDialogHandler()}>
                                       {trn("multiPageList.dlgMovePages.lblBtnOk")}
                                   </Button>
                                   <Button secondary size="tiny"
                                           onClick={() => this.closeDialogHandler()}>
                                       {trn("multiPageList.dlgMovePages.lblBtnCancel")}
                                   </Button>
                               </div>
                           </Card.Content>
                       </Card>
                   </div>
               </TransitionablePortal>;
    }
};