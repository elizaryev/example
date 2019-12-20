import * as React from "react";
import { inject, observer } from "mobx-react";
import { Popup, PopupProps } from "semantic-ui-react";
import * as $ from "jquery";
import EnhancedButton from "./EnhancedButton";
import { IWITDoc, IWITDocActions, ILayer, LayerObjectType, ILocalizeActions } from "../store";
import { ModalDialogManager } from "../store/ModalDialog/ModalDialogManager";
import { DeleteBackgroundAction } from "./actions";

interface FloatingPopupWindowProps {
    localize?: ILocalizeActions;
    witdoc?:IWITDoc;
    selection: ILayer[];
    onSaveAsClick?: () => void;
    modalDialogManager?:ModalDialogManager
}

interface FloatingPopupWindowState {
    open?: boolean;
    context?:object;
}

/**
 * Floating popup window with buttons
 */
@inject("witdoc", "localize", "modalDialogManager")
@observer
export default class FloatingPopupWindow extends React.Component<FloatingPopupWindowProps, FloatingPopupWindowState> {

    timeout: number = 0;
    savedProps?:FloatingPopupWindowProps;

    constructor(props: FloatingPopupWindowProps) {
        super(props);
        this.state = {};
    }

    private popup = React.createRef<React.Component<PopupProps>>();

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

    onDeleteClick(layers: ILayer[]) {
        if (layers.length === 1 && layers[0].isBackground) {
            const deleteBackgroundAction =
                new DeleteBackgroundAction(this.props.witdoc, this.props.localize, this.props.modalDialogManager);
            deleteBackgroundAction.execute();
        } else {
            this.props.witdoc!.removeLayers(layers);
        }
    }

    onSendToBgClick(layers: ILayer[]) {
        (this.props.witdoc as any as IWITDocActions).changeSelection([]);
        this.props.witdoc!.selectedPage!.selectedCanvas!.sendToBackground(layers);
    }

    selectionMouseEnterHandler() {
        clearTimeout(this.timeout);
        this.setState({ open: true, context: $('div.wit.selection#witsel')[0] });
        $(".flt-win-popup").off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $('div.wit.selection#witsel').first().off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $('div.wit.selection#witsel').first().on("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $(".flt-win-popup").on("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
    }

    hidePopup() {
        clearTimeout(this.timeout);
        this.setState({ open: false });
        $('div.wit.selection#witsel').first().off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $(".flt-win-popup").off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $(".flt-win-popup").off("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
    }

    selectionMouseLeaveHandler() {
        clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => this.hidePopup(), 1000);
    }

    componentWillReceiveProps(nextProps: FloatingPopupWindowProps) {
        if (this.savedProps !== this.props) {
            this.hidePopup();
            //Normally the component is reacting automatically by mobx-react
            //so we need to additionally store the props and compare them later
            // nextProps===this.props when the reaction was caused by mobx
            this.savedProps = this.props;
        }
    }

    componentDidUpdate() {
        //$('div.wit.selection#witsel').first().on("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
        $(".flt-win-popup").off("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
        $(".flt-win-popup").off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $(".flt-win-popup").on("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
    }

    componentDidMount() {
        $('div.wit.selection#witsel').first().on("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
        $(".flt-win-popup").on("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
        $('div.wit.selection#witsel').first().off("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
        $('div.wit.selection#witsel').first().off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
        $(".flt-win-popup").off("mouseenter", $.proxy(this.selectionMouseEnterHandler, this));
        $(".flt-win-popup").off("mouseleave", $.proxy(this.selectionMouseLeaveHandler, this));
    }

    render() {
        const { translate } = this.props.localize!;
        const { selection } = this.props;

        let isSelectionContainsGroup = false;       
        selection.forEach((layer) => {
            isSelectionContainsGroup = isSelectionContainsGroup || layer.type === LayerObjectType.GROUP;
        });
        
        return <Popup basic open={this.state.open}
            context={this.state.context}
            hoverable={true}
            ref={this.popup}
            position="top right"
            className="flt-win-popup">
            <Popup.Content className="flt-win">
                {selection.length > 1 && !isSelectionContainsGroup && <EnhancedButton basic size="mini"
                                className="wdm-style-7"
                                ypIcon="YP2_group"
                                labelPosition="left"
                                popup={translate("propwin.ttlGroupLayers")}
                                onClick={() => this.groupUngroupLayers(true)}>
                     {translate("propwin.lblGroupLayers")}
                 </EnhancedButton>}
                {selection.length === 1 && isSelectionContainsGroup && <EnhancedButton basic size="mini"
                                className="wdm-style-7 ungrp"
                                ypIcon="YP2_group"
                                labelPosition="left"
                                popup={translate("propwin.ttlUngroupLayers")}
                                onClick={() => this.groupUngroupLayers(false)}>
                     {translate("propwin.lblUngroupLayers")}
                 </EnhancedButton>}
                {selection.length > 0 && <EnhancedButton basic size="mini"
                    className="wdm-style-7"
                    ypIcon="YP1_elements"
                    labelPosition="left"
                    popup={translate("propwin.ttlSaveAsElements")}
                    onClick={() => this.onSaveAsClick()}>
                     {translate("propwin.lblSaveAsElements")}
                </EnhancedButton>}
                {selection.length > 0 && <EnhancedButton basic size="mini"
                    className="wdm-style-7"
                    ypIcon="YP3_trash"
                    labelPosition="left"
                    popup={translate("propwin.ttlDelete")}
                    onClick={() => this.onDeleteClick(this.props.witdoc!.selection)}>
                    {translate("propwin.lblDelete")}
                </EnhancedButton>}
                {/*selection.length > 0 && <EnhancedButton basic size="mini"
                    className="wdm-style-7"
                    ypIcon="YP2_send"
                    labelPosition="left"
                    popup={"Send to BG"}
                    onClick={() => this.onSendToBgClick(this.props.witdoc!.selection.slice(0))}>
                    {"Send To BG"}
                </EnhancedButton>*/}
            </Popup.Content>
        </Popup>;
    }
}