import * as React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Modal, DropdownItemProps, Header, Radio,
    Loader, Form, Message, Image
} from 'semantic-ui-react';
import "../css/ChangeProductDialog.less";
import { ILocalizeActions } from "../store/Localize";
import * as _ from 'lodash';
import * as $ from "jquery";
import * as Logger from "js-logger";
import { ILayer, ILayerActions } from "../store/Layer";
import {IMyCloudSaverActions, IMyCloudSaver, MyCloudObjectType, myCloudSaver as myCloudSaver1 } from "../store/MyCloudSaver";
import {IWITDocSerializeable, IWITDoc} from "../store/WITDoc";
import {EnumUtil} from "../utils/EnumUtil";
import { GalleryDrawingMode } from "../containers/Gallery/Gallery";
import GalleryBox from "../containers/Gallery/GalleryBox";
import GalleryView from "../components/Gallery/GalleryView";
import {IGalleryItem, IGallery, GalleryItemType, IGalleryActions, IGalleryContainerActions, IGalleryItemActions,
    IGalleryModel
} from "../store/Gallery/Gallery";
import { IRenderSize } from '../store/model/RenderFormat';
import { Rectangle } from '../store/model';
import EnhancedButton from "./EnhancedButton";


import { prodTypeModel, ILoadable, IProdType, ISizeDimensionModel, IProdTypeOptn, IProdTypeOptnDtl } from "../store/model/WDMProduct";

interface ChangeProductDialogProps {
    localize?:ILocalizeActions,
    prodType?:string,
    sizeDimension?:string,
    prodTypeOptnDtlAbbrs?: string[],
    onChangeProduct?: (prodType: string, sizeDimension: string, prodTypeOptns: object) => void,
    isLoading?: boolean,
    sideCount?:number
}

interface ChangeProductDialogState {
    showDialog?: boolean,
    errorMessage?:string,
    prodType?:string,
    sizeDimension?:string,
    prodTypeOptnDtlAbbrs?: string[],
    initDialog?: boolean,
}

@inject("localize")
@observer
export default class ChangeProductDialog extends React.Component<ChangeProductDialogProps, ChangeProductDialogState> {

    constructor(props: ChangeProductDialogProps) {
        super(props);

        this.state = {
            
        };

    }

