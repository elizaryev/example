import * as React from 'react';
import { observer, inject } from 'mobx-react';
import WITElement, { ILayerElement, ITransformSelectionProps, renderLayers } from '../containers/WITElement';
import { ILayerActions, LayerObjectType } from '../store/Layer';
import { IWITDocSettings } from '../store/WITDocSettings';
import { IWITDoc } from '../store/WITDoc';

interface IWITGroupProps {
    witdoc?: IWITDoc;
}

@inject("witdoc")
@observer
export default class WITGroup extends React.Component<ILayerElement & ITransformSelectionProps & IWITGroupProps, {}>{
    public render() {
        const { layer, witdoc } = this.props;
        return <WITElement {...this.props} >
            {renderLayers(layer.children!, witdoc!, witdoc!.transformSelection)}
        </WITElement>;
    }
}