import * as React from 'react';
import { Popup, Grid } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem } from "ClientApp/store/Gallery/Gallery";

interface INicknameSympleGICProps {
    localize?: ILocalizeActions;
    isDoubleSide?: boolean | undefined;
    galleryItem: IGalleryItem;
}

interface INicknameSympleGICState {

}

@inject("localize")
@observer
export class NicknameSympleGIC extends React.Component<INicknameSympleGICProps, INicknameSympleGICState> {

    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    public render() {

        const { isDoubleSide, galleryItem } = this.props;

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
}