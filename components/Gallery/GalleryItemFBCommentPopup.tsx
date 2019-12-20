import * as React from 'react';
import { Grid, Icon, Popup, Rail, Dimmer, Loader } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { Facebook } from "../../store/facebook-class";
import { ILocalizeActions } from '../../store/Localize';
import { Authentication, IAuthenticationActions } from "../../utils/Authentication";

interface IFBCommentPopupProps {
    fb?: Facebook;
    fbDataHref: string;
    handleOpenPopupOperation?(): void;
    handleClosePopupOperation?(): void;
    localize?: ILocalizeActions;
    authentication?: Authentication;
}

interface IFBCommentPopupState {
    showSharePopup: boolean;
    waitFBLoading: boolean;
}

@inject("fb", "localize", "authentication")
@observer
export class FBCommentPopup extends React.Component<IFBCommentPopupProps, IFBCommentPopupState> {

    constructor(props: any) {
        super(props);

        this.state = {
            showSharePopup: false,
            waitFBLoading: true
    }
    }

    public componentWillMount() {
        setTimeout(() => {
            this.props.fb!.refresh();
        }, 4000);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    private openPopupOperationHandler(isOpen: boolean = true) {

        if (isOpen) {
            setTimeout(() => {
                this.props.fb!.refresh();
            }, 4000);

            setTimeout(() => {
                this.setState({ waitFBLoading: false});
            }, 4000);
        }

        // call fb loginStatusEventHandling
        this.props.fb!.actionFacebookAccountAsync(this.props.authentication as any as IAuthenticationActions).promise
            .then(() => {
                this.setState({ showSharePopup: isOpen });
            });

        if (isOpen)
            this.props.handleOpenPopupOperation!();

        if (!isOpen)
            this.props.handleClosePopupOperation!();
    }

    private renderTriggerElement() {
        return <Icon className="gic icon-YP2_fbcomment"
            onClick={(e: any) => this.openPopupOperationHandler()} />;
    }
   
    public render() {

        //console.log(this.state.showSharePopup);

        return <div>
            <Popup
                trigger={this.renderTriggerElement()}
                open={this.state.showSharePopup}
                position={"bottom left"}>
                <Dimmer.Dimmable blurring dimmed={this.state.waitFBLoading}>
                    <Dimmer active={this.state.waitFBLoading}>
                        <Loader>{this.translate('galleryItemComponent.loadingText').toString()}</Loader>
                    </Dimmer>
                    <Grid className="gallery-item-div-fb-comment">
                        <Grid.Row className="gallery-item-fb-comment-row">
                            <Grid.Column width={16}>
                                <div className="fb-comments"
                                     data-href={this.props.fbDataHref}
                                     data-width="500"
                                     data-numposts="5"></div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Dimmer.Dimmable>
                <Rail internal position='right' className="gallery-item-close-popup">
                    <Icon className="gallery-item-close-fb-comment-popup-icon" inverted circular={true}
                        color="black" name={'delete'} flipped={"horizontally"} size="small"
                        onClick={(e: any) => this.openPopupOperationHandler(false)} />
                </Rail>
            </Popup>
        </div>;
    }

}