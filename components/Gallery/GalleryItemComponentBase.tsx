import * as React from 'react';
import { Card, Grid, Image } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem, ViewMediaType, GalleryItemType, IViewMediaImageActions, getViewMediaTypeByIndex } from "../../store/Gallery/Gallery";
import FlippingBook from "../../components/Gallery/FlippingBook";

interface IGalleryItemBaseProps {
    // required
    galleryItem: IGalleryItem;

    // can undefined
    artName?: JSX.Element | string;
    localize?: ILocalizeActions;
    previewMediaType?: ViewMediaType;
    imgAdditionalClassName?: string;
    mpDesignFolderHash?: string;

    // methods
    handleLeaveCard?(): void;
    handleOverCard?(): void;
    itemClickHandler?(e: React.MouseEvent<HTMLElement>, galleryItem?: IGalleryItem): void;
    onClickFlippingBook?(event: any, hash?: string): void;
    frameLoadedEvent?(loaded: boolean): void;
}

interface IGalleryItemBaseState {
    imgContent: string[];
    imgContentLoaded: boolean;
}

@inject("localize")
@observer
export default class GalleryItemComponentBase extends React.Component<IGalleryItemBaseProps, IGalleryItemBaseState> {

    constructor(props: any) {
        super(props);
        this.state = {
            imgContent: [],
            imgContentLoaded: false
        };
    }

    private _isMounted: boolean = false;

    componentWillMount() {
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private handleLeaveCard() {
        if (this.props.handleLeaveCard)
            this.props.handleLeaveCard();
    }

    private handleOverCard() {
        if (this.props.handleOverCard)
            this.props.handleOverCard();
    }

    private itemClickHandler(e: React.MouseEvent<HTMLElement>, galleryItem?: IGalleryItem) {
        if (this.props.itemClickHandler) {
            this.props.itemClickHandler(e, galleryItem);
        }
    }

    private onClickFlippingBook(event: any) {
        if (this.props.onClickFlippingBook) {
            this.props.onClickFlippingBook(event, this.props.galleryItem.hash);
        }
    }

    private renderImages() {

        const { galleryItem, imgAdditionalClassName } = this.props;
        const { imgContentLoaded, imgContent } = this.state;

        // not loaded img
        const viewMediaArr = galleryItem.viewMedia;

        const { hash, type, isInMyCloud } = galleryItem;
        let previewMediaType: string | undefined = this.props.previewMediaType;

        if (viewMediaArr.length <= 0) {
            return <Image className={imgContent.length <= 1 ? "elmnt-stub" : ""} src={require('../../assets/element-stub.png')} />;
        }

        let arrImgContent: string[] = [];

        let imgGrid = <Grid divided centered columns={2} className="gi-grid-image"
            onClick={(e: any) => this.itemClickHandler(e, galleryItem)}>
            <Grid.Row className="gallery-item-row-image-content">
                {galleryItem.viewMedia.map((viewMedia, index, arr) => {

                    const currentImage = previewMediaType === ViewMediaType.Screen
                        ? viewMedia.screenImage!
                        : viewMedia.thumbImage!;
                    if (type === GalleryItemType.Design || type === GalleryItemType.Element || type === GalleryItemType.Background)
                        previewMediaType = getViewMediaTypeByIndex(index);
                    const contentOrUrl: string | undefined = (currentImage as any as IViewMediaImageActions)
                        .getImageUrl(hash, previewMediaType || ViewMediaType.Thumb, isInMyCloud) || currentImage.content;


                    let imageClassName = "gallery-item-main-image" + (type === GalleryItemType.Design || type === GalleryItemType.Background ? " design " : " ")
                        + imgAdditionalClassName;

                    if (contentOrUrl) {
                        arrImgContent.push(contentOrUrl);
                    }
                    return <Grid.Column width={Math.round(16 / arr.length) as any} key={index} className="no-side-padding">
                        <Image className={imageClassName} src={contentOrUrl || require('../../assets/element-stub.png')} />
                    </Grid.Column>;
                })}
            </Grid.Row>
        </Grid>;

        if (!imgContentLoaded) {
            setTimeout(() => {
                if (this._isMounted)
                    this.setState({ imgContent: arrImgContent, imgContentLoaded: true });
            }, 200);
        }

        return imgGrid;
    }

    frameLoadedEvent(loaded: boolean) {
        if (this.props.frameLoadedEvent)
            this.props.frameLoadedEvent(loaded);
    }

    render() {

        const { artName, galleryItem, mpDesignFolderHash } = this.props;

        return <Card onMouseLeave={(e: any) => this.handleLeaveCard()}
                    onMouseOver={(e: any) => this.handleOverCard()} className={`gallery-item-main-card ${galleryItem.isMultiPage ? " mp simple " : ""}`}>

                   <div className="gi-img-container">
                       {galleryItem.isMultiPage
                           ? <FlippingBook designFolderHash={mpDesignFolderHash}
                                           onClickHandler={(event: any) => this.onClickFlippingBook(event)}
                                           frameLoadedEvent={(loaded) => this.frameLoadedEvent(loaded)}
                                           bookSize={"Med"}/>
                           : this.renderImages()}
                   </div>
                   {artName
                       ? <div>{artName}</div>
                       : ""}
               </Card>;
    }
}