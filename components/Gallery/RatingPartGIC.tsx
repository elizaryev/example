import * as React from 'react';
import { List, Rating, RatingProps } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { IGalleryItem } from "ClientApp/store/Gallery/Gallery";

interface IRatingPartGICProps {
    localize?: ILocalizeActions;
    ratingValueElement: JSX.Element | string;
    column: number;
    disabled: boolean;
    parentType: string;
    ratingValue: number;

    onRate?(event, data): void;
}

interface IRatingPartGICState {

}

@inject("localize")
@observer
export class RatingPartGIC extends React.Component<IRatingPartGICProps, IRatingPartGICState> {

    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    onRate = (event, data) => {
        if (this.props.onRate)
            this.props.onRate(event, data);
    }

    public render() {

        const { ratingValueElement, column, disabled, parentType, ratingValue } = this.props;

        return <List horizontal className="gic rating">
                   <List.Item>
                       <Rating icon='star'
                               size={column > 2 ? "mini" : undefined}
                               rating={ratingValue}
                               maxRating={5}
                               onRate={(event, data) => this.onRate(event, data)}
                               disabled={disabled} />
                   </List.Item>
                   <List.Item className={`value ${parentType} clmn-${column}`}>
                        {ratingValueElement}
                   </List.Item>
               </List>;
    }
}

