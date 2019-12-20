import * as React from 'react';
import { observer, inject } from 'mobx-react';
import WITElement, { ILayerElement, ITransformSelectionProps } from '../containers/WITElement';
import { ILayer, ILayerActions, ILayerBase } from '../store/Layer';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDocSettings } from '../store/WITDocSettings';

interface IWITPictureVectorProps {
    data?: string;
    zoom: number;
    transformedLayer?: ILayerBase;
    originalLayer: ILayer;
}

export default class WITPictureVector extends React.Component<IWITPictureVectorProps, {}>{

    public render() {
        var style: React.CSSProperties = {
            width: "100%",
            height: "100%"
        }   
        return <div style={style} dangerouslySetInnerHTML={{ __html: this.props.data || '' }} />;
    }
}