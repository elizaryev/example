import { IViewMediaImage } from "ClientApp/store/Gallery/Gallery";
import * as $ from 'jquery';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Button, Modal, Popup } from 'semantic-ui-react';
import { defaultLayerAdjustmentFunction } from "../store";
import { Canvas } from "../store/Canvas";
import { LayerObjectType } from "../store/Layer";
import { ILocalizeActions } from "../store/Localize";
import { IWITDoc } from "../store/WITDoc";
import { ModalDialogButtons, ModalDialogManager, ModalDialogManagerEntry } from "../store/ModalDialog/ModalDialogManager";
import { graphicConfig } from "conf";
import { publishedAction, IPublishedDesignActions } from "../store/Gallery/Published";

interface IUpoadGraphicButtonProps {
    witdoc?:IWITDoc,
    localize?: ILocalizeActions,
    modalDialogManager?: ModalDialogManager;
}

interface IUploadGraphicButtonState {
    uploadErrorMessage: string,
    showErrorMessage:boolean
}

@inject("witdoc", "localize", "modalDialogManager")
@observer
export class UploadGraphicButton extends React.Component<IUpoadGraphicButtonProps, IUploadGraphicButtonState> {

    private fileUpload: HTMLInputElement | null = null;

    constructor(props:IUpoadGraphicButtonProps) {
        super(props);
        this.state = { uploadErrorMessage: "", showErrorMessage:false };
    }

    private btnUploadGraphicClick() {
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

        // to fire event in GalleryItemComponent action to close it
        (publishedAction as any as IPublishedDesignActions).emptyEvent();

        if (e.target.files &&
            graphicConfig.maxUploadedFilesCount &&
            e.target.files.length > graphicConfig.maxUploadedFilesCount) {
            const { modalDialogManager } = this.props;
            if (modalDialogManager) {
                const entry: ModalDialogManagerEntry = {
                    dialogProps: {
                        icon: "warning sign",
                        header: translateTemplate("uploadGraphicButton.dlgMaxUploadedFiles.header"),
                        content: translateTemplate("uploadGraphicButton.dlgMaxUploadedFiles.content",
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
                canvas.addGalleryItems(images, LayerObjectType.IMAGE, defaultLayerAdjustmentFunction, { data: witdoc });
            }).catch((error) => {
                self.setState({ showErrorMessage: true, uploadErrorMessage: error.message });
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
                          multiple={true} accept=".jpg,.jpeg,.png,.svg"
                          onChange={(e) => this.onUploadSelected(e)}
                          ref={(fileUpload) => this.fileUpload = fileUpload}/>
            <Popup trigger={<Button icon='upload'
                loading={canvas && canvas.isUploading}
                disabled={canvas && canvas.isUploading}
                onClick={() => this.btnUploadGraphicClick()}/>}
                content="Upload Graphics" />
               <Modal size="mini" open={this.state.showErrorMessage} onClose={this.closeModal} style={inlineStyle.modal}>
                <Modal.Header>{translate("uploadGraphicButton.dlgError.Header")}</Modal.Header>
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