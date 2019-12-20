import { inject, observer } from "mobx-react";
import * as React from "react";
import { Button, Grid, Icon } from "semantic-ui-react";
import * as _ from 'lodash';
import { ILocalizeActions } from "../store/Localize";
import { DesignSpec } from "../store/model/DesignSpec";
import "../css/DesignInfoWindow.less";
import { PriceType, IPriceActions } from "../store/model/Price";
import { prodTypeModel, IProdType } from "../store/model/WDMProduct";

interface DesignInfoWindowProps {
    localize?:ILocalizeActions,
    /*sideCount?:number,
    printQty?:number,
    sizeDimension?:string,
    material?:string,
    option?:string*/
    designSpec?: DesignSpec,
    price?: PriceType;
}

interface DesignInfoWindowState {
    isFolded?:boolean;
}

@inject("witdoc", "localize", "designSpec", "price")
@observer
export default class DesignInfoWindow extends React.Component<DesignInfoWindowProps, DesignInfoWindowState> {    

    constructor(props: DesignInfoWindowProps) {
        super(props);
        this.state = { isFolded:false };
    }

    render() {
        const { translate, trn } = this.props.localize!;
        const { designSpec } = this.props;
        const freeStyleDesign = designSpec && designSpec.freeStyleDesign;
        //if (!designSpec) return;

        const sideCount = designSpec ? designSpec.sideCount : 0;
        const pageCount = designSpec ? designSpec.pageCount : 0;
        const sizeDimensionDescription = designSpec && designSpec.sizeDimensionModel ? designSpec.sizeDimensionModel.description : "";
        const materialDescription = designSpec && designSpec.materialStockModel ? designSpec.materialStockModel.description : "";
        let optionDescription = "";
        if (designSpec && designSpec.prodTypeOptns) {
            var optnToFind = "";
            var valueToFind = "";
            for (let key in designSpec.prodTypeOptns) {
                optnToFind = key;
                valueToFind = designSpec.prodTypeOptns[key];
            }
            if (optnToFind && valueToFind && designSpec.optnModel) {
                optnToFind = designSpec.optnModel.description;
                valueToFind = designSpec ? designSpec.optnModel.prodTypeOptnDtl[0].description : "";
                optionDescription = optnToFind + " : " + valueToFind;
            }
        }

        const pageQty = designSpec ? designSpec.pageQty : 0;
        const orderQty = designSpec ? designSpec.orderQty : 0;
        const coverMaterialDescription = designSpec && designSpec.coverMaterialStockModel ? designSpec.coverMaterialStockModel.description : "";
        const pageMaterialDescription = designSpec && designSpec.pageMaterialStockModel ? designSpec.pageMaterialStockModel.description : "";
        let multiPageFlg: boolean | string | undefined = undefined;
        const prodType = prodTypeModel.prodTypes.find((f: IProdType) => f.prodTypeId === designSpec.prodTypeId);
        if (prodType) {
            multiPageFlg = prodType.multiPageFlg && prodType.multiPageFlg === "Yes";
        }

        let componentClassName = "wdm-design-info";
        let iconClass = "icon-YP2_arrow down";
        if (this.state.isFolded) {
            componentClassName += " folded";
        }

        const price = this.props.price!.price;
        const totalPrice = (this.props.price) ? (this.props.price as any as IPriceActions).getTotalPrice() : 0;

        return <div className={componentClassName}>
                   <div className="ctls">
                       <div>{translate("designInfo.lblPrice")}</div>
                       <div className="lbl-price">{freeStyleDesign ? "???" : `$ ${totalPrice}`}</div>
                        {!freeStyleDesign && <Button circular icon onClick={() => this.setState({isFolded:!this.state.isFolded})}>
                           <Icon flipped={this.state.isFolded ? "vertically" : undefined} className={iconClass}/>
                       </Button>}
                       <div className="border"/>
                   </div>
                   {this.state.isFolded &&
                        <Grid verticalAlign="middle" className="wdm-design-info-grid">
                            <Grid.Row>
                                <Grid.Column width={1}/>
                                <Grid.Column width={3}>
                                    {translate("designInfo.lblSides")}
                                    {translate(sideCount ? (sideCount === 2 ? "designInfo.lblDoubleSide" : "designInfo.lblSingleSide") : "designInfo.lblSingleSide")}
                                </Grid.Column>
                                <Grid.Column width={3}>
                                    {translate("designInfo.lblSize")}
                                    {sizeDimensionDescription || "-"}
                                </Grid.Column>
                                <Grid.Column width={4}>
                                    {translate("designInfo.lblOption")}
                                    {optionDescription || "-"}
                                </Grid.Column>
                            </Grid.Row>
                        {!multiPageFlg
                            ?
                            <Grid.Row>
                                <Grid.Column width={1}/>
                                 <Grid.Column width={3}>
                                    {translate("designInfo.lblPrintQty")}
                                    {pageCount || "-"}
                                </Grid.Column> 
                                <Grid.Column width={3}>
                                    {translate("designInfo.lblMaterial")}
                                    {materialDescription || "-"}
                                </Grid.Column>
                            </Grid.Row>
                            : <Grid.Row>
                                  <Grid.Column width={1} />
                                  <Grid.Column width={3}>
                                      {translate("designInfo.lblPageQty")}
                                      {pageQty || "-"}
                                  </Grid.Column> 
                                  <Grid.Column width={3}>
                                      {translate("designInfo.lblOrderQty")}
                                      {orderQty || "-"}
                                  </Grid.Column> 
                                  <Grid.Column width={4}>
                                      {translate("designInfo.lblCoverMaterial")}
                                      {coverMaterialDescription || "-"}
                                   </Grid.Column> 
                                  <Grid.Column width={3}>
                                      {translate("designInfo.lblPageMaterial")}
                                      {pageMaterialDescription || "-"}
                                  </Grid.Column> 
                              </Grid.Row>}
                        </Grid>}
               </div>;
    }
}