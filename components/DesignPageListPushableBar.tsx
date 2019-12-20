import * as React from "react";
import { inject, observer } from "mobx-react";
import EnhancedButton from "./EnhancedButton";
import { ILocalizeActions } from "../store/index";

interface DesignPageListPushableBarProps {
    localize?:ILocalizeActions;
}

@inject("localize")
@observer
export class DesignPageListPushableBar extends React.Component<DesignPageListPushableBarProps> {
    onFold() {

    }

    render() {
        return <div className="design-page-list pushable">
                   <div className="fold-ctl-cont">
                       <div className="fold-ctl">
                           <EnhancedButton basic compact
                                           className="btn-unfold"
                                           ypIcon="YP2_arrow right2"
                                           popup={this.props.localize!.translate("pageList.ttlFold")}
                                           onClick={() => this.onFold()}/>
                        </div>
                   </div>
                   <div>
                       {this.props.children}
                   </div>
               </div>;
    }
}