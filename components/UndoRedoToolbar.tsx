import * as React from 'react';
import { Button, Popup, Icon, Divider} from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeStore } from '../store/Localize';
import { IUndoRedoQueue, IUndoRedoQueueActions } from '../store/UndoRedo';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import EnhancedButton from "./EnhancedButton";

interface UndoRedoToolbarProps {
    undoredo?: IUndoRedoQueue & IUndoRedoQueueActions,
    witdoc?: IWITDoc & IWITDocActions
}

@inject('undoredo', 'localize', 'witdoc')
@observer
export default class UndoRedoToolbar extends React.Component<UndoRedoToolbarProps & ILocalizeStore, any> {

    private undoClickHandler() {
        this.props.witdoc!.changeSelection([]);
        this.props.undoredo!.undo();
    }

    private redoClickHandler() {
        this.props.witdoc!.changeSelection([]);
        this.props.undoredo!.redo();
    }

    public render() {
        const { layerModifier } = this.props.witdoc!;
        const { undoredo } = this.props;
        const { translate, trn } = this.props.localize!
        const isRedoDisabled = undoredo === undefined || !undoredo!.canRedo() || layerModifier!.isModifying;
        const isUndoDisabled = undoredo === undefined || !undoredo!.canUndo() || layerModifier!.isModifying;
        return <div>
            {/*<Popup trigger={<span><Button basic icon labelPosition="right" className="wdm-btn-simple no-border"
                    disabled={isUndoDisabled}
                    onClick={() => this.undoClickHandler()}>
                    {trn("lblBtnUndo")}
                    <Icon name='undo' />
                </Button></span>}
                content={translate('ttlBtnUndo')}
            />*/}
            <EnhancedButton basic icon labelPosition="right"
                className="wdm-btn-simple no-border btn-undo-redo undo"
                ypIcon="YP2_undo"
                disabled={isUndoDisabled}
                onClick={() => this.undoClickHandler()}
                popup={translate("ttlBtnUndo")}>
                {trn("lblBtnUndo")}
            </EnhancedButton>
            <div className="wdm-vertical-divider"/>
            <EnhancedButton basic icon labelPosition="left"
                className="wdm-btn-simple no-border btn-undo-redo"
                disabled={isRedoDisabled}
                ypIcon="YP2_redo"
                           onClick={() => this.redoClickHandler()}
                           popup={translate("ttlBtnRedo")}>
                {trn("lblBtnRedo")}
           </EnhancedButton>
        </div>;
    }
}
