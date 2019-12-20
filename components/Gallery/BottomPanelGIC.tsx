import * as React from 'react';
import { Grid, List, Card, Loader } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem } from "../../store/Gallery/Gallery";
import { GalleryItemSharePopup } from "../../components/Gallery/GalleryItemSharePopup"
import { FBCommentPopup } from "../../components/Gallery/GalleryItemFBCommentPopup"

interface IBottomPanelGICProps {
    localize?: ILocalizeActions;
    simplyStyle?: boolean;
    visible?: boolean | undefined;
    galleryItem: IGalleryItem;
    isInfoDataLoaded: boolean;
    loadingParameters: boolean;
    loadedParameters: boolean;
    published: boolean;
    fbDataHref: string;
    twitterUrlWithText: string;

    nickNameForSimplyStyleElement: JSX.Element | string;
    infoElement: JSX.Element;

    itemClickHandler?(e: any, galleryItem: IGalleryItem): void;
    onClickMainDiv?(e: any): void;
    handleOpenPopupOperation?(): void;
    handleClosePopupOperation?(): void;
}

interface IBottomPanelGICState {

}

@inject("localize")
@observer
export class BottomPanelGIC extends React.Component<IBottomPanelGICProps, IBottomPanelGICState> {

    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    itemClickHandler = (e: any, galleryItem: IGalleryItem) => {
        if (this.props.itemClickHandler)
            this.props.itemClickHandler(e, galleryItem);
    }

    onClickMainDiv = (e: any) => {
        if (this.props.onClickMainDiv)
            this.props.onClickMainDiv(e);
    }

    handleOpenPopupOperation = () => {
        if (this.props.handleOpenPopupOperation)
            this.props.handleOpenPopupOperation();
    }
    handleClosePopupOperation = () => {
        if (this.props.handleClosePopupOperation)
            this.props.handleClosePopupOperation();
    }

    public render() {

        const {
            simplyStyle, visible, galleryItem, published, isInfoDataLoaded, loadingParameters,
            fbDataHref, twitterUrlWithText, loadedParameters,
            nickNameForSimplyStyleElement, infoElement
        } = this.props;

        const visibleClassName = visible ? "my-rail-botom visible-element" : "my-rail-botom hide-element"

        return <div className={visibleClassName}
                                    onClick={(e: any) => this.itemClickHandler(e, galleryItem)}>
                                   <Card.Content extra>
                                       <Grid verticalAlign="middle" className={"gallery-item-bottom-panel-transition"} >
                                           <Grid.Row className="gallery-item-header"
                                                     onClick={(e: any) => this.onClickMainDiv(e)}>
                                               <Grid.Column width={13} className={published ? "gi-publ-shared-panel" : ""}>
                                                   {published && !simplyStyle
                                                        ? <List horizontal>
                                                            <List.Item className="gallery-item-bottom-panel-list-item fblike">
                                                                {!isInfoDataLoaded && loadingParameters
                                                                    ? <Loader active inline size='tiny' />
                                                                    : !isInfoDataLoaded && !loadedParameters
                                                                        ? <div className="fb-like-zero-static-img">&nbsp;</div>
                                                                        : <div id={`parent-div-fb-like_${this.ID}`}>
                                                                                <div className="fb-like"
                                                                                    data-href={!isInfoDataLoaded && loadingParameters
                                                                                        ? "not-load" : fbDataHref}
                                                                                    data-layout="button_count"
                                                                                    data-action="like"
                                                                                    data-size="small"
                                                                                    data-show-faces="false"
                                                                                    data-share="false">
                                                                                </div>
                                                                            </div>
                                                                }
                                                            </List.Item>
                                                            <List.Item className="gallery-item-bottom-panel-list-item">
                                                                <GalleryItemSharePopup fbDataHref={fbDataHref}
                                                                    twitterUrlWithText={twitterUrlWithText}
                                                                    handleOpenPopupOperation={this.handleOpenPopupOperation}
                                                                    handleClosePopupOperation={this.handleClosePopupOperation} />
                                                            </List.Item>
                                                            <List.Item className="gallery-item-bottom-panel-list-item">
                                                                <FBCommentPopup fbDataHref={fbDataHref}
                                                                    handleOpenPopupOperation={this.handleOpenPopupOperation}
                                                                    handleClosePopupOperation={this.handleClosePopupOperation} />
                                                            </List.Item>
                                                        </List>
                                                        : nickNameForSimplyStyleElement
                                                    }
                                               </Grid.Column>

                                               <Grid.Column width={3} textAlign="right" className={published ? "gi-publ-info-panel" : ""}>
                                                   {simplyStyle
                                                        ? <div></div>
                                                        : !isInfoDataLoaded && loadingParameters
                                                            ? <Loader active inline size='tiny' />
                                                            : infoElement}
                                               </Grid.Column>
                                           </Grid.Row>
                                       </Grid>
                                   </Card.Content>
                               </div>;
    }
}