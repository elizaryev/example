import * as React from 'react';
import { Button, Popup, Icon} from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeStore } from '../store/Localize';
import { IClipboardActions } from '../store/Clipboard';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import EnhancedButton from "./EnhancedButton";

interface ClipboardToolbarProps {
    clipboard?: IClipboardActions,
    witdoc?: IWITDoc & IWITDocActions
}

@inject('localize', 'witdoc', 'clipboard')
@observer
export default class ClipboardToolbar extends React.Component<ClipboardToolbarProps & ILocalizeStore, any> {

    private cutClickHandler() {
        this.props.witdoc!.cutToClipboard();
    }

    private copyClickHandler() {
        this.props.witdoc!.copyToClipboard();
    }

    private pasteClickHandler() {
        this.props.witdoc!.pasteFromClipboard();
    }

    public render() {
        const { clipboard } = this.props;
        const { translate } = this.props.localize!;
        const { selection, layerModifier } = this.props.witdoc!;

        //return <Button.Group>
        //    <Popup
        //        trigger={<Button icon disabled={selection.length == 0 || layerModifier!.isModifying} onClick={() => this.cutClickHandler()} >
        //            <Icon name='cut' />
        //        </Button>}
        //        content={translate('ttlBtnCut')}
        //    />
        //    <Popup
        //        trigger={<Button icon disabled={selection.length == 0 || layerModifier!.isModifying} onClick={() => this.copyClickHandler()}>
        //            <Icon name='copy' />
        //        </Button>}
        //        content={translate('ttlBtnCopy')}
        //    />
        //    <Popup
        //        trigger={<Button icon disabled={!clipboard || !clipboard!.hasData() || layerModifier!.isModifying} onClick={() => this.pasteClickHandler()}>
        //            <Icon name='paste' />
        //        </Button>}
        //        content={translate('ttlBtnPaste')}
        //    />
        //</Button.Group>
        return <div className="clpbrd">
                   <EnhancedButton basic compact ypIcon="YP3_cut circular"
                                   className="btn-prop" labelPosition="left"
                                   popup={translate("propwin.ttlCut")}
                                   disabled={selection.length == 0 || layerModifier!.isModifying}
                                   onClick={() => this.cutClickHandler()}>
                       {translate("propwin.lblCut")}
                   </EnhancedButton>
                   <EnhancedButton basic compact ypIcon="YP3_copy circular"
                                   className="btn-prop" labelPosition="left"
                                   popup={translate("propwin.ttlCopy")}
                                   disabled={selection.length == 0 || layerModifier!.isModifying}
                                   onClick={() => this.copyClickHandler()}>
                       {translate("propwin.lblCopy")}
                   </EnhancedButton>
                   <EnhancedButton basic compact ypIcon="YP3_paste circular"
                                   className="btn-prop" labelPosition="left"
                                   popup={translate("propwin.ttlPaste")}
                                   disabled={!clipboard || !clipboard!.hasData() || layerModifier!.isModifying}
                                   onClick={() => this.pasteClickHandler()}>
                       {translate("propwin.lblPaste")}
                   </EnhancedButton>
               </div>;

    }
}
