import { inject, observer } from "mobx-react";
import * as React from "react";
import {  Grid,   Image } from "semantic-ui-react";
import * as NumericInput from "react-numeric-input";
import * as _ from 'lodash';
import { ILocalizeStore } from "../store/Localize";
import { IWITDoc, IWITDocActions, IWITDocSettingsActions } from "../store";
import { SizeDimension, Units } from "../store/model/Product";
import {IPageActions} from "../store/Page";
import EnhancedButton from "../components/EnhancedButton";
import ChangeProductDialog from "../components/ChangeProductDialog";
import { DesignSpec } from "../store/model/DesignSpec";
import { wdmSettings } from "conf";
import { PriceType, IPriceActions } from "../store/model/Price";
import { ProdModel, IProdModelActions } from "../store/model/WDMProduct";
import { storeActionObserver } from "../store/StoreActionObserver";
import { DesignSpecUtil } from "../utils";

interface DesignSizeProps {
    witdoc?: IWITDoc & IWITDocActions,
    designSpec?:DesignSpec,
    onEdit?: (state: DesignSizeComponentState) => void;
    price?: PriceType;
    prodModel?: ProdModel;
    docSettings?:IWITDocSettingsActions;
}

type DesignSizeComponentProps = DesignSizeProps & ILocalizeStore;

export interface DesignSizeComponentState {
    editMode?: boolean,
    sizeDimension: SizeDimension,
    observerId?: string[];
}

@inject("witdoc", "localize", "designSpec", "price", "prodModel", "docSettings")
@observer
export default class DesignSizeComponent extends React.Component<DesignSizeComponentProps, DesignSizeComponentState> {    
    
    defaultSizeDimension = new SizeDimension(9, 4.5, Units.Cm, "9cmX4.5cm");

    savedSizeDimension = this.defaultSizeDimension;

    constructor(props: DesignSizeComponentProps) {
        super(props);
        const docSizeDimension = this.props.witdoc!.selectedPage!.sizeDimension || this.defaultSizeDimension;
        this.state = { sizeDimension: docSizeDimension, observerId: [] };
    }

    private assignState(state: DesignSizeComponentState) {
        this.setState(_.assign({}, this.state, state));
    }

    widthChangeHandler(value: number | null) {
        const {sizeDimension} = this.state;
        this.assignState({ sizeDimension: new SizeDimension(value || 0, sizeDimension.height, sizeDimension.units) });
    }

    heightChangeHandler(value:number|null) {
        const { sizeDimension } = this.state;
        this.assignState({ sizeDimension: new SizeDimension(sizeDimension.width, value || 0, sizeDimension.units) });
    }

    saveSizeDimension() {
        const { designSpec } = this.props;        
        const { sizeDimension } = this.state;
        //page.changeSizeDimension(new SizeDimension(sizeDimension.width,
        //    sizeDimension.height,
        //    sizeDimension.units,
        //    undefined,
        //    undefined,
        //    undefined,
        //    sizeDimension.width,
        //    sizeDimension.height));
        //page.updateSpecLayers(designSpec!.designSpecShape!, designSpec!.prodTypeSpecGraphics!, designSpec!.zoneRemarkGraphic!,
        //    designSpec!.proofWatermarkSvgPath, designSpec!.proofWatermarkText);
        DesignSpecUtil.UpdateDocumentSpecInfoBySizeDimension(this.props.witdoc!, new SizeDimension(sizeDimension.width,
                sizeDimension.height,
                sizeDimension.units,
                undefined,
                undefined,
                undefined,
                sizeDimension.width,
                sizeDimension.height), designSpec!);
        designSpec!.setFreeStyleDesign(true, {
            width: sizeDimension.width,
            height: sizeDimension.height,
            units: sizeDimension.units
        });
        (this.props.docSettings as any as IWITDocSettingsActions).setShowSpecGraphic(false);
        this.exitEditMode();
    }

