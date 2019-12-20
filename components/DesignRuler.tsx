import { inject, observer } from "mobx-react";
import * as React from "react";
import * as $ from 'jquery';
import * as _ from 'lodash';
import { ILocalizeActions } from "../store/Localize";
import { Units } from "../store/model/Product";
import "../css/DesignRuler.less";
import { graphicConfig } from "conf";
import { ILayer } from "../store/Layer";

export enum RulerMode { Horizontal = "horizontal", Vertical = "Vertical" };
export enum TicksAlignment {Begin = "begin", Center="center", End = "end"};

interface DesignRulerProps {
    localize?:ILocalizeActions,
    units?:Units,
    scale?:number,
    offset?:number,
    mode?: RulerMode,
    ticksAlignment?: TicksAlignment,
    selection?:ILayer[]
}

interface DesignRulerState {
}

interface StepSize {
    deltaUnitPx: number,
    deltaUnit: number
}

interface ComponentSize {
    width?: number,
    height?: number,
    rulerOffset?: JQuery.Coordinates | undefined,
    objectOffset?: JQuery.Coordinates | undefined
}

@inject("localize")
@observer
export default class DesignRuler extends React.Component<DesignRulerProps, DesignRulerState> {    


    ruler: HTMLDivElement | null = null;
    stepSize: StepSize|undefined;
    componentSize: ComponentSize | undefined;

    //Ruler offset caused by property window
    //So far only deltaY used by horizontal ruler
    deltaY:number|undefined = 0;
    deltaX: number | undefined = 0;

    constructor(props: DesignRulerProps) {
        super(props);
        this.state = {  };
    }

    getSmallStep(scale:number, units:Units, minStepSizePx:number = 10) {        
        let startDeltaUnit = 0.01;

        while (startDeltaUnit < 100) {

            var deltaUnitPx = startDeltaUnit * scale;
            if (units === Units.Cm) deltaUnitPx /= 2.54;
            deltaUnitPx *= graphicConfig.defaultBrowserScreenDpi;

            if (deltaUnitPx >= minStepSizePx) {
                return {
                    deltaUnitPx,
                    deltaUnit: startDeltaUnit
                } as StepSize;
            }

            startDeltaUnit *= 10;
        }
    }

    canDrawLabel(label: string, availableWidth: number,lineSizeScale: number = 0.65) {

        const { mode } = this.props;

        const letterSize = (mode === RulerMode.Vertical ? this.componentSize.width : this.componentSize.height) * lineSizeScale;

        return this.getLabelLengthInPixels(label, letterSize) <= availableWidth;
    }

    getLabelLengthInPixels(label: string, letterSize: number) {
        let len = 0;
        for (let i = 0; i < label.length; i++) {
            if (label[i] === ".")
                len += 0.33 * letterSize;
            else
                len += letterSize;
        }
        return len;
    }

