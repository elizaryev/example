import * as React from 'react';
import { Button, Image, Transition } from 'semantic-ui-react';
import { ICanvas } from '../store/Canvas';

interface ICanvasToolboxProps {
    canvases: ICanvas[],
    onChange?(canvas:ICanvas):void
};

export default class CanvasToolbox extends React.Component<ICanvasToolboxProps, {}> {  

    //private handleMouseOver() {

    //}

    //private handleMouseOut() {

    //}

    private onChangeHandler(canvas: ICanvas) {
        this.props.onChange && this.props.onChange(canvas);
    }

    private renderButtons(canvases: ICanvas[]) {
        return canvases.map((canvas, index) => {
            return <Transition animation='scale' duration={300} key={canvas.uid}  >
                <Button basic onClick={() => this.onChangeHandler(canvas)} >
                    <Image src={canvas.iconData} size='mini' />
                </Button>
            </Transition>;
        });
    }

    public render() {

        return <div className='cnv-toolbox'>
                {this.renderButtons(this.props.canvases)}               
            </div>;
    }
}