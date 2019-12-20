import { inject, observer } from "mobx-react";
import * as React from "react";
import { Dropdown, DropdownItemProps, DropdownProps } from "semantic-ui-react";
import { ILocalizeActions } from "../store/Localize";
import { Units } from "../store/model/Product";
import { IWITDocSettings, IWITDocSettingsActions } from "../store/WITDocSettings";
import "../css/DropdownUnits.less";

interface DropdownUnitsProps {
    localize?:ILocalizeActions,
    units?:Units,
    docSettings?:IWITDocSettings
}

interface DropdownUnitsState {
}

@inject("localize", "docSettings")
@observer
export default class DropdownUnits extends React.Component<DropdownUnitsProps, DropdownUnitsState> {    


    constructor(props: DropdownUnitsProps) {
        super(props);
        this.state = {  };
    }

    onUnitsChange(data: DropdownProps) {
        (this.props.docSettings! as any as IWITDocSettingsActions).setUnits(data.value === "Inch" ? "Inch" : "Cm");
    }

    render() {
        const { translate, trn } = this.props.localize!;
        const { units, docSettings } = this.props;

        const options: DropdownItemProps[] = [
            {
                text:"cm",
                value:"Cm"
            },
            {
                text:"in",
                value:"Inch"
            }
            ];

        return <Dropdown size="mini" options={options} value={this.props.units}
                    className="ddl-units"
                    onChange={(e, data) => this.onUnitsChange(data)}/>;
    }
}