    exitEditMode(restore?: boolean) {
        const newState: DesignSizeComponentState = {
            editMode: false,
            sizeDimension: restore ? this.savedSizeDimension : this.state.sizeDimension
        };
        this.assignState(newState);
        if (this.props.onEdit) {
            this.props.onEdit(newState);
        }
    }

    enterEditMode() {
        const docSizeDimension = this.props.witdoc!.selectedPage!.sizeDimension || this.defaultSizeDimension;
        const newState: DesignSizeComponentState = { editMode: true, sizeDimension: docSizeDimension };
        this.assignState(newState);
        this.savedSizeDimension = docSizeDimension;
        if (this.props.onEdit) {
            this.props.onEdit(newState);
        }
    }

    onChangeProduct(prodTypeId: string, sizeDimension: string, prodTypeOptns:object) {
        if (this.props.designSpec) {
            //const page = this.props.witdoc!.selectedPage! as any as IPageActions;
            const self = this;
            this.props.designSpec.setValues({ prodTypeId, sizeDimension, prodTypeOptns, sideCount:this.props.designSpec.sideCount || 1 });
            this.props.designSpec.load(true).then((value) => {
                const sd = value.sizeDimensionModel;
                if (sd) {
                    //page.changeSizeDimension(
                    //    new SizeDimension(sd.sizeW || 0, sd.sizeH || 0, sd.sizeUmId === "In" ? Units.Inch : Units.Cm, sd.sizeDimension,
                    //        sd.bleedMarginPerSide, sd.safeMarginPerSide, sd.sizeWDesign, sd.sizeHDesign));
                    //page.updateSpecLayers(value.designSpecShape!, value.prodTypeSpecGraphics!, value.zoneRemarkGraphic!,
                    //    value.proofWatermarkSvgPath, value.proofWatermarkText);
                    DesignSpecUtil.UpdateDocumentSpecInfoBySizeDimensionModel(this.props.witdoc!, sd, value)
                }
            });

            this.resetLinkedModels();
        }
    }

