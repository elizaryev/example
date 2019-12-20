import * as React from 'react';
import {observer, inject} from "mobx-react";
import { Button, Segment, Input } from 'semantic-ui-react';
import * as $ from "jquery";
import EnhancedButton from "../components/EnhancedButton";
import { ILocalizeActions } from "../store/Localize";
import { IToolBox, IToolBoxActions, Tools } from "../store/ToolBox";
import { IWITDocSettings, IWITDocSettingsActions } from '../store/WITDocSettings';
import ScreenUtil from "../utils/ScreenUtil";
import 'rc-slider/assets/index.css';
import Slider from "rc-slider";
import Default = Tools.Default;


interface ZoomingBarProps {
    settings: IWITDocSettings,
    localize?: ILocalizeActions,
    toolBox?: IToolBox
}

interface ZoomingBarState {
    handToolDisabled?:boolean
}

@inject("localize", "toolBox")
@observer
export default class ZoomingBar extends React.Component<ZoomingBarProps, ZoomingBarState> {

    zoomInput:HTMLInputElement | null = null;

    constructor(props: ZoomingBarProps) {
        super(props);
        this.state = {};
    }

    private get actions(): IWITDocSettingsActions {
        return this.props.settings as any as IWITDocSettingsActions;
    }

    private btnZoomInClickHandler() {
        this.actions.zoomIn();
    }

    private btnZoomOutClickHandler() {
        this.actions.zoomOut();
    }

    private btnResetClickHandler() {
        this.actions.reset();
    }

    private onHandToolClick() {

        if (this.state.handToolDisabled) return;

        if (this.props.toolBox) {
            const nextTool = this.props.toolBox.tool ? Tools.Default : Tools.Hand;
            (this.props.toolBox as any as IToolBoxActions).setTool(nextTool);
        }
    }

    private onZoomChange(value: number) {
        this.actions.zoomByIndex(value);
    }

    componentDidMount() {
        $(window as any).on("resize", $.proxy(this.componentDidUpdate, this));
        this.updateZoomInput();
    }

    componentWillUnmount() {
        $(window as any).off("resize", $.proxy(this.componentDidUpdate, this));
    }

    componentDidUpdate() {
        const workareaSelector = "#wdm-workarea";
        const maxScrollX = ScreenUtil.getMaxScrollX(workareaSelector);
        const maxScrollY = ScreenUtil.getMaxScrollY(workareaSelector);
        const handToolDisabled = Math.floor(maxScrollX) === 0 && Math.floor(maxScrollY) === 0;
        if (this.state.handToolDisabled !== handToolDisabled) {
            this.setState({handToolDisabled:handToolDisabled});
        }
        this.updateZoomInput();
    }

    updateZoomInput() {
        if (document.activeElement !== this.zoomInput) {
            if (this.zoomInput) this.zoomInput.value = `${Math.round(this.props.settings.zoom * 100)}%`;
        }
    }

    zoomInputFocusOut() {
        let val = this.zoomInput ? this.zoomInput.value : "100";
        val = val.trim().replace(" ", "");
        if (val.endsWith("%")) val = val.substring(0, val.length - 1);
        this.actions.setZoom(+val / 100);
        const self = this;
        window.setTimeout(() => self.actions.setZoom(+val / 100), 100);
    }

    zoomInputEnter(evt: KeyboardEvent) {
        if (evt.keyCode === 13)
            $(this.zoomInput as any).blur();
    }

    public render() {
        const { translate } = this.props.localize!;
        const { settings } = this.props;
        const zoomCount = this.props.settings.zoomFactors.length;
        return <div className='wit zoombar'>
            <div className="cont">
                {/*<Button circular icon='zoom out' onClick={e => this.btnZoomOutClickHandler(e)} />
                <Button onClick={e => this.btnResetClickHandler(e)}> = ({Math.round(this.props.settings.zoom * 100)}%) </Button>
                <Button circular icon='zoom' onClick={e => this.btnZoomInClickHandler(e)} />*/}
                <Segment inverted className="s-left">
                <EnhancedButton basic compact inverted
                        toggle active={this.props.toolBox && this.props.toolBox.tool !== ""}
                    ypIcon="YP2_hand"
                    size="medium"
                    disabled={this.state.handToolDisabled}
                        className="wdm-btn-simple no-border btn-hand hand-tool"
                    popup={translate('zoomingBar.ttlHandTool')}
                        onClick={() => this.onHandToolClick()} />   
                    {/*<EnhancedButton basic compact inverted
                                    ypIcon="YP1_user" size="medium"
                                    className="wdm-btn-simple no-border btn-hand " />*/} 
                </Segment>
                <Segment inverted className="s-right">
                    <EnhancedButton basic compact inverted
                                    size="mini"                                    
                                    ypIcon="YP2_minus"
                                    className="wdm-btn-simple no-border btn-hand"
                                    popup={translate('zoomingBar.ttlZoomOut')}
                                    onClick={() => this.btnZoomOutClickHandler()} />
                    <Slider min={0} max={zoomCount - 1}
                        defaultValue={zoomCount / 2 - 1}
                        value={settings.zoomFactors.indexOf(settings.zoom)}
                        onChange={(value: number) => this.onZoomChange(value)} />
                    <EnhancedButton basic compact inverted
                                    size="mini"
                                    ypIcon="YP2_plus"
                                    className="wdm-btn-simple no-border btn-hand"
                                    popup={translate('zoomingBar.ttlZoomIn')}
                                    onClick={() => this.btnZoomInClickHandler()} />
                    {/*<span className="lbl">{`${Math.round(settings.zoom * 100)}%`}</span>*/}
                    <Input className="lbl">
                        <input ref={(inp: HTMLInputElement | null) => this.zoomInput = inp}
                            onBlur={() => this.zoomInputFocusOut()}
                            onKeyDown={(evt) => this.zoomInputEnter(evt)}/>
                    </Input>
                    <EnhancedButton basic compact inverted
                                    size="medium"
                                    ypIcon="YP2_bound"
                                    className="wdm-btn-simple no-border btn-hand"
                                    popup={translate('zoomingBar.ttlReset')}
                                    onClick={() => this.btnResetClickHandler()} />
                </Segment>
            </div>
        </div>;
    }
}