    sides:DropdownItemProps[] = [];

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: ChangeProductDialogState) {
        if (!newState.errorMessage) newState.errorMessage = "";
        this.setState(_.assign({}, this.state, newState));        
    }

    private renderTriggerButton(isBtnDisabled:boolean) {
        const { translate } = this.props.localize!;
        return <EnhancedButton basic className="wdm-btn-simple padded wdm-style-5"
                               size="large" disabled={isBtnDisabled || this.props.isLoading}
                               loading={this.props.isLoading}
                               popup={translate('ttlBtnChangeProd')}
                               onClick={(e) => this.openDialogHandler(true)}>
                   {translate("lblBtnChangeProd")}
               </EnhancedButton>;
    }

    private openDialogHandler(isOpen:boolean) {
        if (isOpen) {
            const self = this;
            this.setState({
                showDialog: true,
                prodType: this.props.prodType,
                sizeDimension: this.props.sizeDimension,
                prodTypeOptnDtlAbbrs: this.props.prodTypeOptnDtlAbbrs,
                initDialog:(Boolean(this.props.prodType) && Boolean(this.props.sizeDimension))
            });

            //const { prodTypeModel } = this.props;ord

            if (prodTypeModel)
                prodTypeModel.load().then(() => {
                    if (prodTypeModel.prodTypes && prodTypeModel.prodTypes.length > 0) {
                        const currentProdType =
                            this.state.initDialog
                                ? this.state.prodType
                                : prodTypeModel.prodTypes[0].prodTypeId;
                        self.prodTypeIdChangeHandler({ value: currentProdType });
                    }                    
                }).catch((err) => self.handleError(err));;
        } else {
            this.setState({ showDialog: false, initDialog:false });
        }
    }

    private btnChangeProductClickHandler() {
        if (this.props.onChangeProduct) {

            const currentSizeDimension = this.getSizeDimension(this.state.prodType, this.state.sizeDimension);
            if (currentSizeDimension) {
                let optns: any = {};
                if (currentSizeDimension.options) {
                    currentSizeDimension.options.forEach((optn) => {
                        optn.prodTypeOptnDtl.forEach((optnDtl) => {
                            if (this.state.prodTypeOptnDtlAbbrs &&
                                this.state.prodTypeOptnDtlAbbrs.indexOf(optnDtl.prodTypeOptnDtlAbbr) >= 0)
                                optns[optn.prodTypeOptnId] = optnDtl.prodTypeOptnDtlAbbr;
                        });
                    });
                }

                this.props.onChangeProduct(this.state.prodType || "",
                    this.state.sizeDimension || "", optns);
            }
        }
        this.openDialogHandler(false);
    }

    private prodTypeIdChangeHandler(result:any) {
        const prodTypeValue = this.getProdType(result.value) as IProdType;
        const self = this;
        //const value = result.value as (ILoadable & IProdType);
        if (prodTypeValue) {
            this.assignState({prodType: prodTypeValue.prodTypeId});
            prodTypeValue.load().then(() => {
                if (prodTypeValue.sizeDimensions && prodTypeValue.sizeDimensions.length > 0) {
                    const currentSizeDimension =
                        this.state.initDialog
                            ? this.state.sizeDimension
                            : prodTypeValue.sizeDimensions[0].sizeDimension;
                    self.sizeDimensionChangeHandler({ value: currentSizeDimension });
                }
            }).catch((err) => self.handleError(err));
        }
    }

    private handleError(err: any) {
        this.assignState({
            errorMessage: err.message,
            initDialog: false
        });
    }

    private sizeDimensionChangeHandler(result: any) {
        const sizeDimensionValue = this.getSizeDimension(this.state.prodType, result.value) as ISizeDimensionModel;
        const self = this;
        if (sizeDimensionValue) {
            this.assignState({
                sizeDimension: sizeDimensionValue.sizeDimension,
                prodTypeOptnDtlAbbrs: this.state.initDialog ? this.state.prodTypeOptnDtlAbbrs : undefined
        });
            (sizeDimensionValue as any as ILoadable).load(false, this.state.prodType).then(() => {
                if (sizeDimensionValue.options) {
                    if (!this.state.initDialog) {
                        // Select first available entry (no option)
                        self.optnChangeHandler("0;");
                    }
                }
                this.assignState({initDialog:false});
            }).catch((err) => self.handleError(err));;
        }
    }

    private optnChangeHandler(value: any) {
        //Value is delimited by semicolon
        const optnDtlValueArr = value.split(";");
        const optnDtlValue = optnDtlValueArr[1];
        const optnIndex = +optnDtlValueArr[0];
        if (!isNaN(optnIndex)) {
            const optnDtls = this.getCurrentOptnDtls();
            optnDtls[optnIndex] = optnDtlValue;
            this.assignState({ prodTypeOptnDtlAbbrs:optnDtls });            
        }
    }

    private getCurrentOptnDtls() {
        if (this.state.prodTypeOptnDtlAbbrs) {
            return this.state.prodTypeOptnDtlAbbrs.slice();
        }

        //Return empty options
        const sd = this.getSizeDimension(this.state.prodType, this.state.sizeDimension);
        if (sd)
            return sd.options.map((optn) => "");

        return [];
    }

    private getProdType(prodTypeId?: string) {
        if (!prodTypeId) return undefined;

        return prodTypeModel.prodTypes.find((pt) => pt.prodTypeId === prodTypeId);
    }

    private getSizeDimension(prodTypeId?: string, sizeDimension?: string) {


        if (!prodTypeId || !sizeDimension) return undefined;
        const currentProdType = this.getProdType(prodTypeId);
        if (currentProdType) {
            return currentProdType.sizeDimensions.find((sd) => sd.sizeDimension === sizeDimension);
        }
        return undefined;
    }

    private getOptnDtlsData(dtls: IProdTypeOptnDtl[], optnIndex:number) {
        const { trn } = this.props.localize!;

        let currentOptnDtlValue = optnIndex + ";";

        const currentOptnDtls = this.getCurrentOptnDtls();

        //Add empty "none" option
        const optnDtls: DropdownItemProps[] = [
            {
                text: trn("dlgChangeProduct.lblOptnNone"),
                value: currentOptnDtlValue,
                selected: currentOptnDtls[optnIndex] === ""
            }];
            //<Form.Radio key={0} label={trn("dlgChangeProduct.lblOptnNone")}
                        //value={currentOptnDtlValue} name={"opt" + optnIndex}
                        //={currentOptnDtls[optnIndex] === ""}
                        //onChange={(e, { value }) => this.optnChangeHandler(value)}/>

        return optnDtls.concat(dtls.map((optnDtl, index) => {
            //return <Form.Radio key={index + 1} label={optnDtl.description}
            //                   name={"opt" + optnIndex}
            //                   value={optnIndex + ";" + optnDtl.prodTypeOptnDtlAbbr}
            //                   checked={currentOptnDtls[optnIndex] === optnDtl.prodTypeOptnDtlAbbr}
            //                   onChange={(e, { value }) => this.optnChangeHandler(value)}/>;
            return {
                text:optnDtl.description,
                value: optnIndex + ";" + optnDtl.prodTypeOptnDtlAbbr,
                selected: currentOptnDtls[optnIndex] === optnDtl.prodTypeOptnDtlAbbr
            }
        }));
    }

    componentWillMount() {
        const { trn } = this.props.localize!;
        if (trn) {
            this.sides = [
                { key: 0, text: trn("dlgChangeProduct.lblSingleSide"), value: 1 },
                { key: 1, text: trn("dlgChangeProduct.lblDoubleSide"), value: 2 }
            ];
        }
    }

    render() {
        const { trn, translate } = this.props.localize!;
        //const { prodTypeModel } = this.props;


        const currentProdType = this.getProdType(this.state.prodType);
        const currentSizeDimension = this.getSizeDimension(this.state.prodType, this.state.sizeDimension);

        const prodTypes = prodTypeModel.prodTypes ? prodTypeModel.prodTypes.map((pt, index) => {
            return {
               key:index,
               text:pt.description,
               value:pt.prodTypeId
            }
        }) : [];

        let sizeDimensions = [];

        if (this.state.prodType) {
            const pt = this.getProdType(this.state.prodType);
            if (pt) {
                const sd = pt.sizeDimensions;
                if (sd) {
                    sizeDimensions = sd.map((sd, index) => {
                        return {
                            key: index,
                            text: sd.description,
                            value: sd.sizeDimension
                        }
                    });
                }
            }
        }

        const isSizeDimensionLoading = prodTypeModel.isLoading || 
            (currentProdType && currentProdType.isLoading);

        const isOptionsLoading = isSizeDimensionLoading ||
            (currentSizeDimension && currentSizeDimension.isLoading) || this.state.initDialog;

        const prodTypeOptns = currentSizeDimension ? (currentSizeDimension.options || []) : [];

        const isLoading = prodTypeModel.isLoading || isSizeDimensionLoading || isOptionsLoading || this.state.initDialog;
        const isSpecInfoDefined = this.state.prodType && this.state.sizeDimension;
        const currentOptnDtls = this.getCurrentOptnDtls();

        return <Modal id="change-prod-dlg" trigger={this.renderTriggerButton(isLoading)} size="small" open={this.state.showDialog}
                      closeOnDimmerClick={true} closeIcon={true}
                      className="wdm"
                      onClose={(e) => this.openDialogHandler(false)}>
                   <Modal.Header>{translate("dlgChangeProduct.title")}</Modal.Header>
                   <Modal.Content>
                       <Form size="mini" error={this.state.errorMessage !== undefined && this.state.errorMessage !== ""}>     
                           <Form.Group>
                               <div className="inline four wide field ttl"><div className="marker" />{trn("dlgChangeProduct.lblProdType")}</div>
                               <Form.Select selection inline
                                            width={8} className="ddl-prod-type ctls"
                                            options={prodTypes}
                                            loading={isLoading}
                                            disabled={isLoading}
                                            value={this.state.prodType}
                                            onChange={(e, data) => this.prodTypeIdChangeHandler(data)} />
                               {currentProdType && currentProdType.graphicFile && <div className="img-cont">
                            <div className="inline field img-parent">
                            <Image inline src={currentProdType.graphicFile} className="img-thumb" />
                            </div>
                        </div>}
                           </Form.Group>
                           <Form.Group>
                               <div className="inline four wide field ttl"><div className="marker" />{trn("dlgChangeProduct.lblSpecInfo")}</div>
                               <Form.Select label={trn("dlgChangeProduct.lblSizeDimension")}
                                            width={8} className="ctls"
                                            options={sizeDimensions}
                                            loading={isLoading}
                                            disabled={isLoading}
                                            value={this.state.sizeDimension}
                                            onChange={(e, data) => this.sizeDimensionChangeHandler(data)} />
                           </Form.Group>
                           <Form.Group>
                               <div className="inline four wide field ttl"></div>
                               <Form.Select label={trn("dlgChangeProduct.lblSides")}
                                            width={8} className="ctls"
                                            options={this.sides}
                                            loading={isLoading}
                                            disabled={true}
                                            value={this.props.sideCount || 2} />
                           </Form.Group>
                    <div className="h-delimiter" />
                    {prodTypeOptns.length === 0 && <Form.Group key={-1} disabled={isLoading} className="optn-dtls">
                                                   <div className="inline four wide field ttl">
                                                       {<div className="marker" />}
                                                       {trn("dlgChangeProduct.lblOptions")}
                                                   </div>
                                                   {!isOptionsLoading && translate("dlgChangeProduct.lblNoOptions")}
                                                    {isOptionsLoading && <Loader size="mini" active inline />}
                                                    </Form.Group>}
                           {prodTypeOptns.length > 0 && prodTypeOptns.map((optn, index) => {
                                    const currentOptnDtl = optn.prodTypeOptnDtl ? optn.prodTypeOptnDtl.find((val) => currentOptnDtls.indexOf(val.prodTypeOptnDtlAbbr) >= 0) : "";
                                    let imageSourceUrl = currentOptnDtl ? currentOptnDtl.miniGraphicUrl : "";
                                    if(imageSourceUrl) imageSourceUrl = imageSourceUrl.split("~").join("");
                                   return <Form.Group key={index} disabled={isLoading} className="optn-dtls">
                                       <div className="inline four wide field ttl">
                                           {index === 0 && <div className="marker" />}
                                           {index === 0 && trn("dlgChangeProduct.lblOptions")}
                                       </div>
                                      {index === 0 && !isOptionsLoading && prodTypeOptns.length === 0 && translate("dlgChangeProduct.lblNoOptions")}
                                      {index === 0 && isOptionsLoading && <Loader size="mini" active inline />}
                                       <Form.Select selection inline
                                                           label={optn.description}
                                                           width={8} className="ctls"
                                                           options={this.getOptnDtlsData(optn.prodTypeOptnDtl, index)}
                                                           loading={isLoading}
                                                           disabled={isLoading}
                                                           value={this.state.prodTypeOptnDtlAbbrs && (index + ";" + this.state.prodTypeOptnDtlAbbrs[index])}
                                                           onChange={(e, data) => this.optnChangeHandler(data.value)} />
                                       {currentOptnDtls.length > 0 &&
                                           <div className="img-cont">
                                            <Image inline src={imageSourceUrl} />
                                           </div>}
                                          </Form.Group>;
                               })                                
                    }  
                    <Form.Group>
                        <div className="inline four wide field"/>
                        <div className="inline ten wide field optn-notice">{translate("dlgChangeProduct.lblOptnNotice")}</div>
                    </Form.Group>
                           <Message error header={trn("dlgChangeProduct.msgErrorHeader")} conten={this.state.errorMessage} />
                       </Form>
                   </Modal.Content>
                   <Modal.Actions>
                       <EnhancedButton primary className="wdm-btn large"
                                       loading={isLoading}
                                       disabled={isLoading || !isSpecInfoDefined}
                                       onClick={(e) => this.btnChangeProductClickHandler()}>
                           {trn("dlgChangeProduct.lblBtnOk")}
                       </EnhancedButton>
                       <EnhancedButton secondary className="wdm-btn large"
                                       onClick={(e) => this.openDialogHandler(false)}>
                           {trn("dlgChangeProduct.lblBtnCancel")}
                       </EnhancedButton>
                   </Modal.Actions>
               </Modal>;

    }
}