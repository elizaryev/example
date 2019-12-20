import * as React from 'react';
import { Grid, Dimmer, Loader, Popup, Input } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem, ViewMediaType, IGalleryItemActions } from "../../store/Gallery/Gallery";
import GalleryItemComponentBase from "../../components/Gallery/GalleryItemComponentBase";
import EnhancedButton from "../../components/EnhancedButton";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { galleryItemOperationModel, GalleryItemOperationModel, IGalleryItemOperationModelActions } from "../../store/model/GalleryItemComponent"

interface IGalleryItemSimplyViewProps {
    // required
    parent: any;
    galleryItem: IGalleryItem;
    column: number;

    // can undefined
    localize?: ILocalizeActions;
    isDoubleSide: boolean;
    key?: string;
    previewMediaType?: ViewMediaType;
    showPopup?: boolean;
    imgAdditionalClassName?: string;
    galleryItemOperationModel?: GalleryItemOperationModel;

    // methods
    handleLeaveCard?(): void;
    handleOverCard?(): void;
    onItemLoaded?(item: IGalleryItem): void;
    itemClickHandler?(refElem: HTMLInputElement | null, parent: any, hash?: string): void;
}

interface IGalleryItemSimplyViewState {
    imageLoading: boolean;
    imgContent: string[];
    imgContentLoaded: boolean;

    showPopupGalleryItem: boolean;
    showedPopupGalleryItem: boolean;
    contextPopupGalleryItem?: object;

    observerId?: string[];
    frameLoaded: boolean;
}

@inject("localize", "galleryItemOperationModel")
@observer
export default class GalleryItemSimplyView extends React.Component<IGalleryItemSimplyViewProps, IGalleryItemSimplyViewState> {

    constructor(props: any) {
        super(props);
        this.state = {
            imageLoading: true,
            imgContent: [],
            imgContentLoaded: false,
            showPopupGalleryItem: false,
            showedPopupGalleryItem: false,
            observerId: [],
            frameLoaded: false
        };
    }

    private _isMounted: boolean = false;
    private refElem?: any = undefined;

    componentWillMount() {
        this.loadGalleryItemProps();
    }

