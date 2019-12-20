import * as React from 'react';
import { Header, List, Grid, Icon, Popup, Input, Rail, Button, ButtonProps} from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { Facebook } from "../../store/facebook-class";
import { Twitter } from "../../store/twitter-class"
import { SendToFriendModal } from "../../components/Gallery/SendToFriendModal";
import { GalleryItemOperationPopup } from "../../components/Gallery/GalleryItemOperationPopup";
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";
import { ILocalizeActions } from '../../store/Localize';
import CopyToClipboard from 'react-copy-to-clipboard';

interface IGalleryItemOperationPopupProps {
    fb?: Facebook;
    twitter?: Twitter;
    wdmItem?: string;
    fbDataHref: string;
    twitterUrlWithText: string;
    handleOpenPopupOperation?(): void;
    handleClosePopupOperation?(): void;
    handleShowPopupOperation?(self: GalleryItemOperationPopup): void;
    handleHidePopupOperation?(self: GalleryItemOperationPopup): void;
    operationPopup?: GalleryItemOperationPopup;
    authentication?: Authentication;
    localize?: ILocalizeActions;
}

interface IGalleryItemOperationPopupState {
    showSharePopup: boolean;
    visibleSharePopupWindowClass: string;
    copied: boolean;
}

@inject("fb", "twitter", "authentication", "localize")
@observer
export class GalleryItemSharePopup extends React.Component<IGalleryItemOperationPopupProps,
    IGalleryItemOperationPopupState> {

    constructor(props: any) {
        super(props);

        this.state = {
            showSharePopup: false,
            visibleSharePopupWindowClass: "gallery-item-popup-window-show-share",
            copied: false
        }
    }

    public componentWillMount() {

    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    private openPopupOperationHandler(e: React.MouseEvent, isOpen: boolean = true) {
        e.stopPropagation();
        this.setState({ showSharePopup: isOpen });

        if (isOpen && this.props.handleOpenPopupOperation)
            this.props.handleOpenPopupOperation();
        
        if (!isOpen && this.props.handleOpenPopupOperation)
            this.props.handleClosePopupOperation!();
    }
   
    private renderTriggerElement() {
        return <Icon className="gic icon-YP2_fbshare"
                     onClick={(e: any) => this.openPopupOperationHandler(e)}/>;
    }

    public onItemFbShareClick(event: any) {
        if (this.props.fb) {
            this.props.fb.onShare(this.props.fbDataHref, (this.props.authentication as any as IAuthenticationActions));
        }
    }

    public handleHideSharePopup(self: GalleryItemSharePopup): void {
        self.setState({ visibleSharePopupWindowClass: "gallery-item-popup-window-hide" });
    }

    public handleShowSharePopup(self: GalleryItemSharePopup): void {
        self.setState({ visibleSharePopupWindowClass: "gallery-item-popup-window-show-share" });
    }

    private onCopyClick(event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) {
    }

    public render() {

        return <div>
                   <Popup
                       className={this.state.visibleSharePopupWindowClass}
                       trigger={this.renderTriggerElement()}
                       open={this.state.showSharePopup}
                       position={"bottom left"}>
                       <Grid className="gallery-item-popup-share-main">
                           <Grid.Row>
                               <Grid.Column>
                                   <List horizontal divided>
                                       <List.Item >
                                           <List.Icon name='facebook' size='huge' color="grey"
                                                      className="gallery-item-popup-share-fb-icon"
                                                      onClick={(e: any) => this.onItemFbShareClick(event)}/>
                                       </List.Item>
                                       <List.Item>
                                           <a className="twitter-share-button gallery-item-popup-share-twitter-icon"
                                              href={this.props.twitterUrlWithText}>
                                               <Icon name='twitter square' size='huge' color="grey"/>
                                           </a>
                                       </List.Item>
                                       <List.Item className="gallery-item-popup-share-mail-item">
                                            <SendToFriendModal sharePopup={this}
                                                                  handleShowSharePopup={this.handleShowSharePopup}
                                                                  handleHideSharePopup={this.handleHideSharePopup}
                                                                  operationPopup={this.props.operationPopup!}
                                                                  handleShowPopupOperation={this.props.handleShowPopupOperation!}
                                                                  handleHidePopupOperation={this.props.handleHidePopupOperation!}/>
                                       </List.Item>
                                   </List>
                               </Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column>
                                   <Header as="h3" color="grey">
                                        {this.translate('galleryItemSharePopup.urlText').toString()}
                                   </Header>
                                <List horizontal>
                                    <List.Item>
                                        <Input size="small" as="text"
                                               defaultValue={this.props.fbDataHref}
                                               className="gallery-item-popup-share-url-input"
                                               disabled />
                                    </List.Item>
                                    <List.Item>
                                        <CopyToClipboard text={this.props.fbDataHref}
                                                         onCopy={() => this.setState({ copied: true })}>
                                            <Button size="tiny" className="gallery-item-publish-btns">
                                                <List horizontal>
                                                    <List.Item>
                                                        <Icon className="icon-YP3_copy" />
                                                    </List.Item>
                                                    <List.Item className="gallery-item-publish-btns-title">
                                                        {this.translate('galleryItemSharePopup.copyUrlLinkTitle').toString()}
                                                    </List.Item>
                                                </List>
                                            </Button>
                                        </CopyToClipboard>
                                    </List.Item>
                                </List>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                       <Rail internal position='right' className="gallery-item-close-popup">
                           <Icon className="gallery-item-close-popup-icon" inverted circular={true}
                                 color="black" name={'delete'} flipped={"horizontally"} size="small"
                                 onClick={(e: any) => this.openPopupOperationHandler(e, false)}/>
                       </Rail>
                   </Popup>
               </div>;
    }

}