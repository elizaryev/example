import * as React from 'react';
import { observer, inject } from "mobx-react";
import { Checkbox, List, Input, CheckboxProps, InputOnChangeData, Popup } from "semantic-ui-react";
import { ILocalizeActions } from '../store/Localize';
import EnhancedButton from "../components/EnhancedButton";

interface IIFreeStyleOptionsStateProps {
    localize?: ILocalizeActions;
    disabled?: boolean;

    heightInputVal?: string;
    widthInputVal?: string;
    freeStyleVal?: boolean;

    showFreeStyle?: boolean;
    showRePopulateBtn?: boolean;

    onFreeStyleClick?(e: any, data: CheckboxProps): void;
    changeHeightHandler?(event: any, data: InputOnChangeData): void;
    changeWidthHandler?(event: any, data: InputOnChangeData): void;
    repopulateClick?(): void;
}

interface IFreeStyleOptionsState {
    loading: boolean;
    disabledInput: boolean;
    heightInput: string;
    widthInput: string;
    freeStyleVal: boolean;
    firstInitialization: boolean;
    errInputWidth: boolean;
    errInputHeight: boolean;
    showPopupSizeFormatInfo: boolean;
}

@inject("localize", )
@observer
export class FreeStyleOptions extends React.Component<IIFreeStyleOptionsStateProps, IFreeStyleOptionsState> {

    constructor(props: IIFreeStyleOptionsStateProps) {
        super(props);
        this.state = {
            loading: true,
            disabledInput: false,
            heightInput: "0",
            widthInput: "0",
            freeStyleVal: false,
            firstInitialization: false,
            errInputWidth: false,
            errInputHeight: false,
            showPopupSizeFormatInfo: false
        };
    }

    private _isMounted = false;
    private decimalRegexp = /^\d+(\.\d{0,4})?$/;

    componentWillMount() {
        this.setState({
            widthInput: this.props.widthInputVal!,
            heightInput: this.props.heightInputVal!,
            freeStyleVal: this.props.freeStyleVal!
        });
    }

    componentDidMount() {
        this._isMounted = true;

    }

    public componentWillUnmount() {
        this._isMounted = false;
    }

    public componentWillReceiveProps(nextProps: any, nextState: any) {
        
        if ((nextProps && this.props) && 
        (nextProps.widthInputVal !== this.props.widthInputVal ||
            nextProps.heightInputVal !== this.props.heightInputVal ||
            nextProps.freeStyleVal !== this.props.freeStyleVal)) {

            // set without updating
            this._isMounted &&
                this.setState({
                    firstInitialization: true,
                    widthInput: nextProps.widthInputVal,
                    heightInput: nextProps.heightInputVal,
                    freeStyleVal: nextProps.freeStyleVal
                });
        }
    }

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    onFreeStyleClick = (e: any, data: CheckboxProps) => {
        if (!data.checked) {
            this.setState({ heightInput: "0", widthInput: "0" });
        }

        this._isMounted && this.setState({ disabledInput: !data.checked, freeStyleVal: !data.checked ? false : data.checked });

        if (this.props.onFreeStyleClick)
            this.props.onFreeStyleClick(e, data);
    }

    private changeHeightHandler(event: any, data: InputOnChangeData) {
        
        if (data.value !== "" && !this.decimalRegexp.test(data.value)) {
            this._isMounted && this.setState({ errInputHeight: true });
            return;
        }

        this._isMounted && this.setState({ heightInput: data.value, errInputHeight: false });
        if (this.props.changeHeightHandler)
            this.props.changeHeightHandler(event, data);
    }

    private changeWidthHandler(event: any, data: InputOnChangeData) {

        if (data.value !== "" && !this.decimalRegexp.test(data.value)) {
            this._isMounted && this.setState({ errInputWidth: true });
            return;
        }

        this._isMounted && this.setState({ widthInput: data.value, errInputWidth: false });

        if (this.props.changeWidthHandler)
            this.props.changeWidthHandler(event, data);
    }

    private repopulateClick() {
        if (this.props.repopulateClick)
            this.props.repopulateClick();
    }

    onMouseLeavePopup = () => {
        this._isMounted
            && this.setState({
                showPopupSizeFormatInfo: false,
                widthInput: this.state.widthInput === "" ? "0" : this.state.widthInput,
                heightInput: this.state.heightInput === "" ? "0" : this.state.heightInput,
                errInputWidth: false,
                errInputHeight: false
            });
    }

    onMouseMovePopup = () => {
        if (this._isMounted)
            this.setState({ showPopupSizeFormatInfo: true });
    }

    render() {

        return <div>
                   <Popup basic open={this.state.showPopupSizeFormatInfo}
                          hoverable={false}
                          position="top center">
                       <Popup.Content>
                               {this.translate("TilePublishedDesigns.ShowPopupSizeFormatInfoText").toString()}
                       </Popup.Content>
                   </Popup>

                   <List horizontal className="free-style-container">
                        {this.props.showFreeStyle 
                            ?<List.Item className="fs-elemnt">
                                   <Checkbox checked={this.state.freeStyleVal}
                                             disabled={this.props.disabled}
                                             className="free-style" label={this.translate('TileSavedDesigns.FreeStyleCheckboxTitle').toString()}
                                             onChange={(e, data) => this.onFreeStyleClick(e, data)}></Checkbox>
                            </List.Item>
                            :""}
                       <List.Item className="input-elemnt">
                           {this.translate('TileSavedDesigns.HeightTitle').toString()}
                           <Input type="text" size="mini" className="fs-height"
                                  error={this.state.errInputHeight}
                                  onMouseLeave={() => this.onMouseLeavePopup()}
                                  onMouseMove={() => this.onMouseMovePopup()}
                                  disabled={this.state.disabledInput || !this.state.freeStyleVal || this.props.disabled}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) => this.changeHeightHandler(event, data)}
                                  value={this.state.heightInput ? this.state.heightInput : "0"}>
                           </Input>
                       </List.Item>
                       <List.Item className="input-elemnt">
                           {this.translate('TileSavedDesigns.WidthTitle').toString()}
                           <Input type="text" size="mini" className="fs-width"
                                  error={this.state.errInputWidth}
                                  onMouseLeave={() => this.onMouseLeavePopup()}
                                  onMouseMove={() => this.onMouseMovePopup()}
                                  disabled={this.state.disabledInput || !this.state.freeStyleVal || this.props.disabled}
                                  onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) => this.changeWidthHandler(event, data)}
                                  value={this.state.widthInput ? this.state.widthInput : "0"}>
                           </Input>
                       </List.Item>
                        {this.props.showRePopulateBtn 
                            ?<List.Item className="btn-elemnt">
                                   <EnhancedButton basic ypIcon="icon-YP3_reload" className="wdm-style-1 wdm-btn-simple with-border no-border"
                                                    size="large" disabled={this.props.disabled}
                                                    labelPosition="left"
                                                    onClick={() => this.repopulateClick()}>
                                        {this.translate("TilePublishedDesigns.RePopulateTitleBtn").toString()}
                                   </EnhancedButton>
                            </List.Item>
                            : ""}
                   </List>
        </div>;
    }
}
