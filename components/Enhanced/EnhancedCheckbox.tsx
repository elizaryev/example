import * as React from "react";
import * as _ from "lodash";
import { Checkbox, CheckboxProps, Popup, PopupProps, PopupContentProps, SemanticShorthandItem } from 'semantic-ui-react';

export interface ExtraPopupProps {
    popupProps?: PopupProps,
    popup?: SemanticShorthandItem<PopupContentProps>;
    popupContent?: React.ReactNode;
}

type EnhancedCheckboxProps = CheckboxProps & ExtraPopupProps & {
};

export default class EnhancedCheckbox extends React.Component<EnhancedCheckboxProps> {

    buildPopupProps() {
        if (this.props.popupProps) return this.props.popupProps;

        let popupProps: PopupProps | undefined = undefined;

        if (this.props.popup || this.props.popupContent) {
            popupProps = {};
            if (this.props.popup && !this.props.popupContent)
                popupProps.content = this.props.popup;
            if (!this.props.popup && this.props.popupContent)
                popupProps.children = this.props.popupContent;
        }
        return popupProps;
    }

    buildCheckboxProps() {
        let result: CheckboxProps = {};
        for (let key in this.props) {            
            if (key !== "popup" && key !== "popupProps" && key !== "popupContent") {
                result[key] = (this.props as any)[key];
            }
        }
        return result;
    }

    render() {
        const popupProps = this.buildPopupProps();
        const checkboxProps = this.buildCheckboxProps();
        if (popupProps) {
            return <Popup {...popupProps} trigger={<span><Checkbox {...checkboxProps}>{this.props.children}</Checkbox></span>}/>;
        }

        return <Checkbox {...checkboxProps}>{this.props.children}</Checkbox>;
    }
}