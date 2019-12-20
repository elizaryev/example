import * as React from "react";
import { inject, observer } from "mobx-react";
import { Radio, CheckboxProps } from "semantic-ui-react";
import { ILocalizeActions, IDesignSpec } from "../store";
import { IWITDocSettings, IWITDocSettingsActions } from "ClientApp/store/WITDocSettings";

interface WorkareaSwitchPanelProps {
    localize?: ILocalizeActions;
    docSettings: IWITDocSettings;
    designSpec:IDesignSpec;
}

@inject("localize", "docSettings", "designSpec")
@observer
export default class WorkareaSwitchPanel extends React.Component<WorkareaSwitchPanelProps> {

    toggleRulers(value:CheckboxProps) {
        (this.props.docSettings as any as IWITDocSettingsActions).setRulers(value.checked);
    }

    toggleSpecGrapic(value: CheckboxProps) {
        (this.props.docSettings as any as IWITDocSettingsActions).setShowSpecGraphic(value.checked);
    }

    render() {
        const freeStyleDesign = this.props.designSpec && this.props.designSpec.freeStyleDesign;
        const { translate } = this.props.localize!;
        const { docSettings } = this.props;
        return <div className="wit switches">
            <div className="cont">
                {translate("workarea.lblRuler")}
                <Radio checked={docSettings && docSettings.showRulers} toggle onClick={(e, value) => this.toggleRulers(value)}/>
                <div className="inline-spacer" />
               {translate("workarea.lblZones")}
                <Radio toggle
                    disabled={freeStyleDesign}
                    checked={!freeStyleDesign && docSettings && docSettings.showSpecGraphic} toggle
                    onClick={(e, value) => this.toggleSpecGrapic(value)} />
            </div>
        </div>;
    }
}