import * as React from 'react';
import { Grid, Icon, Popup } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { IGalleryItem } from "../../store/Gallery/Gallery";
import { IInfoDialog, InfoDialog } from "../../store/model/GalleryItemComponent";
import { sanitize } from 'dompurify'
import { ILocalizeActions } from '../../store/Localize';

interface IGalleryItemInfoPopupProps {
    galleryItem?: IGalleryItem;
    infoDialog: InfoDialog;
    localize?: ILocalizeActions;
}

interface IGalleryItemInfoPopupState {
    
}

@inject("localize")
@observer
export class GalleryItemInfoPopup extends React.Component<IGalleryItemInfoPopupProps, IGalleryItemInfoPopupState> {

    constructor(props: any) {
        super(props);
        this.state = {
            //infoDialog: InfoDialog.create({})
        };
    }

    public componentWillMount() {
        const { galleryItem } = this.props;
        
            // show not published design, element, graphic and other
        //todo: remove this - not usage
        //if (galleryItem)
          //  (this.state.infoDialog as any as IInfoDialogActions).setInfoDialogData(galleryItem);
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public render() {

        const infoDialogParams = (this.props.infoDialog as any as IInfoDialog);

        return <div>
            <Popup position={"bottom left"} hoverable={true}
                trigger={<Icon className="gic icon-YP2_info1" />}>
                    <Grid className="gic-po-info">
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.publishStatusTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.publishStatus}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.statusTimeTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.statusTime}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.handleremployeeIDTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.handlerEmployeeID}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.artistNickNameTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.memberNickName}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                                <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.artistRankingTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.artRanking}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.artNameTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.artName}</Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6} className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.artDescriptionTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">
                                    <div className="gic-po-info-desc" dangerouslySetInnerHTML={{ __html: sanitize(infoDialogParams.artDescription) }} />
                                </Grid.Column>
                           </Grid.Row>
                           <Grid.Row>
                               <Grid.Column width={6}className="wdm-style-6-title">{this.translate('galleryItemInfoPopup.artPopularityTitle').toString()}:</Grid.Column>
                               <Grid.Column width={10} className="wdm-style-6-text">{infoDialogParams.artPopularity}</Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Popup>
               </div>;
    }
}