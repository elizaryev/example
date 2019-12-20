import * as React from 'react';
import { Transition, Grid, Button, Form, InputOnChangeData } from 'semantic-ui-react';
import { ILayer, Layer } from '../store/Layer';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';
import { ILayerModifier, ILayerModifierActions, LayerModifierTypes } from '../store/LayerModifier';
import { observer, inject } from 'mobx-react';
import { NumberPicker } from 'react-widgets';
import { TwitterPicker, CustomPicker } from 'react-color';
import { ILocalizeStore, ILocalizeActions } from '../store/Localize';
import { ITransformSelection } from '../store/TransformSelection';
import { TransformTypes } from '../constants'
import ScreenUtil from '../utils/ScreenUtil';
import '../css/ColorPicker.less';
import * as $ from 'jquery';


var numberLocalizer = require('react-widgets-simple-number') as Function;
numberLocalizer();

interface CroppingWindowProps {
    //layer:ILayer
    witdoc?: IWITDoc,
    docSettings?: IWITDocSettings
}

//@inject('witdoc', 'localize', 'docSettings')
@inject((allStores:any) => ({
    witdoc: allStores.witdoc as IWITDoc,
    localize: allStores.localize as ILocalizeActions,
    docSettings: allStores.docSettings as IWITDocSettings
}))
@observer
export default class CroppingWindow extends React.Component<CroppingWindowProps & ILocalizeStore, any> {

    private btnOKClickHandler() {
        // Apply changes
        //this.props.layer
        (this.props.witdoc!.layerModifier as ILayerModifierActions).acceptModifying('div.wit-cropping>.content>img',
            'div.wit-custom-sel', this.props.docSettings!.zoom);
    }

    private btnCancelClickHandler() {
        (this.props.witdoc!.layerModifier as ILayerModifierActions).cancelModifying();
    }

    public render() {
        const { translate } = this.props.localize!;
        return <Transition animation='slide up' duration={200}
            visible={this.props.witdoc!.layerModifier!.isModifying && this.props.witdoc!.layerModifier!.action == LayerModifierTypes.CROP}
                mountOnShow={true} unmountOnHide={true}>
            <div className='wit-propwin'>
                <Grid >
                    <Grid.Column mobile={8} tablet={4} computer={2} >
                        <Button icon="checkmark" onClick={() => this.btnOKClickHandler()} />
                        <Button icon="remove" onClick={() => this.btnCancelClickHandler()}/>
                    </Grid.Column>
                </Grid>
            </div >
        </Transition>;
    }
}
