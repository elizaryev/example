import { inject, observer } from "mobx-react";
import * as React from "react";
import { Button, DropdownItemProps, Grid, Popup, Icon, Image } from "semantic-ui-react";
import * as NumericInput from "react-numeric-input";
import * as _ from 'lodash';
import { ILocalizeStore } from "../../store/Localize";
import { IWITDoc, IWITDocActions } from "../../store/WITDoc";
import { SizeDimension, Units } from "../../store/model/Product";
import {IPageActions} from "../../store/Page";
import EnhancedButton from "../../components/EnhancedButton";
import ChangePriceDialog from "../../components/Price/ChangePriceDialog";
import { DesignSpec } from "../../store/model/DesignSpec";
import { PriceType, IPrice, IPriceActions } from "../../store/model/Price";
import { IProd } from "../../store/model/WDMProduct";
import { DesignSpecUtil } from "../../utils";

interface PriceProps {
    witdoc?: IWITDoc & IWITDocActions,
    designSpec?:DesignSpec,
    onEdit?: (state: PriceComponentState) => void;
    onChangeDesignSpec?: (designSpec?: DesignSpec) => void;
    onApplyPrice?: (price: IPrice) => void;
    price?: PriceType;
    loadMyCartData?: boolean;
}

type PriceComponentProps = PriceProps & ILocalizeStore;

export interface PriceComponentState {
    editMode?: boolean,
    sizeDimension: SizeDimension;
    showNumeric: boolean;
    showSelfOrderQty: boolean;
}

@inject("witdoc", "localize", "designSpec", "price")
@observer
export default class PriceComponent extends React.Component<PriceComponentProps, PriceComponentState> {    

    defaultSizeDimension = new SizeDimension(9, 4.5, Units.Cm, "9cmX4.5cm");
    savedSizeDimension = this.defaultSizeDimension;

    constructor(props: PriceComponentProps) {
        super(props);
        const docSizeDimension = this.props.witdoc!.selectedPage!.sizeDimension || this.defaultSizeDimension;
        this.state = { sizeDimension: docSizeDimension, showNumeric: false };
    }

    onApplyPrice(prodTypeId: string, sizeDimension: string, prodTypeOptns: object, pageCount?: number,
        pageQty?: number, orderQty?: number, price?: IPrice, prod?: IProd, showNumeric?: boolean, showSelfOrderQty?: boolean) {
        if (this.props.designSpec) {
            const page = this.props.witdoc!.selectedPage! as any as IPageActions;
            this.props.designSpec.setValues({
                prodTypeId, sizeDimension, prodTypeOptns, pageCount, prodId: (prod) ? prod.prodId : undefined,
                sideCount: this.props.designSpec.sideCount || 1
            });
            const self = this;
            this.props.designSpec.load(true).then((value) => {
                const sd = value.sizeDimensionModel;
                if (sd) {
                    //page.changeSizeDimension(
                    //    //new SizeDimension(sd.sizeW || 0, sd.sizeH || 0, sd.sizeUmId === "In" ? Units.Inch : Units.Cm, sd.sizeDimension,
                    //    new SizeDimension(sd.sizeW || 0, sd.sizeH || 0, sd.sizeUmId === "In" ? Units.Inch : Units.Cm, sd.sizeDimension,
                    //        sd.bleedMarginPerSide, sd.safeMarginPerSide, sd.sizeWDesign, sd.sizeHDesign));
                    //page.updateSpecLayers(value.designSpecShape!, value.prodTypeSpecGraphics!, value.zoneRemarkGraphic,
                    //    value.proofWatermarkSvgPath, value.proofWatermarkText);
                    DesignSpecUtil.UpdateDocumentSpecInfoBySizeDimension(this.props.witdoc!,
                        new SizeDimension(sd.sizeW || 0,
                            sd.sizeH || 0,
                            sd.sizeUmId === "In" ? Units.Inch : Units.Cm,
                            sd.sizeDimension,
                            sd.bleedMarginPerSide,
                            sd.safeMarginPerSide,
                            sd.sizeWDesign,
                            sd.sizeHDesign),
                        value);
                }

                if (pageQty && orderQty)
                    self.props.designSpec!.setMultiQties(pageQty, orderQty);
                //self.props.designSpec!.setMaterialStockModel(prod!.materialStock);
            });

            if (price) {
                (this.props.price as any as IPriceActions).setPriceValues(price.price, price.optionPrice);
            }
        }

        if (showNumeric)
            this.setState({ showNumeric: showNumeric });
        if (showSelfOrderQty)
            this.setState({ showSelfOrderQty: showSelfOrderQty });
    }

