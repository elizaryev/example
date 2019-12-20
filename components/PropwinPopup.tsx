import * as React from "react";
import { inject, observer } from "mobx-react";
import { Popup } from "semantic-ui-react";
import EnhancedButton from "./EnhancedButton";
import { ILocalizeActions } from "../store/Localize";
import { ILayer } from "../store/Layer";
import { IPage } from "../store/Page";
import { ICanvasActions, AlignmentType } from "../store/Canvas";
import { Rectangle } from "../store/model";
import { SizeDimension } from "../store/model/Product";

interface PropwinAlignmentPopupProps {
    localize?: ILocalizeActions,
    selection: ILayer[],
    selectedPage?:IPage
}

function alignLayers(props:PropwinAlignmentPopupProps, alignmentType: AlignmentType, alignToStage ?: boolean) {
    const { selectedPage } = props!;
    if (props.selection && selectedPage) {

        let rectangle: Rectangle | undefined = undefined;
        const sd = selectedPage.sizeDimension;
        if (alignToStage && sd) {
            let safeDelta = sd.bleedMarginPerSide + sd.safeMarginPerSide;
            const sm = SizeDimension.getPixelValue(safeDelta, sd.units);

            rectangle = new Rectangle(sm, sm,
                SizeDimension.getPixelValue(sd.widthDesign + 2*sd.bleedMarginPerSide, sd.units) - sm,
                SizeDimension.getPixelValue(sd.heightDesign + 2 * sd.bleedMarginPerSide, sd.units) - sm);
        }

        (selectedPage.selectedCanvas! as any as ICanvasActions).alignLayers(props.selection, alignmentType,
            rectangle);
    }
}


function distributeLayers(props:PropwinAlignmentPopupProps, isVertically ?: boolean) {
    const { selectedPage } = props;
    if (props.selection && selectedPage)
        (selectedPage.selectedCanvas! as any as ICanvasActions).distributeLayers(props.selection, isVertically);
}

/**
 * Align to stage component
 */
@inject("localize")
@observer
export class PropwinAlignmentStagePopup extends React.Component<PropwinAlignmentPopupProps>
{
    render() {
        const { translate } = this.props.localize!;
        const { selection } = this.props;
        return <Popup.Content className="propwin-popup-btns">
                   <div>
                       <div className="align-cont">
                           <div className="cont">
                               <EnhancedButton basic compact ypIcon="YP3_align objects left circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Left)}>
                                   {translate("dlgAlign.lblAlignObjectsLeft")}
                               </EnhancedButton>
                               <EnhancedButton basic compact ypIcon="YP3_align objects center circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Center)}>
                                   {translate("dlgAlign.lblAlignObjectsCenter")}
                               </EnhancedButton>
                               <EnhancedButton basic compact ypIcon="YP3_align objects right circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Right)}>
                                   {translate("dlgAlign.lblAlignObjectsRight")}
                               </EnhancedButton>
                           </div>
                           <div className="delim"/>
                           <div className="cont">
                               <EnhancedButton basic compact ypIcon="YP3_align objects top circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Top)}>
                                   {translate("dlgAlign.lblAlignObjectsTop")}
                               </EnhancedButton>
                               <EnhancedButton basic compact ypIcon="YP3_align objects middle circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Middle)}>
                                   {translate("dlgAlign.lblAlignObjectsMiddle")}
                               </EnhancedButton>
                               <EnhancedButton basic compact ypIcon="YP3_align objects bottom circular"
                                               className="btn-prop" labelPosition="left"
                            onClick={() => alignLayers(this.props, AlignmentType.Bottom)}>
                                   {translate("dlgAlign.lblAlignObjectsBottom")}
                               </EnhancedButton>
                           </div>
                       </div>
                       {selection.length > 2 && <div className="delim ver"/>}
                       {selection.length > 2 &&
                           <div className="distr-cont">
                               <EnhancedButton basic compact ypIcon="YP3_distribute horizontally circular"
                                               className="btn-prop" labelPosition="left"
                                               onClick={() => distributeLayers(this.props)}>
                                   {translate("dlgAlign.lblEvenSpacingHorizontally")}
                               </EnhancedButton>
                               <div className="delim"/>
                               <EnhancedButton basic compact ypIcon="YP3_distribute vertically circular"
                                               className="btn-prop" labelPosition="left"
                                               onClick={() => distributeLayers(this.props, true)}>
                                   {translate("dlgAlign.lblEvenSpacingVertically")}
                               </EnhancedButton>
                           </div>}
                   </div>
               </Popup.Content>;
    }
}

/**
 * Align to objects component
 */
@inject("localize")
@observer
export class PropwinAlignmentPopup extends PropwinAlignmentStagePopup {
    render() {
        const { translate } = this.props.localize!;
        return <Popup.Content className="propwin-popup-btns">
                   <div className="cont">
                       <EnhancedButton basic compact ypIcon="YP3_align stage left circular"
                                       className="btn-prop" labelPosition="left"
                    onClick={() => alignLayers(this.props, AlignmentType.Left, true)}>
                           {translate("dlgAlign.lblAlignStageLeft")}
                       </EnhancedButton>
                       <EnhancedButton basic compact ypIcon="YP3_align stage center circular"
                                       className="btn-prop" labelPosition="left"
                    onClick={() => alignLayers(this.props, AlignmentType.Center, true)}>
                           {translate("dlgAlign.lblAlignStageCenter")}
                       </EnhancedButton>
                       <EnhancedButton basic compact ypIcon="YP3_align stage right circular"
                                       className="btn-prop" labelPosition="left"
                    onClick={() => alignLayers(this.props, AlignmentType.Right, true)}>
                           {translate("dlgAlign.lblAlignStageRight")}
                       </EnhancedButton>
                   </div>
                   <div className="delim hor"/>
                   <div className="cont">
                       <EnhancedButton basic compact ypIcon="YP3_align stage top circular"
                                       className="btn-prop" labelPosition="left"
                    onClick={() => alignLayers(this.props, AlignmentType.Top, true)}>
                           {translate("dlgAlign.lblAlignStageTop")}
                       </EnhancedButton>
                       <EnhancedButton basic compact ypIcon="YP3_align stage middle circular"
                                       className="btn-prop" labelPosition="left"
                    onClick={() => alignLayers(this.props, AlignmentType.Middle, true)}>
                           {translate("dlgAlign.lblAlignStageMiddle")}
                       </EnhancedButton>
                       <EnhancedButton basic compact ypIcon="YP3_align stage bottom circular"
                                       className="btn-prop" labelPosition="left"
                                       onClick={() => alignLayers(this.props, AlignmentType.Bottom, true)}>
                           {translate("dlgAlign.lblAlignStageBottom")}
                       </EnhancedButton>
                   </div>
               </Popup.Content>;
    }
};