    renderTicks(maxLabelWidth:number = 20, baseTextRatio:number = 0.65) {
        if (!this.componentSize || !this.stepSize) return null;

        const { mode, units, scale } = this.props;
        const modeSubClassName = mode === RulerMode.Vertical ? "vert" : "hor";
        let classNamePrefix = modeSubClassName + " t_";
        const lblClassNamePrefix = modeSubClassName + " lbl";
        const result: JSX.Element[] = [];

        let startOffset = mode === RulerMode.Vertical
            ? (this.componentSize.rulerOffset!.top - this.componentSize.objectOffset!.top)
            : (this.componentSize.rulerOffset!.left - this.componentSize.objectOffset!.left);

        const deltaStartOffset = startOffset - Math.ceil(startOffset / this.stepSize.deltaUnitPx) * this.stepSize.deltaUnitPx;

        startOffset -= deltaStartOffset;

        const componentLength = mode === RulerMode.Vertical ? this.componentSize.height : this.componentSize.width;

        const startUnit = Math.ceil(startOffset / this.stepSize.deltaUnitPx);


        for (let i = -deltaStartOffset, j=startUnit; i < componentLength; i += this.stepSize.deltaUnitPx) {       

            const inlineStyle: React.CSSProperties = {
                
            }

            if (mode === RulerMode.Vertical) {
                inlineStyle.top = (i) + "px";
            }
            else {
                inlineStyle.left = (i) + "px";
            }

            let canDrawLabel = false;
            //2 digit precision
            const labelText = Math.round(j * this.stepSize.deltaUnit*100)/100;

            let className = "";
            let lblClassName = lblClassNamePrefix;


            if (j % 10 === 0) {
                className = classNamePrefix + "10";
                canDrawLabel = this.canDrawLabel(labelText.toString(), this.stepSize.deltaUnitPx * 5, baseTextRatio);
            }
            else if (j % 5 === 0) {
                className = classNamePrefix + "5";
                canDrawLabel = this.canDrawLabel(labelText.toString(), this.stepSize.deltaUnitPx * 5, baseTextRatio*0.7);
                lblClassName += " med";
            } else {
                className = classNamePrefix + "1";
                canDrawLabel = this.canDrawLabel(labelText.toString(), this.stepSize.deltaUnitPx, baseTextRatio * 0.7);
                lblClassName += " med";
            }            

            result.unshift(<div key={"tk_" + j} style={inlineStyle}
                className={className} />);
            if (canDrawLabel) result.push(<div key={"lbl_" + j} className={lblClassName} style={inlineStyle}>{labelText.toString()}</div>);


            j++;
        }
        return result;
    }

    componentDidMount() {
        this.updateComponent(true);
        $("#wdm-workarea").on("scroll", $.proxy(this.componentDidUpdate, this));
        $(window as any).on("resize", $.proxy(this.componentDidUpdate, this));
    }

    componentWillUnmount() {
        $("#wdm-workarea").off("scroll", $.proxy(this.componentDidUpdate, this));
        $(window as any).off("resize", $.proxy(this.componentDidUpdate, this));
    }

    render() {
        const { translate, trn } = this.props.localize!;
        //Note that selection should be referenced in here
        const { scale, units, mode, selection } = this.props;

        const style: React.CSSProperties = {};


        //Reference each element of selection for the sake of proper reaction
        let isEmptySelection = true;
        let deltaYStyle = "";
        if (selection) {
            const sel = selection.map((val) => val);
            if (selection.length > 0) isEmptySelection = false;
        }

        if (!isEmptySelection && this.deltaY) {
            style.top = this.deltaY + "px";
            deltaYStyle = "adj-y";
        }

        //console.log("UPDATE COMPONENT: ", () => this.updateComponent(true));

        return <div ref={(r) => this.ruler = r}
                style={style}
                className={`wdm-ruler ${mode === RulerMode.Vertical ? "vert" : "hor"} ${deltaYStyle}`}>
            {this.renderTicks()}
               </div>;
    }


    componentWillUpdate() {
        this.updateComponent(false);
    }

    componentDidUpdate() {
        this.updateComponent(true);
    }

    updateComponent(triggerUpdate:boolean) {
        const { scale, units, mode } = this.props;

        if (this.ruler) {

            const componentSize: ComponentSize = {
                width: $(this.ruler).width(),
                height: $(this.ruler).height(),
                objectOffset: $(".wit.page-wrapper").offset(),
                rulerOffset: $(this.ruler).offset()
        };

            let deltaY = 0;
            
            //We need to calculate an offset because of property window
            //if (mode !== RulerMode.Horizontal) {
                //const propwin = $(".wit-propwin");
                //if (propwin.length !== 0) {
                //    deltaY = propwin.height();
                //} else {
                //    deltaY = 0;
                //}
            //}

            const stepSize = this.getSmallStep(scale!, units!, 5);
            if (!_.isEqual(stepSize, this.stepSize) || !_.isEqual(componentSize, this.componentSize) || deltaY !== this.deltaY) {
                this.deltaY = deltaY;
                this.stepSize = stepSize;
                this.componentSize = componentSize;
                if(triggerUpdate)
                    this.forceUpdate();
            }
        }
    }
}