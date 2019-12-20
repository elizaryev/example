/**
 *
 * This component combines slider and stepper together
 */

import * as React from "react";
import { Grid, Checkbox } from "semantic-ui-react";
import { NumberPicker } from 'react-widgets';
import 'rc-slider/assets/index.css';
import Slider, {SliderProps} from "rc-slider";


//This interface was extracted from react-widgets
interface NumberPickerProps /*extends ReactWidgetsCommonProps<NumberPickerClass>*/ {
    /**
     * The current value of the NumberPicker.
     */
    value?: number;
    /**
     * Default Value.
     */
    defaultValue?: number;
    /**
     * Change event Handler that is called when the value is changed. The handler is called with
     * the current numeric value or null.
     */
    onChange?: (value?: number) => void;
    /**
     * A format string used to display the number value. Localizer dependent, read localization
     * for more info.
     * @see http://jquense.github.io/react-widgets/docs/#i18n
     */
    format?: any;
    /**
     * Determines how the NumberPicker parses a number from the localized string representation.
     * You can also provide a parser Function to pair with a custom format.
     */
    parse?: string[] | ((str: string, culture: string) => number);
    /**
     * The minimum number that the NumberPicker value.
     * @default -Infinity
     */
    min?: number;
    /**
     * The maximum number that the NumberPicker value.
     * @default Infinity
     */
    max?: number;
    /**
     * Amount to increase or decrease value when using the spinner buttons.
     * @default 1
     */
    step?: number;
    /**
     * Specify how precise the value should be when typing, incrementing, or decrementing the
     * value. When empty, precision is parsed from the current format and culture.
     */
    precision?: number;
    /**
     * Object hash containing display text and/or text for screen readers. Use the messages
     * object to localize widget text and increase accessibility.
     */
    //messages?: NumberPickerMessages;
}


interface SlideStepperProps extends NumberPickerProps {
    title?: string;

    /**
     * untis string. Default - "%"
     */
    units?:string;
}

interface SlideStepperState {    
}

export default class SlideStepper extends React.Component<SlideStepperProps>{

    sliderChangeHandler(value: number) {
        console.log('onchange');
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }

    numberPickerChangeHandler(value: number) {
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }

    buildSliderProps() {
        const step = this.props.step || 1;
        const minPropVal = this.props.min === undefined ? 0 : this.props.min;
        const maxPropVal = this.props.max === undefined ? 100 : this.props.max;
        //const minVal = Math.sign(minPropVal) * Math.floor(Math.abs(minPropVal) / step);
        //const maxVal = Math.sign(maxPropVal) * Math.floor(Math.abs(maxPropVal) / step);

        const sliderProps: SliderProps = {
            min: minPropVal,
            max: maxPropVal,
            step: step,
            value: this.props.value,
            onChange: (value) => this.sliderChangeHandler(value)
        };

        return sliderProps;
    }

    render() {

        const units = this.props.units || "%";

        return <div className="slide-step">
            <Slider {...this.buildSliderProps()}/>
            <NumberPicker {...this.props} onChange={(value) => this.numberPickerChangeHandler(value || 0)} />
            <div className="units">{units}</div>
            <div className="ttl">
                    {this.props.title}
                   </div>
               </div>;
    }    
}