    componentDidMount() {
        this._isMounted = true;

        let observerId = storeActionObserver.registerStoreAction(this.props.galleryItemOperationModel, "setOpeningHash", (storeArgs: any, arg: string) => {
            if (this.props.galleryItem.hash !== storeArgs[0]) {
                this.setState({ showPopupGalleryItem: false });
            } else {
                if (!this.state.showedPopupGalleryItem) {
                    this.setState({ showPopupGalleryItem: true, showedPopupGalleryItem: true });
                } else {
                    this.setState({ showPopupGalleryItem: false, showedPopupGalleryItem: false });
                }
            }
        });

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    private loadGalleryItemProps() {
        let self = this;

        const { galleryItem } = this.props;

        (galleryItem as any as IGalleryItemActions).loadMedia().then(() => {

            self.imageLoadedHandler();

            if (self._isMounted)
                self.setState({ imageLoading: false });

        }).catch((error: any) => {
            self.imageLoadedHandler();

            console.log("Error loaded media for gallery item hash:", galleryItem.hash);

            if (self._isMounted)
                self.setState({ imageLoading: false });
        });
    }

    private imageLoadedHandler() {

        const { galleryItem } = this.props;

        if (this.props.onItemLoaded) this.props.onItemLoaded(galleryItem);
    }

    private renderArtName(isDoubleSide: boolean) {

        const { galleryItem } = this.props;
       
        return isDoubleSide
            ? galleryItem.name.length > 28
                ? <Popup position={"bottom left"} hoverable={true}
                         trigger={<div>{`${galleryItem.name.substring(0, 22)}...`}</div>}>
                      <Grid className="gic popup-nick-name">
                          <Grid.Row>
                              <Grid.Column width={16}>
                                  {galleryItem.name}
                              </Grid.Column>
                          </Grid.Row>
                      </Grid>
                  </Popup>
                : <div>{galleryItem.name}</div>
            : galleryItem.name.length > 16
                ? <Popup position={"bottom left"} hoverable={true}
                         trigger={<div>{`${galleryItem.name.substring(0, 11)}...`}</div>}>
                      <Grid className="gic popup-nick-name">
                          <Grid.Row>
                              <Grid.Column width={16}>
                                  {galleryItem.name}
                              </Grid.Column>
                          </Grid.Row>
                      </Grid>
                  </Popup>
                : <div>{galleryItem.name}</div>;
    }

    onClick(hash?: string) {
        if (this.props.itemClickHandler)
            this.props.itemClickHandler(this.refElem, this.props.parent, hash);

        if (this._isMounted)
            this.setState({ showPopupGalleryItem: true });

        if (hash)
            (this.props.galleryItemOperationModel as any as IGalleryItemOperationModelActions).setOpeningHash(hash);
    }

    onResumeEditing(hash?: string) {
        console.log(hash);

        if (this._isMounted)
            this.setState({ showPopupGalleryItem: false });
    }

    onMouseLeavePopup() {
        if (this._isMounted)
            this.setState({ showPopupGalleryItem: false });
    }

    getMultiPageDesignFolderHash() {
        const { galleryItem } = this.props;

        // parse name and take design folder hash with pages sub folders <store>/<mphash>/<pagehash>. 
        // Exmpl: "originalDesignHash": "design1/VQmchakzVEClxpZCYoeS7g/FxXItPVQGUmAKivRRLVKoA"
        if (galleryItem.originalDesignHash)
            return galleryItem.originalDesignHash.substring(0, galleryItem.originalDesignHash.lastIndexOf('/'));
        else
            return "";
    }

    onClickFlippingBook(event: any, hash?: string) {
        this.onClick(hash);
    }

    frameLoadedEvent(loaded: boolean) {
        this.setState({ frameLoaded: loaded });
    }

    render() {

        // the classes resume-edit-hddn-hash and resume-edit-btn usage to ident elements on YP site on the page Choice_Prod - don't change or remove they

        const { isDoubleSide, column, key, galleryItem } = this.props;
        const { imageLoading } = this.state;

        const mpDesignFolderHash = this.getMultiPageDesignFolderHash();

        const loaded = galleryItem.isMultiPage
            ? this.state.frameLoaded
            : !imageLoading;

        return <div className={`gallery-item ${isDoubleSide ? "ds" : ""} clmn-${column} simple ${galleryItem.isMultiPage ? " mp" : ""}  `} key={key}>
                    <Popup basic open={this.state.showPopupGalleryItem}
                           hoverable={true}
                           context={this.refElem}
                           position="top right" 
                           onMouseLeave={() => this.onMouseLeavePopup()}>
                       <Popup.Content>
                           <EnhancedButton basic size="mini"
                                           className="resume-edit-btn wdm-style-7"
                                           ypIcon="icon-YP1_book play"
                                           labelPosition="left"
                                           onClick={() => this.onResumeEditing(galleryItem.hash)}>
                                {this.translate("TileSavedDesigns.PopResumeEditingText").toString()}
                                <input type="hidden" className="resume-edit-hddn-hash" value={galleryItem.hash} />
                           </EnhancedButton>
                       </Popup.Content>
                   </Popup>

                    <div ref={(elem: any) => this.refElem = elem} 
                         onClick={() => this.onClick(galleryItem.hash)}>
                       <Dimmer.Dimmable blurring dimmed={!loaded}>
                           <Dimmer active={!loaded}>
                               <Loader>{this.translate('galleryItemComponent.loadingText').toString()}</Loader>
                           </Dimmer>
                                <GalleryItemComponentBase galleryItem={galleryItem} artName={this.renderArtName(isDoubleSide)}
                                    imgAdditionalClassName={this.props.imgAdditionalClassName}
                                    mpDesignFolderHash={mpDesignFolderHash}
                                    onClickFlippingBook={(event, hash) => this.onClickFlippingBook(event, hash)}
                                    frameLoadedEvent={(loaded) => this.frameLoadedEvent(loaded)}/>
                        </Dimmer.Dimmable>
                    </div>
               </div>;
    }

}