    componentDidMount() {

        // subscribe to events
        // addCanvas
        let observerId = storeActionObserver.registerStoreAction(this.props.witdoc, "addCanvas", (storeArgs: any, designSpec: any) => {

            const pagesCanvases = this.props.witdoc.pages[0].canvases.length;
            this.props.designSpec!.setSideCount(pagesCanvases);
            this.resetLinkedModels();
        });
        this.setState({ observerId: this.state.observerId!.concat(observerId) });

        // removeCanvas
        observerId = storeActionObserver.registerStoreAction(this.props.witdoc, "removeCanvas", (storeArgs: any, designSpec: any) => {
            const pagesCanvases = this.props.witdoc.pages[0].canvases.length;
            this.props.designSpec!.setSideCount(pagesCanvases);
            this.resetLinkedModels();
        });
        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    private resetLinkedModels() {
        if (this.props.price) {
            (this.props.price as any as IPriceActions).setPriceValues(0, 0);
        }
        if (this.props.prodModel) {
            (this.props.prodModel as any as IProdModelActions).clear();
        }
    }


    componentWillUnmount() {
        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    render() {
        const { sizeDimension } = this.state;
        const docSizeDimension = this.props.witdoc!.selectedPage!.sizeDimension || this.defaultSizeDimension;
        const { trn, translate } = this.props.localize!;
        //return <Dropdown options={this.sizeOptions} defaultValue={0} onChange={(e, props) => this.onSizeChange(props)}/>;
        const { designSpec } = this.props;
        let prodTypeDescription = "";
        let prodTypeId = "";
        let sizeDimensionId = "";
        let sizeDimensionDescription = "";
        let prodTypeOptnDtlAbbrs:string[] = [];
        let optnMiniGraphicUrl = "";
        if (designSpec) {
            if (designSpec.freeStyleDesign) {
                prodTypeDescription = trn("designSize.lblFreeStyleDesign");
                sizeDimensionDescription = this.props.witdoc!.selectedPage!.sizeDimension.toString();
            }else {
                if (designSpec.prodTypeModel) {
                    prodTypeDescription = designSpec.prodTypeModel.description;
                    prodTypeId = designSpec.prodTypeModel.prodTypeId;
                }
                if (designSpec.sizeDimensionModel) {
                    sizeDimensionDescription = designSpec.sizeDimensionModel.description;
                    sizeDimensionId = designSpec.sizeDimensionModel.sizeDimension;
                }
                if (designSpec.optnModel) {
                    designSpec.optnModel.prodTypeOptnDtl.forEach((optnDtl, index) => {
                        if (index === 0) {
                            optnMiniGraphicUrl = optnDtl.miniGraphicUrl;
                            optnMiniGraphicUrl = optnMiniGraphicUrl.split("~").join("");
                        }
                        prodTypeOptnDtlAbbrs.push(optnDtl.prodTypeOptnDtlAbbr);
                    });
                }
            }
        }

        return <Grid verticalAlign="middle" className="large text design-size-cont">
                   <Grid.Row>
                       {wdmSettings.showChangeProdComponent && !this.state.editMode && <Grid.Column width={4} >
                    <ChangeProductDialog prodType={prodTypeId} sizeDimension={sizeDimensionId} prodTypeOptnDtlAbbrs={prodTypeOptnDtlAbbrs}
                        isLoading={designSpec && designSpec.isLoading} sideCount={this.props.witdoc!.pages[0].canvases!.length}
                        onChangeProduct={(prodTypeId, sizeDimension, prodTypeOptns) => this.onChangeProduct(prodTypeId, sizeDimension, prodTypeOptns)}/>
                </Grid.Column>}
                       {this.state.editMode && <Grid.Column textAlign="right" width={2}>{trn("designSize.ttlSize")}</Grid.Column>}
                       {!this.state.editMode &&
                                    <Grid.Column width={wdmSettings.showChangeProdComponent ? 12 : 14} className="design-size-ctl">
                                    <div className="inline">{prodTypeDescription}</div>
                                    <div className="inline-spacer"/>
                                    {sizeDimensionDescription}
                                    <div className="inline-spacer" />
                                    {optnMiniGraphicUrl && <Image inline src={optnMiniGraphicUrl} />}
                                    <div className="div-chsize">
                                        {translate("designSize.lblChangeSize")}
                        <EnhancedButton basic compact ypIcon="YP2_edit" size="mini" 
                                                        loading={designSpec && designSpec.isLoading}
                                                        disabled={designSpec && designSpec.isLoading}
                                                        className="wdm-style-4 no-border btn-edit"
                                                        popup={translate("designSize.ttlBtnEditSize")}
                                                        onClick={() => this.enterEditMode()} />
                                    </div>
                                </Grid.Column>}
                       {this.state.editMode && <Grid.Column width={10} className="wdm-size-input">                        
                            <NumericInput min={0.1} max={100} step={0.1} precision={1} value={sizeDimension.width} snap                                
                                    onChange={(value) => this.widthChangeHandler(value)} /> {sizeDimension.units}
                                <NumericInput min={0.1} max={100} step={0.1} precision={1} value={sizeDimension.height} snap
                                    onChange={(value) => this.heightChangeHandler(value)} /> {sizeDimension.units}
                            </Grid.Column>}
                       {this.state.editMode && <Grid.Column width={4} verticalAlign="middle">
                                <EnhancedButton basic compact icon="save" size="mini"
                                                popup={translate("designSize.ttlBtnSave")}
                                                onClick={() => this.saveSizeDimension()} >
                                </EnhancedButton> 
                                <EnhancedButton basic compact icon="cancel" size="mini"
                                                popup={translate("designSize.ttlBtnCancel")}
                                                onClick={() => this.exitEditMode(true)} >
                                </EnhancedButton> 
                             </Grid.Column>}
                   </Grid.Row>
               </Grid>;
    }
}