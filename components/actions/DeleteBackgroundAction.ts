import { ICanvasActions, ILocalizeActions, IWITDoc, IWITDocActions } from "../../store";
import { ModalDialogButtons, ModalDialogManager, ModalDialogManagerEntry, ModalDialogResult } from "../../store/ModalDialog/ModalDialogManager";

export class DeleteBackgroundAction {
    witdoc: IWITDoc & IWITDocActions;
    localize: ILocalizeActions;
    modalDialogManager: ModalDialogManager;
    dlgId = "";

    constructor(witdoc: IWITDoc & IWITDocActions, localize: ILocalizeActions, modalDialogManager: ModalDialogManager) {
        this.witdoc = witdoc;
        this.localize = localize;
        this.modalDialogManager = modalDialogManager;
    }

    execute() {
        const { translate } = this.localize;

        const entry: ModalDialogManagerEntry = {
            dialogProps: {
                icon: "warning sign",
                header: translate("deleteBackgroundButton.dlgAccept.header"),
                content: translate("deleteBackgroundButton.dlgAccept.content"),
                size: "tiny",
                type: ModalDialogButtons.Okay | ModalDialogButtons.Cancel,
                autoClose: true,
                onResult: (result) => this.onDialogResultHandler(result)
            }
        };
        this.dlgId = this.modalDialogManager.addDialog(entry);
    }

    onDialogResultHandler(result?: number): boolean {
        const { witdoc, modalDialogManager } = this;
        if (result === ModalDialogResult.Okay) {
            if (witdoc) {
                if (witdoc.selection.find(layer => layer.isBackground)) witdoc.changeSelection([]);
                (witdoc.selectedPage!.selectedCanvas! as any as ICanvasActions).deleteBackground();
            }
        }
        modalDialogManager.removeDialog(this.dlgId);
        return true;
    }
}