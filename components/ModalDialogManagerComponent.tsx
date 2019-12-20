import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { ModalDialogManager, ModalDialogManagerEntry } from "../store/ModalDialog/ModalDialogManager";
import ModalDialog from "./ModalDialog";

interface IModalDialogManagerComponentProps {
    modalDialogManager?:ModalDialogManager
}

@inject("modalDialogManager")
@observer
export default class ModalDialogManagerComponent extends React.Component<IModalDialogManagerComponentProps> {

    constructor(props: any) {
        super(props);
        this.state = {
            
        }
    }
    
    render() {
        const { modalDialogManager } = this.props;
        const dialogs: JSX.Element[] = [];
        modalDialogManager.dialogs.forEach((entry: ModalDialogManagerEntry, index) => {
            dialogs.push(<ModalDialog key={index} open={true} {...entry.dialogProps}/>);
        })

        return this.props.modalDialogManager ? <div className="div-inline-block">
                {dialogs}
                </div> : null;
    }
}