import * as React from 'react';
import { Modal, Button, ModalHeaderProps, SemanticShorthandItem, ModalContentProps, Icon, SemanticICONS } from 'semantic-ui-react';
import { ModalDialogProps, ModalDialogButtons, ModalDialogResult } from "../store/ModalDialog/ModalDialogManager";
import "../css/ModalDialog.less";

interface ModalDialogState {
    isOpened?:boolean;
}

export default class ModalDialog extends React.Component<ModalDialogProps, ModalDialogState> {

    constructor(props:ModalDialogProps) {
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
        let dlgType = (type !== undefined) ? type : (ModalDialogButtons.Okay | ModalDialogButtons.Cancel);

        const iconName = this.props.icon ? (this.props.icon.startsWith("icon-") ? undefined : this.props.icon) : "";
        const iconClass = iconName ? "" : this.props.icon;

        return <Modal trigger={this.props.trigger /* || this.renderDefaultButton*/}
            size={this.props.size} open={this.state.isOpened}
            className={"wdm " + (this.props.className || "")}
            closeOnDimmerClick={closeOnDimmerClick && !loading} 
            closeOnDocumentClick={closeOnDimmerClick && !loading}
            closeOnEscape={closeOnDimmerClick && !loading}
            closeIcon={(this.props.closeIcon !== false) && !loading}
            onOpen={() => this.onOpenDialogHandler()}
            onClose={(e) => this.closeDialogHandler(e, ModalDialogResult.Close)}>
            <Modal.Header>
                    {this.props.icon && <Icon name={iconName} className={iconClass}/>}    
                    {this.props.header}
                </Modal.Header>
            <Modal.Content>
                {this.props.content || "Please, select an action"}
                </Modal.Content>
                <Modal.Actions>
                {((dlgType & ModalDialogButtons.Okay) !== 0) && <Button primary
                        loading={loading}
                        disabled={loading}
                        className="wdm-btn large"
                        onClick={(e) => this.closeDialogHandler(e, ModalDialogResult.Okay)} content="Ok"/>}
                {((dlgType & ModalDialogButtons.Cancel) !== 0) && <Button secondary
                    loading={loading}
                    disabled={loading}
                    className="wdm-btn large"
                    onClick={(e) => this.closeDialogHandler(e, ModalDialogResult.Cancel)} content="Cancel" />} 
                {((dlgType & ModalDialogButtons.Yes) !== 0) && <Button primary
                    loading={loading}
                    disabled={loading}
                    className="wdm-btn large"
                    onClick={(e) => this.closeDialogHandler(e, ModalDialogResult.Yes)} content="Yes" />}
                {((dlgType & ModalDialogButtons.No) !== 0) && <Button secondary
                    loading={loading}
                    disabled={loading}
                    className="wdm-btn large"
                    onClick={(e) => this.closeDialogHandler(e, ModalDialogResult.No)} content="No" />}
               </Modal.Actions>
        </Modal>;
    }
}
