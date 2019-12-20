import * as React from "react";
import * as $ from "jquery";
import { observer, inject } from "mobx-react";
import { IToolBox, IToolBoxActions } from "../store/ToolBox";
import ScreenUtil from "../utils/ScreenUtil";

export interface ToolBoxProps {
    toolBox?:IToolBox & IToolBoxActions
}

export interface ToolBoxState {
    mousePressed?: boolean,
    mouseOut?:boolean
}

@inject("toolBox")
@observer
export default class ToolBox extends React.Component<ToolBoxProps, ToolBoxState> {

    private startX:number = 0;
    private startY:number = 0;
    private scrollX:number = 0;
    private scrollY: number = 0;

    constructor(props: ToolBoxProps) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        $("#wdm-toolbox").on("mouseleave", $.proxy(this.mouseLeaveHandler, this));
        $("#wdm-toolbox").on("mousedown", $.proxy(this.mouseDownHandler, this));

        console.log('didmount');
        ScreenUtil.clearWindowSelection();
    }

    componentDidUpdate() {
        //$("#wdm-toolbox").on("mouseleave", $.proxy(this.mouseLeaveHandler, this));
        //$("#wdm-toolbox").on("mousedown", $.proxy(this.mouseDownHandler, this));
    }

    mouseLeaveHandler() {
        this.setState({});
        this.disableTool();
    }

    mouseLeaveDownHandler() {
        this.setState({mousePressed:true, mouseOut:true});
    }

    mouseEnterDownHandler() {
        this.setState({ mousePressed: true, mouseOut: false });

    }

    mouseDownHandler(e:JQuery.Event) {
        this.setState({ mousePressed: true, mouseOut: false });
        $("#wdm-toolbox").off("mouseleave", $.proxy(this.mouseLeaveHandler, this));
        $("#wdm-toolbox").on("mouseleave", $.proxy(this.mouseLeaveDownHandler, this));
        $("#wdm-toolbox").on("mouseenter", $.proxy(this.mouseEnterDownHandler, this));
        $(window as any).on("mouseup", $.proxy(this.mouseUpHandler, this));
        $(window as any).on("mousemove", $.proxy(this.mouseMoveHandler, this));
        if (e.screenX !== undefined && e.screenY !== undefined) {
            this.startX = e.screenX;
            this.startY = e.screenY;
            this.scrollX = $("#wdm-workarea").scrollLeft() || 0 ;
            this.scrollY = $("#wdm-workarea").scrollTop() || 0;
        }
    }

    mouseMoveHandler(e: JQuery.Event) {
        const workareaSelector = "#wdm-workarea";
        const workarea = $(workareaSelector);
        if (e.screenX !== undefined && e.screenY !== undefined) {
            const dx = this.startX - e.screenX;
            const dy = this.startY - e.screenY;
            const maxScrollX: number = ScreenUtil.getMaxScrollX(workareaSelector);
            const maxScrollY: number = ScreenUtil.getMaxScrollY(workareaSelector);

            let newScrollX = this.scrollX + dx;
            let newScrollY = this.scrollY + dy;
            if (newScrollX < 0)
                newScrollX = 0;
            else if (newScrollY > maxScrollX)
                newScrollX = maxScrollX;

            if (newScrollY < 0)
                newScrollY = 0;
            else if (newScrollY > maxScrollY)
                newScrollY = maxScrollY;

            workarea.scrollLeft(newScrollX);
            workarea.scrollTop(newScrollY);
        }
    }

    mouseUpHandler() {
        if (this.state.mouseOut) {
            this.setState({});
            this.disableTool(false);
        } else {
            $("#wdm-toolbox").on("mouseleave", $.proxy(this.mouseLeaveHandler, this));
            $("#wdm-toolbox").off("mouseleave", $.proxy(this.mouseLeaveDownHandler, this));
            $("#wdm-toolbox").off("mouseenter", $.proxy(this.mouseEnterDownHandler, this));
            $(window as any).off("mouseup", $.proxy(this.mouseUpHandler, this));
            $(window as any).off("mousemove", $.proxy(this.mouseMoveHandler, this));
            this.setState({ mousePressed: false, mouseOut: false });
        }
    }

    disableTool(checkMouse: boolean = true) {
        if (this.props.toolBox && (!checkMouse || !this.state.mousePressed)) {
            this.clearMouseEvents();
            this.props.toolBox.setTool();
        }
    }

    clearMouseEvents() {
        $("#wdm-toolbox").off("mouseleave", $.proxy(this.mouseLeaveHandler, this));
        $("#wdm-toolbox").off("mouseleave", $.proxy(this.mouseLeaveDownHandler, this));
        $("#wdm-toolbox").off("mouseenter", $.proxy(this.mouseEnterDownHandler, this));
        $("#wdm-toolbox").off("mousedown", $.proxy(this.mouseDownHandler, this));
        $(window as any).off("mouseup", $.proxy(this.mouseUpHandler, this));
        $(window as any).off("mousemove", $.proxy(this.mouseMoveHandler, this));
    }

    componentWillUnmount() {
        this.clearMouseEvents();
    }

    render() {
        const style: React.CSSProperties = {
            //cursor: this.state.mousePressed ? "grab" : "auto"
        };
        return <div id="wdm-toolbox" className="wdm-toolbox" style={style}/>;
    }
}