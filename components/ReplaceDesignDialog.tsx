import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Image, Message } from "semantic-ui-react";
import ModalDialog from "./ModalDialog";
import { ILocalizeActions } from "../store/Localize";
import { IMyCloudSaverActions } from "../store/MyCloudSaver";
import { IWITDoc, IWITDocActions } from "../store/WITDoc";
import { LayerUtil } from "../utils";
import { ICanvasActions, ICanvas, IPageActions, ModalDialogManager, ModalDialogManagerEntry, ModalDialogButtons, ModalDialogResult } from
    "../store";
import { wdmSettings } from "conf";

export interface ReplaceDesignDialogProps {
    localize: ILocalizeActions;
    open?: boolean;
    imageSrc?: string;
    onClose?: () => void;
    myCloudSaver?: IMyCloudSaverActions;
    sourceHash?:string;
    destinationHash?: string;
    side?: number;

    witdoc?: IWITDoc;
    modalDialogManager?:ModalDialogManager
}

interface ReplaceDesignDialogState {
    isLoading?: boolean;
    errorMessage?: string;
    dlgId?:string;
}

@inject("localize", "myCloudSaver", "witdoc", "modalDialogManager")
@observer
export default class ReplaceDesignDialog extends React.Component<ReplaceDesignDialogProps, ReplaceDesignDialogState> {

    loadedParamsModel:any;

    constructor(props:ReplaceDesignDialogProps) {
        super(props);
        this.state = {};
    }

    onReplaceDesignResult(result: number) {
        if (result === ModalDialogResult.Okay) {
            const { sourceHash, destinationHash, side, myCloudSaver, witdoc } = this.props;
            const self = this;
            this.setState({ isLoading: true, errorMessage:"" });
            if (myCloudSaver && sourceHash && destinationHash && side !== undefined) {                
                myCloudSaver.reloadDesignModel(sourceHash, destinationHash, side).then((paramsModel) => {

                    if (!this.props.open) return;
                    const doc: IWITDoc = paramsModel.designModel;
                    self.loadedParamsModel = paramsModel;

                    const newWidth = doc.pages[0].width;
                    const newHeight = doc.pages[0].height;
                    const oldWidth = witdoc!.selectedPage!.width;
                    const oldHeight = witdoc!.selectedPage!.height;
                    const variance = wdmSettings.templateFilterWidthHeightVariancePct ? wdmSettings.templateFilterWidthHeightVariancePct / 100 : 0;

                    const canReScale = (newWidth !== oldWidth ||
                            newHeight !== oldHeight) &&
                        (!variance || (oldWidth * (1 - variance) <= newWidth &&
                            oldWidth * (1 + variance) >= newWidth &&
                            oldHeight * (1 - variance) <= newWidth &&
                            oldHeight * (1 + variance) >= newWidth));
                    self.assignState({ isLoading: false });
                    if (canReScale)
                        self.showReScaleDialog();
                    else
                        self.reScaleDesign(paramsModel);
                }).catch((error) => {
                    self.setState({
                        isLoading: false,
                        errorMessage: error.toString() + " " + error.message
                    });
                });
            }
            return false;
        }
        if (this.props.onClose) this.props.onClose();
        return false;
    }

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    public assignState(newState: ReplaceDesignDialogState) {
        this.setState(_.assign({}, this.state, newState));
    }

    showReScaleDialog() {
        const { modalDialogManager } = this.props;
        const { translate } = this.props.localize!;
        if(modalDialogManager) {
            const entry: ModalDialogManagerEntry = {
                dialogProps: {
                    icon: "question circle outline",
                    header: translate("dlgRescaleTemplate.header"),
                    content: translate("dlgRescaleTemplate.message"),
                    size: "tiny",
                    type: ModalDialogButtons.Yes | ModalDialogButtons.No,
                    onResult: (result) => this.onReScaleDialogResult(result)

                }
            };
            const dlgId = modalDialogManager.addDialog(entry);
            this.assignState({ dlgId:dlgId });
        }
    }

    onReScaleDialogResult(result: number) {

        this.reScaleDesign(this.loadedParamsModel, result === ModalDialogResult.Yes);
        this.props.modalDialogManager!.removeDialog(this.state.dlgId!);
        this.assignState({ dlgId: undefined });
        return false;
    }

    reScaleDesign(paramsModel: any, doReScale?: boolean) {
        const { witdoc } = this.props;
        const doc: IWITDoc = paramsModel.designModel;
        const layers = doc.pages[0].canvases[0].layers;
        const canvasActions = (witdoc!.selectedPage!.selectedCanvas! as any as ICanvas & ICanvasActions);

        (witdoc as any as IWITDocActions).changeSelection([]);
        if (doReScale) {
            LayerUtil.reScaleLayers(layers, { width: witdoc!.selectedPage!.width, height: witdoc!.selectedPage!.height },
                { width: doc!.pages[0].width, height: doc!.pages[0].height });
        } else {
            //Center layers
            LayerUtil.centerLayers(layers, { width: witdoc!.selectedPage!.width, height: witdoc!.selectedPage!.height },
                { width: doc!.pages[0].width, height: doc!.pages[0].height });
        }
        canvasActions.addLayers(layers, true);
        (witdoc!.selectedPage! as any as IPageActions).load(true);
        if (this.props.onClose) this.props.onClose();
    }

    public render() {
        const { translate } = this.props.localize!;
        const { isLoading } = this.state;
        return <ModalDialog size="small" loading={isLoading}
            icon="icon-YP2_question" open={this.props.open}
            header={translate("dlgLoadDesignSide.header")}
            content={<div>
                {this.props.imageSrc && <Image centered bordered src={this.props.imageSrc} />}
                {translate("dlgLoadDesignSide.content")}
                {this.state.errorMessage && <Message negative>{this.state.errorMessage}</Message>}
            </div>}                        
            onResult={(result) => this.onReplaceDesignResult(result)}/>;
    }
}
