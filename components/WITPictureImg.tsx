import * as React from 'react';
import { observer, inject } from 'mobx-react';
import WITElement, { ILayerElement, ITransformSelectionProps } from '../containers/WITElement';
import { ILayer, ILayerActions, ILayerBase } from '../store/Layer';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDocSettings } from '../store/WITDocSettings';

interface IWITPictureImgProps {
    src: string;
    zoom: number;
    transformedLayer?: ILayerBase;
    originalLayer: ILayer;
    onLoad?: () => void;
    onError?: () => void;
}

export default class WITPictureImg extends React.Component<IWITPictureImgProps, {}>{

    private getImgStyle() {
        var layerActions = this.props.originalLayer as any as ILayerActions;
        var isCropping: boolean = this.props.originalLayer.croppingArea !== undefined;

        var style: React.CSSProperties = {
        }
        if (!isCropping) {
            style.width = "100%";
            style.height = "100%";
        }
        else {
            var w = this.props.originalLayer.croppingArea!.width * this.props.zoom;
            var h = this.props.originalLayer.croppingArea!.height * this.props.zoom;

            var scaleX = layerActions.getScaleX();
            var scaleY = layerActions.getScaleY();

            if (this.props.transformedLayer) {                
                scaleX = this.props.transformedLayer.width / this.props.originalLayer.unscaledWidth;
                scaleY = this.props.transformedLayer.height / this.props.originalLayer.unscaledHeight;
            }

            style.width = w * scaleX + "px";
            style.height = h * scaleY + "px";

            style.left = this.props.originalLayer.croppingArea!.x * this.props.zoom * scaleX + "px";
            style.top = this.props.originalLayer.croppingArea!.y * this.props.zoom * scaleY + "px";
        }

        return style;
    }

    private onLoad() {
        this.props.onLoad && this.props.onLoad();
    }

    public render() {
        return <img src={this.props.src ? this.props.src : '/my-gallery/item75.jpg'} style={this.getImgStyle()}
            onLoad={() => this.onLoad()}
            onError={() => this.props.onError && this.props.onError()}/>;
    }
}