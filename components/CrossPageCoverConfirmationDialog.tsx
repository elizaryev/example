import * as React from 'react';
import { inject, observer } from "mobx-react";
import { Modal, Button, Checkbox, SemanticShorthandItem, ModalContentProps, Icon, SemanticICONS } from 'semantic-ui-react';
import { ModalDialogProps, ModalDialogButtons, ModalDialogResult } from "../store/ModalDialog/ModalDialogManager";
import { ILocalizeActions } from "../store";
import "../css/ModalDialog.less";

interface ModalDialogState {
    isOpened?: boolean;
    checked?:boolean;
}

type Props = ModalDialogProps & {
    localize?:ILocalizeActions
}

@observer
@inject("localize")
export default class CrossPageCoverConfirmationDialog extends React.Component<Props, ModalDialogState> {

    constructor(props:Props) {
        super(props);
        this.state = {};
    }

    componentWillMount() {
        this.setState({ isOpened: this.props.open });
    }

    renderDefaultButton() {
        return <Button text="Open"/>;
    }

    closeDialogHandler(e: React.MouseEvent<HTMLElement>, result: number) {
        e.preventDefault();
        e.stopPropagation();
        if (this.props.onResult) {
            const res = this.props.onResult(result);
            if (this.props.open === undefined)
                this.setState({ isOpened: !res });
            return;
        } else if(this.props.autoClose !== false) {
            this.setState({isOpened: false});
        }
    }

    private onOpenDialogHandler() {
        this.setState({isOpened:true});
    }

    public render() {

        const { loading, closeOnDimmerClick, type } = this.props;
        const { checked } = this.state;

        const iconName = this.props.icon ? (this.props.icon.startsWith("icon-") ? undefined : this.props.icon) : "";
        const iconClass = iconName ? "" : this.props.icon;

        const { translate, trn } = this.props.localize!;

        return <Modal trigger={this.props.trigger /* || this.renderDefaultButton*/
}
                      size="tiny" open={this.state.isOpened}
                      className={"wdm " + (this.props.className || "")}
                      closeOnDimmerClick={closeOnDimmerClick && !loading}
                      closeOnDocumentClick={closeOnDimmerClick && !loading}
                      closeOnEscape={closeOnDimmerClick && !loading}
                      closeIcon={(this.props.closeIcon !== false) && !loading}
                      onOpen={() => this.onOpenDialogHandler()}
                      onClose={(e) => this.closeDialogHandler(e, ModalDialogResult.Close)}>
                   <Modal.Header>
                       {this.props.icon && <Icon name={iconName} className={iconClass}/>}
                       {translate("multiPageList.dlgCrossPageVerifyCover.title")}
                   </Modal.Header>
                   <Modal.Content>
                       {translate("multiPageList.dlgCrossPageVerifyCover.message")}
                       <div>
                            <br/>
                            <Checkbox label={trn("multiPageList.dlgCrossPageVerifyCover.lblAgree")} checked={checked}
                                     onChange={() => this.setState({ checked: !this.state.checked })}/>
                        </div>
                   </Modal.Content>
                   <Modal.Actions>
                       <Button primary
                               loading={loading}
                               disabled={!checked || loading}
                               className="wdm-btn large"
                               onClick={(e) => this.closeDialogHandler(e, ModalDialogResult.Okay)} content={trn(
                        "multiPageList.dlgCrossPageVerifyCover.lblBtnConfirm")}/>
                   </Modal.Actions>
               </Modal>;
    }
}
