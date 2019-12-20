import * as React from 'react';
import { Rail, Grid, List, Card } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem} from "ClientApp/store/Gallery/Gallery";

interface ITopPanelGICProps {
    localize?: ILocalizeActions;
    visible: boolean;
    galleryItem: IGalleryItem;
    parentType: any;
    column: number;

    rightContentElement: JSX.Element;
    leftContentElement: JSX.Element;

    itemClickHandler?(e: any, galleryItem: IGalleryItem): void;
    onClickMainDiv?(e: any): void;
}

interface ITopPanelGICState {

}

@inject("localize")
@observer
export class TopPanelGIC extends React.Component<ITopPanelGICProps, ITopPanelGICState> {

    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    private gridClassName = "gallery-item-top-panel-transition";

    itemClickHandler = (e: any, galleryItem: IGalleryItem) => {
        if (this.props.itemClickHandler)
            this.props.itemClickHandler(e, galleryItem);
    }

    onClickMainDiv = (e: any) => {
        if (this.props.onClickMainDiv)
            this.props.onClickMainDiv(e);
    }

    public render() {

        const { visible, galleryItem, parentType, column, rightContentElement, leftContentElement
        } = this.props;

        const listItemClassName = `gic top-banner ${parentType} clmn-${column}`;
        const visibleRailClassName = visible ? "gic visible-element" : "gic hide-element";

        return <Rail internal position="left" className={visibleRailClassName} onClick={(e: any) => this.itemClickHandler(e, galleryItem)}>
                   <Card.Content extra>
                       <Grid verticalAlign="middle" className={this.gridClassName}>
                           <Grid.Row className="gallery-item-header" onClick={(e: any) => this.onClickMainDiv(e)}>
                               <Grid.Column width={16} className="gallery-item-top-panel-column">
                                   <List horizontal className="gic top-banner">
                                       <List.Item className="gic">
                                           {leftContentElement}
                                       </List.Item>
                                       <List.Item className={listItemClassName}>
                                           {rightContentElement}
                                       </List.Item>
                                   </List>
                               </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Card.Content>
               </Rail>;
    }

}