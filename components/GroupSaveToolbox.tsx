import * as React from "react";
import { inject, observer } from "mobx-react";
import * as $ from "jquery";
import EnhancedButton from "./EnhancedButton";
import { ILocalizeActions } from "../store/Localize";
import { ILayer, LayerObjectType } from "../store/Layer";
import { IWITDoc, IWITDocActions } from "../store/WITDoc";
import "../css/GroupSaveToolbox.less";

interface GroupSaveToolboxProps {
    localize?: ILocalizeActions;
    witdoc?:IWITDoc;
    selection: ILayer[];
    onSaveAsClick?:()=>void;
}

interface GroupSaveToolboxState {
    open?: boolean;
    context?:object;
}

/**
 * Floating popup window with buttons
 */
@inject("witdoc", "localize")
@observer
export default class GroupSaveToolbox extends React.Component<GroupSaveToolboxProps, GroupSaveToolboxState> {

    timeout: number = 0;
    savedProps?:GroupSaveToolboxProps;

    constructor(props: GroupSaveToolboxProps) {
        super(props);
        this.state = {};
    }

    groupUngroupLayers(groupFlag: boolean) {
        const docAction = (this.props.witdoc as any as IWITDocActions);

        if (groupFlag) {
            docAction.changeSelection([docAction.groupLayers(this.props.selection).uid]);
        } else {
            const ungroupedLayers = docAction.ungroupLayer(this.props.selection[0]);
            if (ungroupedLayers) {
                docAction.changeSelection(ungroupedLayers.map((layer) => layer.uid));
            }
        }
    }

    onSaveAsClick() {
        if (this.props.onSaveAsClick) this.props.onSaveAsClick();
    }

    componentWillReceiveProps(nextProps: GroupSaveToolboxProps) {
        if (this.savedProps !== this.props) {
            this.savedProps = this.props;
        }
    }

    render() {
        const { translate } = this.props.localize!;
        const { selection } = this.props;

        let isSelectionContainsGroup = false;       
        selection.forEach((layer) => {
            isSelectionContainsGroup = isSelectionContainsGroup || layer.type === LayerObjectType.GROUP;
        });

        let cellClassName = "ctl-group-save";
        if (!selection || selection.length === 0) {
            cellClassName += " inactive";
        }

        return <div className={cellClassName}>
                       {!isSelectionContainsGroup && <EnhancedButton basic size="mini"
                                        className="wdm-style-7"
                                        ypIcon="YP2_group"
                                        labelPosition="left"
                                        disabled={!selection || selection.length <= 1}
                                        popup={translate("propwin.ttlGroupLayers")}
                                        onClick={() => this.groupUngroupLayers(true)}>
                        </EnhancedButton>}
                       {isSelectionContainsGroup && <EnhancedButton basic size="mini"
                                       className="wdm-style-7 ungrp"
                                       ypIcon="YP2_group"
                                       labelPosition="left"
                                       disabled={!selection || selection.length != 1}
                                       popup={translate("propwin.ttlUngroupLayers")}
                                       onClick={() => this.groupUngroupLayers(false)}>
                       </EnhancedButton>}
                       <EnhancedButton basic size="mini"
                                       className="wdm-style-7"
                                       ypIcon="YP1_elements"
                                       labelPosition="left"
                                       disabled={!selection || selection.length === 0}
                                       popup={translate("propwin.ttlSaveAsElements")}
                                       onClick={() => this.onSaveAsClick()}>
                       </EnhancedButton>
               </div>;
    }
}