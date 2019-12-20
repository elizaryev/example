/*
 * Empty view component for handling stores and timer events of WDM application
 */
import * as React from "react";
import { observer, inject } from "mobx-react";
import * as $ from "jquery";
import { AutoSaver, ISaveToMyCloudResult } from "../store/MyCloudSaver";
import { IWITDoc } from "../store/WITDoc";
import { IUndoRedoQueue } from "../store/UndoRedo";
import { wdmSettings } from "conf";
import { IPageActions, IDesignSpec } from "../store";
import {IGalleryModel, GalleryType, IGalleryItem, IGalleryItemActions} from "../store/Gallery/Gallery";

interface StoreActionContainerProps {
    witdoc?:IWITDoc;
    galleryModel?: IGalleryModel;
    undoredo?: IUndoRedoQueue;
    designSpec?:IDesignSpec;
}

//interface IStoreActionContainerState {
//    autoSaver:AutoSaver,
//}

@inject("witdoc", "galleryModel", "undoredo", "designSpec")
@observer
export default class StoreActionContainer extends React.Component<StoreActionContainerProps> {         

    private undoRedoId = "";
    private autoSaver:AutoSaver;

    constructor(props: StoreActionContainerProps) {
        super(props);
        //this.state = {autoSaver:new AutoSaver(props.witdoc, (result) => this.onAutoSaverResult(result))};
        this.autoSaver = new AutoSaver(props.witdoc, props.designSpec, (result) => this.onAutoSaverResult(result));
    }

    componentDidMount() {     
        if (wdmSettings.autoSaveSettings.autoSaveOn) {
            this.autoSaver.run();
            this.autoSaver.setSkipAutoSave(true);
        }
    }

    onAutoSaverResult(result: ISaveToMyCloudResult) {
        const { galleryModel } = this.props;
        console.log("AUTOSAVE is done: ", result);
        if (result.code === 0) {
            (this.props.witdoc!.pages[0] as any as IPageActions).updatePreviewDataByGalleryItem(
                result.value!);

            //Update current __AutoSave item
            if (galleryModel) {
                const designGallery = galleryModel.galleries.find((gallery) => gallery.type === GalleryType.Design ||
                    gallery.type === GalleryType.Background);
                if (designGallery) {
                    var foundItem = this.findGalleryItem(result.value!, designGallery.items);
                    if (foundItem && foundItem.viewMedia) {
                        console.log(foundItem.viewMedia[0].thumbImage.tag);
                        (foundItem as any as IGalleryItemActions).updateViewMedia(0, foundItem.viewMedia.length, ...result.value!.viewMedia);
                        console.log('Update Galery Item after AutoSave...');
                        console.log(foundItem.viewMedia[0].thumbImage.tag);
                    }
                }
            }
            if(this.props.undoredo) {
                this.undoRedoId = this.props.undoredo.lastId;
                $("#__undoredo_id").html(this.undoRedoId);
                console.log("auto save completed: ", this.undoRedoId);
                this.autoSaver.setSkipAutoSave(true);
            }
            return;
        }
    }

    findGalleryItem(itemToFind:IGalleryItem, galleryItems: IGalleryItem[]):IGalleryItem  | undefined {
        for (let i = 0; i < galleryItems.length; i++) {
            if (galleryItems[i].hash === itemToFind.hash) return galleryItems[i];
            if (galleryItems[i].children) {
                const foundResult = this.findGalleryItem(itemToFind, galleryItems[i].children);
                if (foundResult) return foundResult;
            }
        }
        return undefined;
    }

    componentWillReact() {
        if (this.props.undoredo) {
            if (this.undoRedoId !== this.props.undoredo.lastId) {
                //if (wdmSettings.autoSaveOn) {
                this.autoSaver.setSkipAutoSave(false);
                console.log("auto save is back: ", this.undoRedoId, this.props.undoredo.lastId);
                //}
            } else {
                this.autoSaver.setSkipAutoSave(true);
                console.log("auto save skip (via componentWillReact): ", this.undoRedoId, this.props.undoredo.lastId);
            }
        }
    }

    render() {
        const { lastId } = this.props.undoredo!;
        return <div id="__undoredo_id">{this.undoRedoId}</div>;
    }
}