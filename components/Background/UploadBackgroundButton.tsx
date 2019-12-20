import { IViewMediaImage } from "ClientApp/store/Gallery/Gallery";
import * as $ from 'jquery';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Button, Modal, Popup } from 'semantic-ui-react';
import {
    IWITDoc, IWITDocActions, IViewMediaImage, LayerObjectType, ILocalizeActions, Canvas,
    defaultBackgroundLayerAdjustmentFunction, ILayer
} from "../../store";
import { EnhancedButton } from "../";
import {
    ModalDialogButtons, ModalDialogManager, ModalDialogManagerEntry,  ModalDialogResult
} from "../../store/ModalDialog/ModalDialogManager";
import { graphicConfig } from "conf";
import { ReplaceBackgroundAction } from "../actions";

interface IUpoadBackgroundButtonProps {
    witdoc?:IWITDoc & IWITDocActions,
    localize?: ILocalizeActions,
    modalDialogManager?: ModalDialogManager,
    onUploadComplete?:(items:ILayer[])=>void
}

interface IUploadBackgroundButtonState {
    uploadErrorMessage: string,
    showErrorMessage:boolean
}

@inject("witdoc", "localize", "modalDialogManager")
@observer
export class UploadBackgroundButton extends React.Component<IUpoadBackgroundButtonProps, IUploadBackgroundButtonState> {

    private fileUpload: HTMLInputElement | null = null;
    dlgId = 0;

    constructor(props:IUpoadBackgroundButtonProps) {
        super(props);
        this.state = { uploadErrorMessage: "", showErrorMessage:false };
    }

    private btnUploadBackgroundClick() {
        const { witdoc } = this.props;
        const canvas = witdoc!.selectedPage!.selectedCanvas! as any as Canvas;

        if (!canvas.hasBackground()) {
            this.showFileUpload();
        } else {
            const { localize, modalDialogManager } = this.props;
            const replaceBackgroundAction = new ReplaceBackgroundAction(localize!, modalDialogManager!, (result) => this.showFileUpload(result));
            replaceBackgroundAction.execute();
        }
    }

    private showFileUpload(result?: number) {
        if (result !== undefined && result !== ModalDialogResult.Okay) return;
        console.log('onupload');
        this.setState({uploadErrorMessage:""});
        if (this.fileUpload) {
            this.fileUpload.value = "";
            this.fileUpload.click();
        }
    }

    private onUploadSelected(e: React.ChangeEvent<HTMLInputElement>) {

        //Show warning dialog if number of files exceeds the limit (5)


        const self = this;
        const { witdoc } = this.props;
        const canvas = witdoc!.selectedPage!.selectedCanvas! as any as Canvas;
        const { translateTemplate } = this.props.localize!;

        if (e.target.files &&
            graphicConfig.maxUploadedFilesCount &&
            e.target.files.length > graphicConfig.maxUploadedFilesCount) {
            const { modalDialogManager } = this.props;
            if (modalDialogManager) {
                const entry: ModalDialogManagerEntry = {
                    dialogProps: {
                        icon: "question circle",
                        header: translateTemplate("uploadBackgroundButton.dlgMaxUploadedFiles.header"),
                        content: translateTemplate("uploadBackgroundButton.dlgMaxUploadedFiles.content",
                            e.target.files.length,
                            graphicConfig.maxUploadedFilesCount),
                        size: "tiny",
                        type: ModalDialogButtons.Okay,
                        autoClose: true
                    }
                };
                modalDialogManager.addDialog(entry);
            }
            return;
        }

        if (canvas && witdoc) {
            if (canvas.isUploading) return;
            canvas.uploadFiles(witdoc!.uid, e.target.files!).then((images: IViewMediaImage[]) => {
                canvas.deleteBackground();
                const items = canvas.addGalleryItems(images, LayerObjectType.IMAGE, defaultBackgroundLayerAdjustmentFunction,
                    {
                        data: witdoc,
                        layersInitialData:[
                            {
                                isBackground: true,
                                name:this.props.localize!.trn("lblBackgroundLayerName")
                            }]
                    });
                if (this.props.onUploadComplete) this.props.onUploadComplete(items);
                witdoc.changeSelection(items.map(item => item.uid));
            }).catch((error) => {
                self.setState({ showErrorMessage: true, uploadErrorMessage: error.message as string });
                if (self.fileUpload) $(self.fileUpload).val("");
            });
        }
    }

    closeModal = () => {
        this.setState({showErrorMessage:false});
    }

    render() {
        const { trn, translate } = this.props.localize!;
        const canvas = this.props.witdoc!.selectedPage!.selectedCanvas!;
        const inlineStyle = {
            modal: {
                marginTop: '0px !important',
                marginLeft: 'auto',
                marginRight: 'auto'
            }
        };
        return <div className="div-inline-block">
                   <input type="file" className="wdm-gal-file-upload"
                          multiple={false} accept=".jpg,.jpeg,.png,.svg"
                          onChange={(e) => this.onUploadSelected(e)}
                          ref={(fileUpload) => this.fileUpload = fileUpload}/>
                   <EnhancedButton basic className="wdm-btn-simple wdm-style-5 wdm-btn-bg"
                                   ypIcon="YP2_uploadbg"
                                   labelPosition="left"
                                   loading={canvas && canvas.isUploading}
                                   disabled={canvas && canvas.isUploading}
                                    popup={translate('ttlBtnUploadBackground')}
                                    onClick={()=>this.btnUploadBackgroundClick()}>
                       {translate('lblBtnUploadBackground')}
                       {/*<div className="bottom-lbl">{translate("lblPdfFileOnly")}</div>*/}
                   </EnhancedButton>
               <Modal size="mini" open={this.state.showErrorMessage} onClose={this.closeModal} style={inlineStyle.modal}>
                <Modal.Header>{translate("uploadBackgroundButton.dlgError.Header")}</Modal.Header>
                   <Modal.Content>
                       <p>{this.state.uploadErrorMessage}</p>
                   </Modal.Content>
                   <Modal.Actions>
                        <Button negative onClick={() => this.closeModal()}>Ok</Button>
                   </Modal.Actions>
               </Modal>
        </div>;
    }
}