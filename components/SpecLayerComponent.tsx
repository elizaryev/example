import * as React from 'react';
import { Image, Transition } from 'semantic-ui-react';
import { DocumentViewMode, ICanvas, CanvasEditMode } from '../store'
import { IPage, IPageActions } from '../store/Page';
import { ITransformSelection } from '../store/TransformSelection';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';
import { ILayer, LayerObjectType } from '../store/Layer';
import { ILayerElement, renderLayers } from '../containers/WITElement';
import WITPicture from '../components/WITPicture';
import CanvasToolbox from '../components/CanvasToolbox';
import { observer, inject } from 'mobx-react';
import { SpecLayer, SpecLayerType, IGalleryItem  } from "../store";
import { ScreenUtil } from "../utils";

interface ISpecLayerComponentProps {
    witdoc?: IWITDoc & IWITDocActions;    
    docSettings?: IWITDocSettings;
    specLayer: SpecLayer;
    onLoad?: () => void;
    onError?: () => void;
}

@inject("witdoc", "designSpec", "docSettings")
@observer
export class SpecLayerComponent extends React.Component<ISpecLayerComponentProps> {


    updateSizeDimension() {
        //Selected page may not be available
        const page = this.props.witdoc!.selectedPage! || this.props.witdoc!.pages[0];
        const sizeDimension = page.sizeDimension!;
        if (sizeDimension && this.props.specLayer) this.props.specLayer.setSizeDimension(sizeDimension);
    }

    componentWillReceiveProps() {
        this.updateSizeDimension();
    }

    componentWillMount() {
        this.updateSizeDimension();
    }

    componentWillReact() {
        this.updateSizeDimension();
    }

    onLoad() {
        if (this.props.onLoad) this.props.onLoad();
    }

    onError() {
        if (this.props.onError) this.props.onError();
    }
    public render() {
        const { docSettings, specLayer } = this.props;
        const { zoom } = docSettings!;
        const elementStyle: React.CSSProperties = {};
        const sizeDimension = specLayer.sizeDimension;

        //Watermark sizing logic
        if (specLayer.specLayerType === SpecLayerType.ProofWatermark && sizeDimension) {

            let sizingRatio = sizeDimension.heightDesign / sizeDimension.widthDesign;
            //Rotate watermark for tall products such as chopstick
            if (sizingRatio > 1.6) {
                const loadingData = specLayer.getLoadingData();
                if(loadingData)
                    sizingRatio = ScreenUtil.getPixelValueByUnitValue(sizeDimension.heightDesign + sizeDimension.bleedMarginPerSide, sizeDimension.units) /
                        (loadingData as IGalleryItem).parser!.viewBox.width;
                const safeZoneWidth =
                    ScreenUtil.getPixelValueByUnitValue(sizeDimension.widthDesign - 2 * sizeDimension.safeMarginPerSide,
                        sizeDimension.units);
                if (specLayer.height * sizingRatio > safeZoneWidth) {
                    sizingRatio = safeZoneWidth / specLayer.height;
                }

                elementStyle.transform = `scale(${sizingRatio*zoom}) rotate(90deg)`;
            }
            else {
                sizingRatio = 1;
                //Watermark should fit into a Safe zone
                elementStyle.padding =
                    `${ScreenUtil.getPixelValueByUnitValue(
                        sizeDimension.bleedMarginPerSide + sizeDimension.safeMarginPerSide,
                        sizeDimension.units) * zoom / sizingRatio}px`;
            }
        }
        console.log("render spec layer", specLayer.specLayerType);
        return <div>
                   {!specLayer.isLoading &&
                <WITPicture layer={specLayer}
                    ignoreElementStyles={true}
                    elementStyle={elementStyle}
                    className="wdm-proof"
                    onError={() => this.onError} onLoad={() => this.onLoad} />}                   
               </div>;
    }

    componentDidUpdate() {
        const { specLayer } = this.props;
        if (specLayer &&
            specLayer.getLoadingData() &&
            (specLayer.isLoaded || specLayer.isError)) {
            window.__specGraphicLoadCount++;
        }
            
    }
}