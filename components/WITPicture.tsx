import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { observer, inject } from 'mobx-react';
import WITElement, { ILayerElement, ITransformSelectionProps } from '../containers/WITElement';
import { ILayerActions, LayerObjectType } from '../store/Layer';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDocSettings } from '../store/WITDocSettings';
import WITPictureImg from './WITPictureImg';
import WITPictureVector from './WITPictureVector';
import { IImageLayerActions } from '../store/ImageLayer';

interface IWITPictureProps {
    docSettings?: IWITDocSettings;
    onLoad?: () => void;
    onError?: () => void;
    className?:string;
}

type IWITPictureMergedProps = ILayerElement & ITransformSelectionProps & IWITPictureProps;

@inject("docSettings")
@observer
export default class WITPicture extends React.Component<IWITPictureMergedProps, {}> {

    componentWillMount() {
        const { layer } = this.props;
        const { type } = layer;
        //we need to only load image layers
        if (!layer.previewUrl && type === LayerObjectType.IMAGE)
            (layer as any as ILayerActions).load(true);
    }

    onLoad() {
        const { layer } = this.props;
        if (!layer.previewUrl) {
            (this.props.layer as any as ILayerActions).updateValues({
                isLoaded: true,
                isLoading: false
            });
        }
        console.log('graphic is loaded: ' + this.props.layer.name);
        if (this.props.onLoad) this.props.onLoad();
    }

    onError() {
        const { layer } = this.props;
        if (!layer.previewUrl) {
            (this.props.layer as any as ILayerActions).updateValues({
                isLoaded: false,
                isError: true,
                isLoading: false
            });
        }
        console.log('graphic is error: ' + this.props.layer.name)
        if (this.props.onError) this.props.onError();
    }

    public render() {
        const { docSettings, layer } = this.props;
        const zoom = docSettings ? docSettings.zoom : 1;
        const { type, fillColors, strokes } = this.props.layer;
        const layerActions = layer as any as ILayerActions;
        const layerSrc = layer.previewUrl ? layer.previewUrl : layerActions.getSrc(docSettings && docSettings.viewMode);
        const data = layerActions.getLoadingData();
        let className = 'wit-image';

        if (this.props.className)
            className = `${this.props.className} ${className}`;

        if (layer.isLoading) {
            className += ' wit-loading'; 
        }
        var result: any = null;

        result = <WITElement {...this.props} className={className} dangerouslySetInnerHTML={data && !data.parser ? { __html: data } : null}
            renderer={data && data.parser ? (newWidth: number, newHeight: number) => data.parser!.render(newWidth, newHeight, undefined, fillColors, strokes) : null} >
            {(type === LayerObjectType.IMAGE || layer.previewUrl) && layer.previewUrl !== "__empty" &&
                <WITPictureImg src={layerSrc || '/my-gallery/item75.jpg'} zoom={zoom}                    
                    onLoad={() => this.onLoad()}
                    onError={() => this.onError()}
                    originalLayer={this.props.layer} />}
        </WITElement>;

        return result;
    }
}