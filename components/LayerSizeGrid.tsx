import * as React from "react";
import { inject, observer } from "mobx-react";
import { Grid, Checkbox, CheckboxProps } from "semantic-ui-react";
import { NumberPicker } from 'react-widgets';
import { ILocalizeActions } from "../store/Localize";
import { maxGraphicScale } from "conf";

interface LayerSizeGridProps {
    localize?: ILocalizeActions,
    sizeChangeHandler?: (value: number, isWidth:boolean, keepScale:boolean) => void;
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number,
    units?:string
}

interface LayerSizeGridState {
    keepRatio:boolean;
}

@inject("localize")
@observer
export default class LayerSizeGrid extends React.Component<LayerSizeGridProps, LayerSizeGridState>{

    private static keepRatio = false;

    constructor(props: LayerSizeGridProps) {
        super(props);
        this.state = {keepRatio:LayerSizeGrid.keepRatio};
    }

    sizeChangeHandler(value: number, isWidth: boolean, keepRatio: boolean) {
        if (this.props.sizeChangeHandler) this.props.sizeChangeHandler(value, isWidth, keepRatio);
    }

    onRatioCheckboxChanged(e: any, data: CheckboxProps) {
        LayerSizeGrid.keepRatio = !this.state.keepRatio;
        this.setState({ keepRatio: !this.state.keepRatio });
    }

    render() {
        const { translate } = this.props.localize!;
        const { units } = this.props;
        return <Grid columns={3} className='propgrid size' verticalAlign='middle'>
                   <Grid.Column width={4} verticalAlign="middle" className="size">
                       {translate("propwin.lblSize")}
                        <Checkbox checked={this.state.keepRatio} onChange={(e, data) => this.onRatioCheckboxChanged()}/>
                        {this.state.keepRatio && <div className="lock-img">
                                   <div className="lock-top" />
                                   <div className="delim" />
                                   <div className="lock-bottom" />
                        </div>}
                       <div className="lbl-w">{translate("propwin.lblWidth")}</div>
                       <div className="lbl-h">{translate("propwin.lblHeight")}</div>
                   </Grid.Column>
                   <Grid.Column width={8}>
                       <Grid.Row>
                    <NumberPicker min={0.5} max={this.props.maxWidth}
                        defaultValue={100} value={this.props.width}
                        precision={2} step={.05}
                        parse={(str: string) => parseFloat(str)}
                        format={(value: number) => value.toString()}
                        onChange={(value) => this.sizeChangeHandler(value || 0, true, this.state.keepRatio)} />
                       </Grid.Row>
                       <Grid.Row>
                    <NumberPicker min={.05} max={this.props.maxHeight}
                        defaultValue={100} value={this.props.height}
                        precision={2} step={.05}
                        parse={(str: string) => parseFloat(str)}
                        format={(value: number) => value.toString()}
                        onChange={(value) => this.sizeChangeHandler(value || 0, false, this.state.keepRatio)} />
                       </Grid.Row>
                   </Grid.Column>
                   <Grid.Column width={2}>
                       <Grid.Row>{translate(units === "Inch" ? "propwin.lblIn" : "propwin.lblCm")}</Grid.Row>
                       <Grid.Row>{translate(units === "Inch" ? "propwin.lblIn" : "propwin.lblCm")}</Grid.Row>
                   </Grid.Column>
               </Grid>;
    }    
}