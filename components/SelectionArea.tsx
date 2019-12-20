import * as React from 'react';
import { ILayer, ILayerActions, LayerObjectType } from '../store/Layer';

interface ISelectionAreaProps {
    selection: ILayer[],
    zoom: number,
    onSelect?(layer: ILayer): void,
    style?:CSSStyleDeclaration
}

export default class SelectionArea extends React.Component<ISelectionAreaProps>
{

    private onItemMouseDown(textLayer: ILayer) {
        if (this.props.onSelect) {
            this.props.onSelect(textLayer);
        }
    }

    renderGroupSubSelection(groupLayer: ILayer) {
        const { zoom } = this.props;
        return groupLayer.children
            ? groupLayer.children.filter(layer => layer.type === LayerObjectType.TEXT)
            .map((textLayer) => {
                const layerActions = textLayer as any as ILayerActions;
                //const bounds = layerActions.getScreenBounds();
                let transformStr = `translate(${textLayer.x*zoom}px, ${textLayer.y*zoom}px) `;
                if (textLayer.rotation) {
                    transformStr += `rotate(${textLayer.rotation}deg)`;
                }
                const style: React.CSSProperties = {
                    transform: transformStr,
                    width: textLayer.width * zoom + "px",
                    height: textLayer.height * zoom + "px",
                    cursor: "text"
                };
                return <div id={textLayer.uid} className="wit-sub-text" style={style} onMouseDown={(e) => this.onItemMouseDown(textLayer)}/>;
            })
            : null;
    }

    public render() {
        const { selection } = this.props;
        const groupLayer = selection.length === 1 && selection[0].type === LayerObjectType.GROUP
            ? selection[0]
            : undefined;

        return <div className='area' style={this.props.style}>
            {groupLayer && this.renderGroupSubSelection(groupLayer)}
               </div>;
    }
}