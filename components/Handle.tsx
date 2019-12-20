import * as React from "react";
import * as $ from "jquery";
import { CursorUtil, CursorPosition } from "../utils/CursorUtil";
import {
    DragSource,
    ConnectDragSource,
    ConnectDragPreview,
    DragSourceSpec,
    DragSourceConnector,
    DragSourceMonitor,
    ClientOffset
} from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

let draggingCursorClass = "";

let nodeSourceSpec: DragSourceSpec<Props> = {
    beginDrag: (props: Props) => {
        draggingCursorClass = "dragging-" + CursorUtil.getBiDirectionalResizeCursorClass(
            props.cursorPosition || CursorPosition.TopLeft,
            props.rotationRad);
        $("body").addClass(draggingCursorClass);
        return {};
    },
    endDrag:(props: Props) => {
        $("body").removeClass(draggingCursorClass);
    }
};

// Collect: Put drag state into props
let nodeSourceCollector = (connect: DragSourceConnector, monitor: DragSourceMonitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        offset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }
};

interface Props {
    cursorPosition?: CursorPosition,
    rotationRad?:number
}

export interface LayerSourceProps {    
    connectDragSource: ConnectDragSource,
    connectDragPreview: ConnectDragPreview,
    offset: ClientOffset,
    isDragging: boolean
}

class Handle extends React.Component<Props & LayerSourceProps> {

    componentDidMount() {
        this.props.connectDragPreview(getEmptyImage(), {
            // IE fallback: specify that we'd rather screenshot the node
            // when it already knows it's being dragged so we can hide it with CSS.
            captureDraggingState: true,
        });
    }

    render() {
        const cursorPosition = this.props.cursorPosition || CursorPosition.TopLeft;

        return this.props.connectDragSource(<a className={`hdl ${cursorPosition.toString()}`}
                  style={{
                      cursor: CursorUtil.getBiDirectionalResizeCursorClass(
                          this.props.cursorPosition || CursorPosition.TopLeft,
                          this.props.rotationRad)
                  }}>
                   <div/></a>);
    }
}

export default DragSource('handle', nodeSourceSpec, nodeSourceCollector)(Handle) as any;