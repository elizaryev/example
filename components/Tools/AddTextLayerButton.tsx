import * as React from "react";
import {observer, inject} from "mobx-react";
import { Dropdown, DropdownProps, DropdownItemProps } from "semantic-ui-react";
import { WritingMode, ILocalizeActions } from "../../store";
import { EnumUtil } from "../../utils";
import EnhancedButton from "../EnhancedButton";

interface Props {
    localize?:ILocalizeActions;
    onChange?(writingMode:WritingMode):void;
}

const initialState = {
    writingMode: WritingMode.Horizontal,
    isOpened:false
};
type State = Readonly<typeof initialState>;

@inject("localize")
@observer
export default class AddTextLayerButton extends React.Component<Props, State> {
    state: State = initialState;

    private translate(key: string) {
        const { localize } = this.props;
        if (!localize) return "";
        return localize.translate(key);
    }

    options: DropdownItemProps[] = [
        {
            value: WritingMode.Horizontal,
            content: <EnhancedButton basic compact size="small" ypIcon="YP3_horizontal text"
                                     active={this.state.writingMode === WritingMode.Horizontal}
                                     popup={this.translate("propwin.text.ttlHorizontalText")}
                                     onClick={(e) => this.changeWritingMode(e, WritingMode.Horizontal)} />,
            selected:false
        },
        {
            value: WritingMode.Vertical,
            content: <EnhancedButton basic compact size="small" ypIcon="YP3_vertical text"
                                     active={this.state.writingMode === WritingMode.Vertical}
                                     popup={this.translate("propwin.text.ttlVerticalText")}
                                     onClick={(e) => this.changeWritingMode(e, WritingMode.Vertical)}/>,
            selected: false
        }];

    changeWritingMode(e: React.MouseEvent<HTMLElement> | undefined, writingMode: string) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const wm = EnumUtil.enumByValue<WritingMode>(WritingMode, writingMode) as WritingMode;
        this.setState({ writingMode: wm, isOpened:false });
        if (this.props.onChange) this.props.onChange(wm);
    }

    renderCurrentItem() {
        const button = this.options.find((optn) => optn.value === this.state.writingMode);
        return <div className="cont" onMouseOver={() => this.setState({writingMode:this.state.writingMode, isOpened:true})}
                    onMouseOut={() => this.setState({writingMode:this.state.writingMode, isOpened:false})}>{button ? button.content : null}</div>;
    }

    render() {       
        return <Dropdown compact options={this.options.filter((optn) => optn.value !== this.state.writingMode)}
                         closeOnChange={true}                         
                         open={this.state.isOpened}
                         trigger={this.renderCurrentItem()}
                         className="ddl-anchor"
                         onChange={(event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => this.changeWritingMode(undefined, data.value as string)}
                         onMouseOver={() => this.setState({ writingMode: this.state.writingMode, isOpened: true })}
                         onMouseOut={() => this.setState({ writingMode: this.state.writingMode, isOpened: false })}/>;
    }
}