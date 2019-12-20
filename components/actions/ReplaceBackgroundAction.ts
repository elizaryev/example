import { ILocalizeActions } from "../../store";
import { ModalDialogButtons, ModalDialogManager, ModalDialogManagerEntry, ModalDialogResult } from "../../store/ModalDialog/ModalDialogManager";

export class ReplaceBackgroundAction {
    localize: ILocalizeActions;
    modalDialogManager: ModalDialogManager;
    dlgId = "";
    private onReplaceHandler:((result?:number)=>void) | undefined;

    constructor(localize: ILocalizeActions, modalDialogManager: ModalDialogManager,
        onReplaceHandler?:(result?:number)=>void) {
        this.localize = localize;
        this.modalDialogManager = modalDialogManager;
        this.onReplaceHandler = onReplaceHandler;
    }

    execute() {
        const { translate } = this.localize;

        const entry: ModalDialogManagerEntry = {
            dialogProps: {
                icon: "warning sign",
                header: translate("uploadBackgroundButton.dlgAccept.header"),
                content: translate("uploadBackgroundButton.dlgAccept.content"),
                size: "tiny",
                type: ModalDialogButtons.Okay | ModalDialogButtons.Cancel,
                //autoClose: true,
                onResult: (result) => this.onDialogResultHandler(result)
            }
        };
        this.dlgId = this.modalDialogManager.addDialog(entry);
    }

    onDialogResultHandler(result?: number): boolean {
        const { modalDialogManager } = this;
        if(this.onReplaceHandler) this.onReplaceHandler(result);
        modalDialogManager.removeDialog(this.dlgId);
        return true;
    }
}