    onSetCheckBoxElements(showNumeric?: boolean, showSelfOrderQty?: boolean, self: any) {
        if (showNumeric != undefined) {
            self.setState({ showNumeric: showNumeric });
        }

        if (showSelfOrderQty != undefined) {
            self.setState({ showSelfOrderQty: showSelfOrderQty });
        }
    }

    render() {
        const { designSpec } = this.props;
        let prodTypeId = "";
        let sizeDimensionId = "";
        let material = "";
        let coverMaterial = "";
        let pageMaterial = "";
        let prodTypeOptnDtlAbbrs:string[] = [];
        let optnMiniGraphicUrl = "";
        let pageCount: number | undefined = 0;
        let sideCount = 0;
        let pageQty: number | undefined = 0;
        let orderQty: number | undefined = 0;
        if (designSpec) {
            if (designSpec.prodTypeModel) {
                prodTypeId = designSpec.prodTypeModel.prodTypeId;
            }
            if (designSpec.sizeDimensionModel) {
                sizeDimensionId = designSpec.sizeDimensionModel.sizeDimension;
            }
            if (designSpec.materialStockModel) {
                material = designSpec.materialStockModel.materialStockAbbr;
            }
            if (designSpec.coverMaterialStockModel) {
                coverMaterial = designSpec.coverMaterialStockModel.materialStockAbbr;
            }
            if (designSpec.pageMaterialStockModel) {
                pageMaterial = designSpec.pageMaterialStockModel.materialStockAbbr;
            }
            if (designSpec.pageQty) {
                pageQty = designSpec.pageQty;
            }
            if (designSpec.orderQty) {
                orderQty = designSpec.orderQty;
            }

            if (designSpec.optnModel && designSpec.optnModel.prodTypeOptnDtl) {
                designSpec.optnModel.prodTypeOptnDtl.forEach((optnDtl, index) => {
                    if (index === 0) {
                        optnMiniGraphicUrl = optnDtl.miniGraphicUrl;
                        optnMiniGraphicUrl = optnMiniGraphicUrl.split("~").join("");
                    }
                    prodTypeOptnDtlAbbrs.push(optnDtl.prodTypeOptnDtlAbbr);
                });
            }
            pageCount = designSpec.pageCount;
            sideCount = designSpec.sideCount;
        }

        const isLoading = (designSpec && designSpec.isLoading);
        const freeStyleDesign = (designSpec && designSpec.freeStyleDesign);

        return <Grid verticalAlign="middle" className="text price-cont">
                   <Grid.Row>
                       {!this.state.editMode &&
                           <Grid.Column>
                    <ChangePriceDialog price={this.props.price} pageCount={pageCount}
                        loadMyCartData={this.props.loadMyCartData}
                        multiPageQty={pageQty.toString()} multiOrderQty={orderQty.toString()}
                        material={material} coverMaterial={coverMaterial} pageMaterial={pageMaterial}
                        prodType={prodTypeId} sizeDimension={sizeDimensionId} prodTypeOptnDtlAbbrs={prodTypeOptnDtlAbbrs}
                        disabled={freeStyleDesign}
                        isLoading={isLoading} sideCount={sideCount} showNumeric={this.state.showNumeric} showSelfOrderQty={this.state.showSelfOrderQty}
                        onSetParentCheckBoxElements={this.onSetCheckBoxElements}
                        parent={this}
                        onApplyPrice={(prodTypeId, sizeDimension, prodTypeOptns, pageCount, pageQty, orderQty, price, prod, showNumeric, showSelfOrderQty) =>
                            this.onApplyPrice(prodTypeId, sizeDimension, prodTypeOptns, pageCount, pageQty, orderQty, price, prod, showNumeric, showSelfOrderQty)} />
                           </Grid.Column>}
                   </Grid.Row>
               </Grid>;
    }
}