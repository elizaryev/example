import { inject, observer } from 'mobx-react';
import * as React from 'react';
import * as $ from "jquery";
import { Image, Button } from 'semantic-ui-react';
import { ILocalizeActions } from "../store/Localize";
import { IMyCloudSaver, IMyCloudSaverActions } from "../store/MyCloudSaver";
import { IWITDoc, IWITDocActions } from "../store/WITDoc";
import { ModalDialogManager, ModalDialogManagerEntry } from "../store/ModalDialog/ModalDialogManager";
import { DesignSpec, getDesignSpecSnapshot } from "../store/model/DesignSpec";
import EnhancedButton from "./EnhancedButton";
import { parserConfig } from "conf";
import ClipboardUtil from "../utils/ClipboardUtil";
import { publishedAction, IPublishedDesignActions } from "../store/Gallery/Published";			
//This import breaks webpack for some reason (cross-refs ?)
//import "../css/DownloadPdfButton.less";

interface IDownloadPdfButtonProps {
    witdoc?:IWITDoc,
    localize?: ILocalizeActions,    
    myCloudSaver?: IMyCloudSaver & IMyCloudSaverActions,
    designSpec?: DesignSpec,
    modalDialogManager?: ModalDialogManager;
    mode?:"pdf"|"proof";
}

@inject("witdoc", "localize", "myCloudSaver", "designSpec", "modalDialogManager")
@observer
export class DownloadPdfButton extends React.Component<IDownloadPdfButtonProps> {

    preloaderId:number = -1;

    renderDlgProofContent(url:string) {
        const { translate } = this.props.localize!;
        let fullUrl = url;
        if (!window.location.href.endsWith('/')) fullUrl = "/" + url;
        fullUrl = window.location.href + fullUrl;
        return <div className="dlg-proof-cont">
            <a target="_blank" href={url}><Image centered src={url} style={{maxWidth:"31.25rem", maxHeight:"19rem"}}/></a>
            <br/>
            {translate("dlgDownloadProof.content")}
            <div><a target="_blank" href={url}>{translate("dlgDownloadProof.lblOpenLink")}</a></div>
            <div style={{ textAlign: "center" }}>
                <Button size="tiny" content={translate("dlgDownloadProof.ttlCopyLink")} onClick={() => ClipboardUtil.copyStringToClipboard(fullUrl)} />
            </div>
               </div>;
    }

    btnDownloadPdfClick = () => {
        const { myCloudSaver, witdoc } = this.props;
        const { modalDialogManager } = this.props;
        const { translate, translateTemplate, trn } = this.props.localize!;
        
        if (!myCloudSaver || myCloudSaver.isLoading) {
            return;
        }

        if (myCloudSaver && witdoc && witdoc.selectedPage) {

            // to fire event in GalleryItemComponent action to close it
            (publishedAction as any as IPublishedDesignActions).emptyEvent();

            (witdoc as any as IWITDocActions).changeSelection([]);
            const page = witdoc!.selectedPage!;
            const canvasIndex = page.canvases.indexOf(page.selectedCanvas!);

            this.preloaderId = modalDialogManager.preloader(translate("msgGeneratingProof"));

            if (this.props.mode === "pdf") {
                //Download Press pdf file of a current side
                //Spec graphics are removed by Jay's and Dixon's request
                //[this.props.designSpec!.getProdTypeSpecGraphicUrl(canvasIndex === 1 ? "Back" : "Front")]
                myCloudSaver.downloadPdf("mydesign", witdoc, { width: witdoc.selectedPage.width, height: witdoc.selectedPage.height }).then(() => {
                        modalDialogManager.removeDialog(this.preloaderId);
                    }).catch(() => {
                        modalDialogManager.removeDialog(this.preloaderId);
                        modalDialogManager.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", error.message));
                    });
            } else {
                //Download png screenshot for a current side
                myCloudSaver.downloadScreenshot("mydesign",
                        witdoc,
                        { width: witdoc.selectedPage.width, height: witdoc.selectedPage.height },
                        //[this.props.designSpec!.getProdTypeSpecGraphicUrl(canvasIndex === 1 ? "Back" : "Front", true)])
                        getDesignSpecSnapshot(this.props.designSpec!))
                    .then((results) => {
                        results.forEach((result, index) => {
                            console.log("ResultID: ", result.id);
                            //Now we get a proof URL (PNG file)
                            const lblSide = trn((index % 2) === 0
                                ? "lblFrontSide"
                                : "lblBackSide");
                            const proofUrl =
                                `${parserConfig.WDMProofUrl}${result.id}/${witdoc.name.replace('/', '-')}-${lblSide}`;
                            const entry: ModalDialogManagerEntry = {
                                dialogProps: {
                                    autoClose: true,
                                    type:
                                        1, //type: ModalDialogButtons.Okay using this statement breaks webpack (because of cross-refs?)
                                    icon: "icon-YP1_book",
                                    size: "tiny",
                                    header: translate("dlgDownloadProof.header"),
                                    content: this.renderDlgProofContent(proofUrl)
                                }
                            };
                            modalDialogManager.addDialog(entry);

                        });
                        modalDialogManager.removeDialog(this.preloaderId);
                    }).catch((error) => {
                        modalDialogManager.removeDialog(this.preloaderId);
                        modalDialogManager.error(translate("defaultModalDlg.errorHeader"),
                            translateTemplate("defaultModalDlg.errorContent", error.message));
                    });
            }
        }
    }

    render() {
        const { mode } = this.props;
        const { trn, translate } = this.props.localize!;
        const isDisabled = this.props.myCloudSaver && this.props.myCloudSaver.isLoading;

        return <EnhancedButton basic ypIcon={mode === "pdf" ? "YP1_download" : "YP1_preview"} size="large"
                               className="wdm-style-1 wdm-btn-simple no-border"
            loading={this.props.myCloudSaver && this.props.myCloudSaver.isLoading}
            labelPosition="left"
            disabled={isDisabled}
            onClick={(e) => this.btnDownloadPdfClick()}
            popup={translate(mode === "pdf" ? "ttlBtnDownloadPdf" : "ttlBtnPreviewProof")}>
                   {trn(mode === "pdf" ? "lblBtnDownloadPdf" : "lblBtnPreviewProof")}
        </EnhancedButton>;
    }
}