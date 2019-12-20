import * as React from "react";
import * as _ from "lodash";
import { Image, Popup, ImageProps, PopupProps, PopupContentProps, SemanticShorthandItem, Icon } from 'semantic-ui-react';

export interface ExtraPopupProps {
    popupProps?: PopupProps,
    popup?: SemanticShorthandItem<PopupContentProps>;
    popupContent?: React.ReactNode;
}

type EnhancedButtonProps = ImageProps & ExtraPopupProps & {
    
};

export default class EnhancedImage extends React.Component<EnhancedButtonProps> {

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

    buildImageProps() {
        let result: ImageProps = {};
        for (let key in this.props) {            
            if (key !== "popup" && key !== "popupProps" && key !== "popupContent") {
                result[key] = (this.props as any)[key];
            }
        }
        return result;
    }

    render() {
        const popupProps = this.buildPopupProps();
        const imageProps = this.buildImageProps();
        if (popupProps) {
            return <Popup {...popupProps} trigger={<span><Image {...imageProps} /></span>}/>;
        }

        return <Image {...imageProps}/>;
    }
}