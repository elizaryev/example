import { Component } from "react";
import { ColorPickerProps, Color } from "react-color";

export interface TwitterPickerProps extends ColorPickerProps<WdmColorPicker> {
    colors?: string[];
    width?: string;
    triangle?: 'hide' | 'top-left' | 'top-right';
    onSwatchHover?(color: Color, event: MouseEvent): void;
}

export default class WdmColorPicker extends Component<TwitterPickerProps> { }
