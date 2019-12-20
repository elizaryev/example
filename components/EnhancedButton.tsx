import * as React from "react";
import * as _ from "lodash";
import { Button, Popup, ButtonProps, PopupProps, PopupContentProps, SemanticShorthandItem, Icon } from 'semantic-ui-react';

export interface ExtraPopupProps {
    popupProps?: PopupProps,
    popup?: SemanticShorthandItem<PopupContentProps>,
    popupContent?:React.ReactNode;
}

type EnhancedButtonProps = ButtonProps & ExtraPopupProps & {
    ypIcon?:string
};

export default class EnhancedButton extends React.Component<EnhancedButtonProps> {

    buildPopupProps() {
        if (this.props.popupProps) return this.props.popupProps;

        let popupProps: PopupProps | undefined = undefined;

        if (this.props.popup || this.props.popupContent) {
            popupProps = {};
            if(this.props.popup && !this.props.popupContent)
            popupProps.content = this.props.popup;            
        }        
        return popupProps;
    }

    buildButtonProps() {
        let result: ButtonProps = {};
        for (let key in this.props) {            
            if (key !== "popup" && key !== "popupProps" && key !== "popupContent" && key !== "ypIcon") {
                result[key] = (this.props as any)[key];
            }
        }
        return result;
    }

    render() {
        const popupProps = this.buildPopupProps();
        const buttonProps = this.buildButtonProps();

        let iconClass = "";
        
        if (this.props.ypIcon) {
            buttonProps.icon = undefined;
            iconClass = this.props.ypIcon;
            if (!iconClass.startsWith("icon-")) iconClass = "icon-" + iconClass;

            //wdm class indicates that this button belongs to WDM app
            if (buttonProps.className) {
                buttonProps.className = "wdm " + buttonProps.className;
            } else {
                buttonProps.className = "wdm";
            }
        }
        const leftLabel = this.props.labelPosition && this.props.labelPosition === "left";
        const btn = this.props.ypIcon ? <Button {...buttonProps}>
                        {!leftLabel && this.props.children}
                        <Icon className={iconClass} />
                        {leftLabel && this.props.children}        
                    </Button> :
                    <Button {...buttonProps}/>;

        if (popupProps) {
            return <Popup {...popupProps} trigger={<div className="div-inline-block">{btn}</div>}>
                    {this.props.popupContent || null}
                </Popup>;            
        }

        return btn;
    }
}