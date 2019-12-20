import * as React from "react";
import * as _ from "lodash";
import { Image, Popup, IconProps, PopupProps, PopupContentProps, SemanticShorthandItem, Icon } from 'semantic-ui-react';

export interface ExtraPopupProps {
    popupProps?: PopupProps,
    popup?: SemanticShorthandItem<PopupContentProps>
}

type EnhancedIconProps = IconProps & ExtraPopupProps & {
    
};

export default class EnhancedIcon extends React.Component<EnhancedIconProps> {

    buildPopupProps() {
        if (this.props.popupProps) return this.props.popupProps;

        const popupProps: PopupProps = {};

        if (this.props.popup) {
            popupProps.content = this.props.popup;
            return popupProps;
        }        
    }

    buildIconProps() {
        let result: IconProps = {};
        for (let key in this.props) {            
            if (key !== "popup" && key !== "popupProps") {
                result[key] = (this.props as any)[key];
            }
        }
        return result;
    }

    render() {
        const popupProps = this.buildPopupProps();
        const iconProps = this.buildIconProps();
        if (popupProps) {
            return <Popup {...popupProps} trigger={<span><Icon {...iconProps}/></span>} />;            
        }

        return <Icon {...iconProps}/>;
    }
}