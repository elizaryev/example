import * as React from 'react';
import { observer, inject } from "mobx-react";
import { Radio } from "semantic-ui-react";
import { SizeMatchingType } from "../constants/enums";
import { ILocalizeActions } from '../store/Localize';

interface ISizeMatchingRadioProps {
    localize?: ILocalizeActions;
    disabled?: boolean;
    default?: SizeMatchingType;

    handleChangeSizeMatching?(e: any, data: any): void;
}

interface ISizeMatchingRadioState {
    selectedSizeMatching: SizeMatchingType;
}


@inject("localize")
@observer
export class SizeMatchingRadio extends React.Component<ISizeMatchingRadioProps, ISizeMatchingRadioState> {

    constructor(props: ISizeMatchingRadioProps) {
        super(props);
        this.state = {
            selectedSizeMatching: SizeMatchingType.ExactProduct
        };
    }

    private _isMounted = false;

    componentDidMount() {
        this._isMounted = true;

        if (this.props.default)
            this.setState({ selectedSizeMatching: this.props.default});
    }

    public componentWillUnmount() {
        this._isMounted = false;
    }

    public componentWillReceiveProps(nextProps: any, nextState: any) {

        if ((nextProps && this.props) && (nextProps.default !== this.props.default)) {

            // set without updating
            this.setState({
                selectedSizeMatching: nextProps.default
            });
        }
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    handleChangeSizeMatching = (e, data) => {

        if (this.props.handleChangeSizeMatching)
            this.props.handleChangeSizeMatching(e, data);

        if (this._isMounted)
            this.setState({ selectedSizeMatching: data.value });
    };

    render() {
        return <div>
                   <Radio
                       className="size-matching-radio-item"
                       label={this.translate('TilePublishedDesigns.SizeMatching.GenericSize').toString()}
                       name='sizeMatchingGroup'
                       disabled={this.props.disabled}
                       value={SizeMatchingType.GenericSize}
                       checked={this.state.selectedSizeMatching === SizeMatchingType.GenericSize}
                       onChange={(e, _a) => this.handleChangeSizeMatching(e, _a)} />
                   <Radio
                       className="size-matching-radio-item"
                       label={this.translate('TilePublishedDesigns.SizeMatching.ExactProduct').toString()}
                       name='sizeMatchingGroup'
                       disabled={this.props.disabled}
                       value={SizeMatchingType.ExactProduct}
                       checked={this.state.selectedSizeMatching === SizeMatchingType.ExactProduct}
                       onChange={(e, _a) => this.handleChangeSizeMatching(e, _a)} />
                   <Radio
                       className="size-matching-radio-item"
                       label={this.translate('TilePublishedDesigns.SizeMatching.ExactSize').toString()}
                       name='sizeMatchingGroup'
                       disabled={this.props.disabled}
                       value={SizeMatchingType.ExactSize}
                       checked={this.state.selectedSizeMatching === SizeMatchingType.ExactSize}
                       onChange={(e, _a) => this.handleChangeSizeMatching(e, _a)} />
        </div>;
    }

}