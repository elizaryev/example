import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Modal, DropdownItemProps, Loader, Form, Message, Image, List, Icon, PopupProps, CheckboxProps, Input, InputOnChangeData } from 'semantic-ui-react';
import "../../css/ChangePriceDialog.less";
import { ILocalizeActions } from "../../store/Localize";
import * as _ from 'lodash';
import EnhancedButton from "../../components/EnhancedButton";
import EnhancedCheckbox from "../../components/Enhanced/EnhancedCheckbox";
import { IPrice, IPriceActions, PriceType} from "../../store/model/Price";
import { ModalDialogManager } from "../../store/ModalDialog/ModalDialogManager";
import {
    prodTypeModel, ProdModel, IProd, ILoadable, IProdType, ISizeDimensionModel, IProdTypeOptnDtl, IProdTypeOptn,
    IMaterialStockList, IMaterialStock, MaterialStockListModel, IMaterialStockListAction, IProdModelActions
} from "../../store/model/WDMProduct";
import { MiniHelperType, MultiPageDesignTypes } from "../../constants/enums";
import MiniHelper from "../../components/MiniHelper/MiniHelper";
import * as NumericInput from "react-numeric-input";
import { HtmlRecordVersion } from "../../constants/enums";
import { wdmSettings } from "conf";
import { storeActionObserver } from "../../store/StoreActionObserver";
import { DesignSpec, IDesignSpec } from "../../store/model/DesignSpec";
import { publishedAction, IPublishedDesignActions } from "../../store/Gallery/Published";

interface ChangePriceDialogProps {
    localize?:ILocalizeActions,
    prodType?:string,
    sizeDimension?: string,
    material?: string,
    coverMaterial?: string,
    pageMaterial?: string,
    prodTypeOptnDtlAbbrs?: string[],
    onApplyPrice?: (prodType: string, sizeDimension: string, prodTypeOptns: object, pageCount?: number, pageQty?: number, orderQty?: number, price?: IPrice, prod?: IProd, showNumeric?: boolean, showSelfOrderQty?: boolean) => void,
    isLoading?: boolean,
    sideCount?: number,
    price?: PriceType;
    modalDialogManager?: ModalDialogManager;
    pageCount?: number;
    prodModel?: ProdModel;
    showNumeric?: boolean;
    showSelfOrderQty?: boolean,
    multiPageQty?: string,
    multiOrderQty?: string,
    disabled?:boolean
    designSpec?: DesignSpec;
    loadMyCartData?: boolean;
    onSetParentCheckBoxElements?: (showNumeric?: boolean, showSelfOrderQty?: boolean) => void;
    parent?: any;
}

interface ChangePriceDialogState {
    showDialog?: boolean,
    errorMessage?:string,
    sizeDimension?:string,
    prodTypeOptnDtlAbbrs?: string[],
    initDialog?: boolean,

    material?: string,
    hasMaterial?: boolean,
    materialLoading?: boolean,

    coverMaterial?: string,
    coverMaterialLoading?: boolean,
    hasCoverMaterial?: boolean,

    pageMaterial?: string,
    pageMaterialLoading?: boolean,
    hasPageMaterial?: boolean,
    
    multiPageQty?: string,
    multiOrderQty?: string,
    multiOrderQtyLoading?: boolean,
    multiPageQtyLoading?: boolean,
    hasPageQty?: boolean,
    hasOrderQty?: boolean,
    showSelfOrderQty: boolean,
    activeShowSelfOrderQty: boolean,

    qty?: string;
    
    priceVal: number;
    optnPriceVal: number;
    totalPriceVal: number;
    priceLoading: boolean;
    errorCalcPricing: boolean;

    showNumeric: boolean;
    activeShowNumeric: boolean;
    numericMin?: number;
    numericStep?: number;
    price?: PriceType;

    observerId?: string[];
}

@inject("localize", "modalDialogManager", "prodModel", "designSpec")
@observer
export default class ChangePriceDialog extends React.Component<ChangePriceDialogProps, ChangePriceDialogState> {

    constructor(props: ChangePriceDialogProps) {
        super(props);
        this.state = {
            priceVal: 0,
            optnPriceVal: 0,
            totalPriceVal: 0,
            priceLoading: true,
            hasMaterial: false,
            materialLoading: true,
            errorCalcPricing: false,
            showNumeric: false,
            activeShowNumeric: false,
            numericMin: 0,
            numericStep: 500,
            showSelfOrderQty: false,
            activeShowSelfOrderQty: false,
            price: PriceType.create({ price: 0, optionPrice: 0 }),
            observerId: []
        };
    }

    sides: DropdownItemProps[] = [];
    private materialModel: IMaterialStockList = (MaterialStockListModel.create() as any as IMaterialStockList);
    private coverMaterialModel: IMaterialStockList = (MaterialStockListModel.create() as any as IMaterialStockList);
    private pageMaterialModel: IMaterialStockList = (MaterialStockListModel.create() as any as IMaterialStockList);
    private _isMounted: boolean = false;
    private showNumericPopupProps: PopupProps | undefined = undefined;
    private currentNumberStep: number = 1;
    private showSelfOrderQtyPopupProps: PopupProps | undefined = undefined;
    private numerKeyDown: boolean = false;

    /**
     * Assigns state by merging current state with newState parameter
     * @param newState
     */
    private assignState(newState: ChangePriceDialogState) {
        if (!newState.errorMessage) newState.errorMessage = "";
        this.setState(_.assign({}, this.state, newState));
    }

    private isMultiPage(prodType: IProdType | undefined) {
        if (prodType && prodType.multiPageFlg && prodType.multiPageFlg === "Yes")
            return true;
        else
            return false;
    }

    private renderTriggerButton(isBtnDisabled:boolean) {
        const { translate, trn } = this.props.localize!;

        let popupProps: PopupProps | undefined = undefined;
        popupProps = { flowing: true, hoverable: false };
        popupProps.content = trn('Price.ttlBtnPricing');

        return <EnhancedButton basic ypIcon="YP1_price" className="wdm-style-1 wdm-btn-simple no-border"
                               size="large" disabled={isBtnDisabled || this.props.isLoading || this.props.disabled}
                               loading={isBtnDisabled || this.props.isLoading}
                               popupProps={popupProps}
                               labelPosition="left"
                               onClick={(e: any) => this.openDialogHandler(true, false)}>
                   {translate("Price.ttlBtnPricing")}
               </EnhancedButton>;
    }

    private openDialogHandler(isOpen:boolean, skipShowing: boolean) {
        if (!isOpen) {
            this.setState({ showDialog: false, initDialog: false });
            return;
        }

        // to fire event in GalleryItemComponent action to close it
        (publishedAction as any as IPublishedDesignActions).emptyEvent();

        const { modalDialogManager, prodModel, prodType, sizeDimension, prodTypeOptnDtlAbbrs, sideCount } = this.props;
        const { translate, translateTemplate, trn } = this.props.localize!;
        const self = this;
        if (self._isMounted) {
            this.setState({
                showDialog: skipShowing ? false : true,
                //prodType: prodType,
                sizeDimension: sizeDimension,
                initDialog: !(Boolean(prodType) && Boolean(sizeDimension))
            });

            if (!this.state.prodTypeOptnDtlAbbrs)
                this.setState({ prodTypeOptnDtlAbbrs: prodTypeOptnDtlAbbrs});
        }

        // if not loaded ProdType before on ProdChange component
        const prodTypeVal = this.getProdType(prodType);
        if (!prodTypeVal && prodTypeModel) {
            prodTypeModel.load().then(() => {
                if (prodTypeModel.prodTypes && prodTypeModel.prodTypes.length > 0) {
                    const currentProdTypeId = prodTypeModel.prodTypes[0].prodTypeId;
                    self.prodTypeLoader(currentProdTypeId!, skipShowing, self);
                }
            }).catch((error) => {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("defaultModalDlg.errorContent", error.message));
                Promise.reject(error);
                });

            if (self._isMounted)
                this.setState({ showDialog: false, initDialog: true });
            return;
        }

        if (prodTypeVal && prodModel && prodModel.items && prodModel.items.length === 0) {
            if (this.isMultiPage(prodTypeVal)) {
                this.setState({
                    priceLoading: true, activeShowSelfOrderQty: false,
                    multiOrderQtyLoading: true, multiPageQtyLoading: true,
                    coverMaterialLoading: true, pageMaterialLoading: true
                });
            } else {
                this.setState({ priceLoading: true, materialLoading: true });
                // if re-init then get first value from qty list
                const currentQty = prodTypeVal.orderQtyList ? prodTypeVal.orderQtyList.split(',')[0] : "0";
                this.setState({ qty: currentQty, showNumeric: false, showSelfOrderQty: false });
            }

            prodModel.load(true,
                    prodTypeVal.prodTypeKey,
                    sizeDimension,
                    undefined, // load prod without filtering by material
                    self.props.sideCount,
                    this.isMultiPage(prodTypeVal))
                .then((result: IProd[]) => {
                    if (result && result.length > 0) {
                        const firstProd = result[0];

                        if (this.isMultiPage(prodTypeVal)) {

                            (this.coverMaterialModel as any as IMaterialStockListAction).resetLoaded();
                            (this.pageMaterialModel as any as IMaterialStockListAction).resetLoaded();

                            self.setCoverMaterialFromProd(self, result);
                            // set page material
                            let coverProdList = this.props.prodModel!.items!.filter((f: IProd) => f.prodType === prodTypeVal.prodTypeKey
                                && f.sizeDimension === this.state.sizeDimension
                                && f.multiPageCoverMaterialStock!.materialStockAbbr === firstProd.multiPageCoverMaterialStock!.materialStockAbbr);
                            self.setPageMaterialFromProd(self, coverProdList, firstProd.multiPageCoverMaterialStock!.materialStockAbbr);

                            // set cover / page material
                            if (self._isMounted && firstProd.multiPageCoverMaterialStock) {
                                self.setState({ coverMaterial: firstProd.multiPageCoverMaterialStock.materialStockAbbr });
                            }
                            if (self._isMounted && firstProd.multiPagePageMaterialStock) {
                                self.setState({
                                    pageMaterial: (self.pageMaterialModel.items.length > 0)
                                        ? self.pageMaterialModel.items[0].materialStockAbbr
                                        : firstProd.multiPagePageMaterialStock.materialStockAbbr
                                });
                            }

                            const multiPageQtyList = self.getMultiPageQty(firstProd, self);
                            const multiPageQtyVal = (multiPageQtyList.length > 0) ? multiPageQtyList[0].value : 1;
                            const multiOrderQtyList = self.getOrderQtyList(firstProd);

                            let multiOrderQtyVal = 0;
                            // when loaded MyCart item  then check setting checkbox showSelfOrderQty
                            if (self.props.multiOrderQty) {
                                var multiOrdQtyVal = multiOrderQtyList.find(f => f.value === self.props.multiOrderQty);
                                if (multiOrdQtyVal) {
                                    multiOrderQtyVal = (multiOrderQtyList.length > 0) ? multiOrderQtyList[0].value : 1;

                                    if (self._isMounted)
                                        self.setState({ showSelfOrderQty: false });

                                    self.onSetCheckBoxElements(undefined, false);
                                } else {
                                    multiOrderQtyVal = parseInt(self.props.multiOrderQty);

                                    if (self._isMounted)
                                        self.setState({ showSelfOrderQty: true });

                                    self.onSetCheckBoxElements(undefined, true);
                                }
                            } else {
                                multiOrderQtyVal = (multiOrderQtyList.length > 0) ? multiOrderQtyList[0].value : 1;
                                if (self._isMounted)
                                    self.setState({ showSelfOrderQty: false });
                            }

                            const optnDtls = self.getCurrentOptnDtls(self);
                            const priceValues = self.calculateMultiPagePrice(firstProd, multiOrderQtyVal, multiPageQtyVal, optnDtls, self);
                            const priceAction = (self.state.price as any as IPriceActions);
                            priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);

                            if (self._isMounted) {
                                self.setState({
                                    multiPageQty: multiPageQtyVal.toString(),
                                    multiOrderQty: multiOrderQtyVal.toString(),
                                    hasPageQty: (multiPageQtyList.length > 0),
                                    hasOrderQty: (multiOrderQtyList.length > 0),
                                    activeShowSelfOrderQty: true,
                                    priceLoading: false,
                                    priceVal: priceValues.price,
                                    optnPriceVal: priceValues.optnPrice,
                                    totalPriceVal: priceAction.getTotalPrice()!
                                });
                            }

                        } else {
                            // if not have setting material before then try set it
                            if (self.materialModel.items.length === 0)
                                self.setMaterialFromProd(self, result);

                            this.currentNumberStep = 1;
                            const currentQty = prodTypeVal.orderQtyList ? prodTypeVal.orderQtyList.split(',')[0] : "0";
                            //if (!skipShowing)
                            const optnDtls = self.getCurrentOptnDtls(self);
                            self.setSinglePagePriceValues(firstProd, currentQty!, optnDtls, self);

                            if (self._isMounted && firstProd.materialStock) {
                                self.setState({ material: firstProd.materialStock.materialStockAbbr });
                            }

                            // when has value from MyCart item then check pageCount and set showNumeric checkbox
                            if (self.props.pageCount) {
                                var qtyVal = firstProd.orderQtyList.split(',').find(f => f === self.props.pageCount.toString());
                                if (!qtyVal) {
                                    self.setState({ showNumeric: true });
                                    self.onSetCheckBoxElements(true);
                                } else {
                                    self.setState({ showNumeric: false });
                                    self.onSetCheckBoxElements(false);
                                }
                            }

                            self.setNumericProps(self, firstProd);
                        }
                    } else if (result && result.length === 0) {
                        if (this.isMultiPage(prodTypeVal)) {
                            (self.coverMaterialModel as any as IMaterialStockListAction).resetLoaded();
                            (self.pageMaterialModel as any as IMaterialStockListAction).resetLoaded();
                        } else {
                            (self.materialModel as any as IMaterialStockListAction).resetLoaded();
                            self.currentNumberStep = 1;
                        }
                       
                        const priceAction = (self.state.price as any as IPriceActions);
                        priceAction.setPriceValues(0, 0);
                        if (self._isMounted)
                            self.setState({
                                errorCalcPricing: true,
                                priceLoading: false,
                                priceVal: 0,
                                optnPriceVal: 0,
                                activeShowNumeric: false,
                                showNumeric: false,
                                showSelfOrderQty: false,
                                activeShowSelfOrderQty: false,
                                totalPriceVal: priceAction.getTotalPrice()!
                            });
                    }

                    if (self._isMounted) {
                        if (this.isMultiPage(prodTypeVal)) {
                            self.setState({
                                coverMaterialLoading: false,
                                pageMaterialLoading: false,
                                multiOrderQtyLoading: false,
                                multiPageQtyLoading: false,
                                hasCoverMaterial: (self.coverMaterialModel.items.length > 0),
                                hasPageMaterial: (self.pageMaterialModel.items.length > 0)
                            });
                        } else {
                            self.setState({
                                materialLoading: false,
                                hasMaterial: (self.materialModel.items.length > 0)
                            });
                        }
                        self.setState({ initDialog: false, priceLoading: false });
                    }
                       
                })
                .catch((error) => {
                    if (self._isMounted)
                        self.setState({
                            hasMaterial: false, hasCoverMaterial: false, hasPageMaterial: false,
                            hasPageQty: false, hasOrderQty: false,
                            coverMaterialLoading: false,
                            pageMaterialLoading: false,
                            multiOrderQtyLoading: false,
                            multiPageQtyLoading: false,
                            materialLoading: false,
                            priceLoading: false, initDialog: false
                        });

                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                        translateTemplate("defaultModalDlg.errorContent", error.message));
                    Promise.reject(error);
                });
        } else {
            // set applied values
            if (this.props.price && this.props.price.price === 0) return;

            if (this.isMultiPage(prodTypeVal)) {
                const appliedCoverMaterial = this.getCoverMaterial(this.props.coverMaterial);
                if (appliedCoverMaterial)
                    this.setState({ coverMaterial: appliedCoverMaterial.materialStockAbbr });
                const appliedPageMaterial = this.getPageMaterial(this.props.pageMaterial);
                if (appliedPageMaterial)
                    this.setState({ pageMaterial: appliedPageMaterial.materialStockAbbr });

                this.setState({ showSelfOrderQty: (this.props.showSelfOrderQty) ? this.props.showSelfOrderQty : false });
                this.setState({ multiOrderQty: this.props.multiOrderQty });
                this.setState({ multiPageQty: this.props.multiPageQty });

            } else {
                const appliedMaterial = this.getMaterial(this.props.material);
                if (appliedMaterial)
                    this.setState({ material: appliedMaterial.materialStockAbbr });

                this.setState({ showNumeric: (this.props.showNumeric) ? this.props.showNumeric : false });
                this.setState({ qty: this.props.pageCount.toString() });
            }

            if (this.props.prodTypeOptnDtlAbbrs) {
                if (this.state.prodTypeOptnDtlAbbrs) {
                    while (this.state.prodTypeOptnDtlAbbrs.length !== 0) {
                        this.state.prodTypeOptnDtlAbbrs.pop();
                    }
                }

                this.props.prodTypeOptnDtlAbbrs.map(optnDtl => {
                    this.state.prodTypeOptnDtlAbbrs.push(optnDtl);
                });
            }

            if (this.props.price) {
                (this.state.price as any as IPriceActions).setPriceValues(this.props.price.price, this.props.price.optionPrice);
            }

            if (self._isMounted && this.props.price)
                self.setState({
                    errorCalcPricing: false,
                    priceLoading: false,
                    priceVal: this.props.price.price,
                    optnPriceVal: this.props.price.optionPrice,
                    totalPriceVal: (this.state.price as any as IPriceActions).getTotalPrice()!
                });
        }
    }

    private onSetCheckBoxElements(showNumeric?: boolean, showSelfOrderQty?: boolean) {
        if (this.props.onSetParentCheckBoxElements)
            this.props.onSetParentCheckBoxElements(showNumeric, showSelfOrderQty, this.props.parent);
    }

    private setNumericProps(self: any, prod: IProd) {
        const { trn } = self.props.localize!;

        if (self._isMounted && prod && prod.excessDeltaOrderQty && prod.orderQtyList) {
            let numericMin = self.getNumerMinVal(prod);
            if (self.showNumericPopupProps) {
                self.showNumericPopupProps.children = <div style={{ color: "black" }}>
                                                          {trn("dlgChangePrice.lblShowNumericSteper")}
                                                      </div>;
            }

            self.setState({
                numericStep: prod.excessDeltaOrderQty,
                numericMin: numericMin
            });
        } else if (!prod || !prod.excessDeltaOrderQty) {
            if (self.showNumericPopupProps) {
                self.showNumericPopupProps.children = <div style={{ color: "red" }}>
                                                          {trn("dlgChangePrice.msgErrorShowNumericSteper")}
                                                      </div>;
            }

            if (self._isMounted)
                self.setState({
                    activeShowNumeric: false,
                    showNumeric: false
                });
        }
    }

    private geMultiPageQtyCount(innerOrTotalPagesCount: number, mode: MultiPageDesignTypes, pagesIncludesCovers: boolean, noFrontCover: boolean, noBackCover: boolean,
        crossPageNoCoverBacksides: boolean) {
        if (mode === MultiPageDesignTypes.DESIGN_SET) {
            return innerOrTotalPagesCount;
        }
        if (pagesIncludesCovers) {
            return innerOrTotalPagesCount;
        }
        // InnerOrTotalPagesCount contains number of InnerPages
        if (!noFrontCover) {
            innerOrTotalPagesCount += 2;
        }
        if (!noBackCover) {
            innerOrTotalPagesCount += 2;
        }
        if (mode === MultiPageDesignTypes.CROSS_PAGE && crossPageNoCoverBacksides) {
            if (!noFrontCover && !noBackCover) {
                innerOrTotalPagesCount -= 2;
            }
        }
        return innerOrTotalPagesCount;
    }

    private getMultiPageQty(prod: IProd, _this?: any) {
        const self = (_this) ? _this : this;

        let orderPageQty: any[] = [];
        const pageCountFixed = prod.multiPagePageCountFixedFlg === "Yes";
        const fixedPageCount = prod.multiPageInitialPageCount ? prod.multiPageInitialPageCount : 0;
        const mpDesignType: MultiPageDesignTypes = (MultiPageDesignTypes as any)[prod.multiPageDesignType!];
        const pagesIncludesCovers = prod.multiPagePageCountIncludesCoversFlg === "Yes";
        const noFrontCover = prod.multipageNoFrontCoverFlg === "Yes";
        const noBackCover = prod.multipageNoBackCoverFlg === "Yes";
        const crossPageNoCoverBacksides = prod.multipageNoCoverBacksidesFlg === "Yes";

        if (pageCountFixed) {
            const userValue = self.geMultiPageQtyCount(fixedPageCount, mpDesignType, pagesIncludesCovers, noFrontCover, noBackCover, crossPageNoCoverBacksides);
            orderPageQty.push({
                key: userValue,
                text: userValue!.toString(),
                value: userValue!.toString()
            });
        } else {
            const min = prod.multiPageMinPageCount ? prod.multiPageMinPageCount : 0;
            const max = prod.multiPageMaxPageCount ? prod.multiPageMaxPageCount : 0;
            const delta = prod.multiPageInsertDeleteDeltaPageCount ? prod.multiPageInsertDeleteDeltaPageCount : 0;

            if (min !== 0 && max > min && delta !== 0) {
                for (let pg = min; pg <= max; pg += delta)
                {
                    const userValue = self.geMultiPageQtyCount(pg, mpDesignType, pagesIncludesCovers, noFrontCover, noBackCover, crossPageNoCoverBacksides);
                    orderPageQty.push({
                        key: pg,
                        text: userValue.toString(),
                        value: pg.toString()
                    });
                }
            }
        }
        return orderPageQty;
    }

    private getOrderQtyList(prod: IProd) {
        let orderQty: any[] = [];
        const digitalCanPrice = prod.multipageDigitalCanPriceFlg === "Yes";
        let digitalQty: string[] | undefined = undefined;
        if (digitalCanPrice && prod.multipageDigitalOrderQtyList) {
            digitalQty = prod.multipageDigitalOrderQtyList.split(',');
        }
        const gangCanPrice = prod.multipageGangCanPriceFlg === "Yes";
        let gangQty: string[] | undefined = undefined;
        if (gangCanPrice && prod.multipageGangOrderQtyList) {
            gangQty = prod.multipageGangOrderQtyList.split(',');
        }

        if (digitalQty && digitalQty.length > 0) {
            for (let i = 0; i < digitalQty.length; i++) {
                orderQty.push({
                    key: i,
                    text: digitalQty[i],
                    value: digitalQty[i]
                });
            }
        }
        if (gangQty && gangQty.length > 0) {
            for (let j = 0; j < gangQty.length; j++) {
                orderQty.push({
                    key: j,
                    text: gangQty[j],
                    value: gangQty[j]
                });
            }
        }
        return orderQty;
    }

    private validateMultiPageInput(self: any, prod: IProd, multiPageQty?: string, multiOrderQty?: string) {
        const { modalDialogManager } = self.props;
        const { translate, translateTemplate } = self.props.localize!;

        const pageCountFixed = prod.multiPagePageCountFixedFlg === "Yes";
        const multiPageQtyVal = multiPageQty ? parseInt(multiPageQty) : parseInt(self.state.multiPageQty);
        const multiOrderQtyVal = multiOrderQty ? parseInt(multiOrderQty) : parseInt(self.state.multiOrderQty);

        if (multiPageQtyVal === NaN || multiPageQtyVal === 0) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return false;
        }
        if (multiOrderQtyVal === NaN || multiOrderQtyVal === 0) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return false;
        }

        if (!pageCountFixed && multiPageQtyVal !== 0) {

            const min = prod.multiPageMinPageCount ? prod.multiPageMinPageCount : 0;
            const max = prod.multiPageMaxPageCount ? prod.multiPageMaxPageCount : 0;
            const delta = prod.multiPageInsertDeleteDeltaPageCount ? prod.multiPageInsertDeleteDeltaPageCount : 0;
            if (multiPageQtyVal < min || multiPageQtyVal > max) {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                return false;
            } else {
                const rmdr = (multiPageQtyVal - min) % delta;
                if (rmdr !== 0) {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                    return false;
                }
            }
        }

        const digitalCanPrice = prod.multipageDigitalCanPriceFlg === "Yes";
        const gangCanPrice = prod.multipageGangCanPriceFlg === "Yes";
        const digitalMinQty = prod.multipageDigitalMinOrderQty ? prod.multipageDigitalMinOrderQty : 0;
        const gangMinQty = prod.multipageGangMinOrderQty ? prod.multipageGangMinOrderQty : 0;
        const digitalDeltaQty = prod.multipageDigitalDeltaOrderQty ? prod.multipageDigitalDeltaOrderQty : 0;
        const gangDeltaQty = prod.multipageGangDeltaOrderQty ? prod.multipageGangDeltaOrderQty : 0;

        let digitalQty: string[] | undefined = undefined;
        let digitalMaxQty = 0;
        if (digitalCanPrice && prod.multipageDigitalOrderQtyList) {
            digitalQty = prod.multipageDigitalOrderQtyList.split(',');
            if (digitalQty.length > 0) {
                digitalMaxQty = parseInt(digitalQty[digitalQty.length - 1]);
            }
        }
        
        if (digitalCanPrice && gangCanPrice) {
            if (multiOrderQtyVal > digitalMaxQty && multiOrderQtyVal < gangMinQty) {
                let valA = digitalMaxQty + 1;
                let valB = gangMinQty - 1;
                //errMsg = "錯誤：報歉，系統不賣介於" + iValA.ToString() + "～" + iValB.ToString() + "本的數量！建議您輸入" + iDigitalMax.ToString() + "或" + iGangMin.ToString() + " 以拿到最好價錢。。";
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                return false;
            }
        }

        if (digitalCanPrice) {
            if (multiOrderQtyVal <= digitalMaxQty) {
                if (multiOrderQtyVal < digitalMinQty || (digitalDeltaQty !== 0 && !self.valueIsMultipleOf(multiOrderQtyVal, digitalDeltaQty))) {
                    //errMsg = "系統不賣您數入的數量（" + iOrderQty.ToString() + "）！少量（至多" + iDigitalMax.ToString() + "本，至少" + iDigitalMin.ToString() + "本）的訂購數量需是" + iDigitalDelta.ToString() + "的倍數！";
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                    return false;
                }
            }
        }

        if (gangCanPrice) {
            if (multiOrderQtyVal < gangMinQty && !digitalCanPrice) {
                //errMsg = "系統不賣您數入的數量（" + iOrderQty.ToString() + "）！大量（至少" + iGangMin.ToString() + "本）的訂購數量需是" + iGangDelta.ToString() + "的倍數！";
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                return false;
            }
            else if (multiOrderQtyVal >= gangMinQty && (gangDeltaQty !== 0 && !self.ValueIsMultipleOf(multiOrderQtyVal, gangDeltaQty))) {
                        //errMsg = "系統不賣您數入的數量（" + iOrderQty.ToString() + "）！大量（至少" + iGangMin.ToString() + "本）的訂購數量需是" + iGangDelta.ToString() + "的倍數！";
                        modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                        return false;
            }
        }

        return true;
    }

    private calculateMultiPagePrice(prod: IProd, orderQty: number, pageQty: number, optnDtlAbbrs?: string[], _this?: any) {
        const self = (_this) ? _this : this;

        const { modalDialogManager } = self.props;
        const { translate, translateTemplate } = self.props.localize!;

        if (!self.validateMultiPageInput(self, prod, pageQty, orderQty)) {
            return { price: 0, optnPrice: 0 };
        }

        const digitalCanPrice = prod.multipageDigitalCanPriceFlg === "Yes";
        const gangCanPrice = prod.multipageGangCanPriceFlg === "Yes";
        const digitalMinQty = prod.multipageDigitalMinOrderQty ? prod.multipageDigitalMinOrderQty : 0;
        const gangMinQty = prod.multipageGangMinOrderQty ? prod.multipageGangMinOrderQty : 0;
        const digitalDeltaQty = prod.multipageDigitalDeltaOrderQty ? prod.multipageDigitalDeltaOrderQty : 0;
        const gangDeltaQty = prod.multipageGangDeltaOrderQty ? prod.multipageGangDeltaOrderQty : 0;
        
        let orderQtyList: string | undefined = undefined;
        let basePriceList: string | undefined = undefined;
        let pageDeltaPriceList: string | undefined = undefined;
        let deltaQty: number | undefined = undefined;
        let profitPct = 0;

        let digitalQty: string[] | undefined = undefined;
        let digitalMaxQty = 0;
        if (digitalCanPrice && prod.multipageDigitalOrderQtyList) {
            digitalQty = prod.multipageDigitalOrderQtyList.split(',');
            if (digitalQty.length > 0) {
                digitalMaxQty = parseInt(digitalQty[digitalQty.length - 1]);
            }
        }

        let orderQtyValid = true;
        if (orderQty <= 0 || (digitalCanPrice && gangCanPrice && orderQty > digitalMaxQty && orderQty < gangMinQty)) {
             orderQtyValid = false;
        }
        if (!orderQtyValid) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgMultiQtyInvalid"));
            return { price: 0, optnPrice: 0 };
        }

        if ((digitalCanPrice && orderQty >= digitalMinQty && orderQty <= digitalMaxQty) ||
            (digitalCanPrice && gangCanPrice === false && orderQty > digitalMaxQty)) {
            orderQtyList = prod.multipageDigitalOrderQtyList;
            basePriceList = prod.multipageDigitalOrderQtyBasePriceList;
            pageDeltaPriceList = prod.multipageDigitalOrderQtyPageDeltaPriceList;
            deltaQty = digitalDeltaQty;
            profitPct = prod.multipageDigitalProfitPct ? prod.multipageDigitalProfitPct : 0;
        } else if (gangCanPrice && orderQty >= gangMinQty) {
                orderQtyList = prod.multipageGangOrderQtyList;
                basePriceList = prod.multipageGangOrderQtyBasePriceList;
                pageDeltaPriceList = prod.multipageGangOrderQtyPageDeltaPriceList;
                deltaQty = gangDeltaQty;
            profitPct = prod.multipageGangProfitPct ? prod.multipageGangProfitPct : 0;
        }

        if (!deltaQty || (deltaQty > 0 && !self.valueIsMultipleOf(orderQty, deltaQty))) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgQtyInvalid1Prefix", deltaQty));
            return { price: 0, optnPrice: 0 }
        }

        if (!orderQtyList || !basePriceList || !pageDeltaPriceList) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgQtyInvalid1Prefix", deltaQty));
            return { price: 0, optnPrice: 0 }
        }

        let price: number = 0;
        let basePrice = 0, pageDeltaPrice = 0, basePriceFrom = 0, basePriceTo = 0,
            pageDeltaPriceFrom = 0, pageDeltaPriceTo = 0, proratedRatio = 0;
        let qtyFrom = 0, qtyTo = 0;
        const multiQtyParams = self.getMultiQtyParams(orderQtyList, basePriceList, pageDeltaPriceList);
        // determine Qty Range to use, and calculate proratedRatio             
        if (orderQty < multiQtyParams.daQty[0]) {
            // case when orderQty is Below lowest Qty in OrderQtyList;
            qtyFrom = multiQtyParams.daQty[0];
            qtyTo = multiQtyParams.daQty[1];
            basePriceFrom = multiQtyParams.daBasePrice[0];
            basePriceTo = multiQtyParams.daBasePrice[1];
            pageDeltaPriceFrom = multiQtyParams.daPageDeltaPrice[0];
            pageDeltaPriceTo = multiQtyParams.daPageDeltaPrice[1];
            proratedRatio = (orderQty - qtyTo) / (qtyTo - qtyFrom);   // Note: we are using dQtyTo (thus, dBasePriceTo and dPageDeltaPriceTo) as calculation base, the ratio is negative value
            basePrice = basePriceTo + (basePriceTo - basePriceFrom) * proratedRatio;
            pageDeltaPrice = pageDeltaPriceTo + (pageDeltaPriceTo - pageDeltaPriceFrom) * proratedRatio;

            price = Math.ceil((basePrice + pageDeltaPrice * pageQty) / (1 - (profitPct / 100)));
        }
        else {
            if (orderQty > multiQtyParams.daQty[multiQtyParams.daQty.length - 1]) {
                // case when orderQty is Above highest Qty in OrderQtyList;
                qtyFrom = multiQtyParams.daQty[multiQtyParams.daQty.length - 2];
                qtyTo = multiQtyParams.daQty[multiQtyParams.daQty.length - 1];
                basePriceFrom = multiQtyParams.daBasePrice[multiQtyParams.daQty.length - 2];
                basePriceTo = multiQtyParams.daBasePrice[multiQtyParams.daQty.length - 1];
                pageDeltaPriceFrom = multiQtyParams.daPageDeltaPrice[multiQtyParams.daQty.length - 2];
                pageDeltaPriceTo = multiQtyParams.daPageDeltaPrice[multiQtyParams.daQty.length - 1];
                proratedRatio = (orderQty - qtyFrom) / (qtyTo - qtyFrom);  // Note: we are using dQtyFrom (thus, dBasePriceFrom and dPageDeltaPriceFrom) as calculation base, the ratio is positive value
                basePrice = basePriceFrom + (basePriceTo - basePriceFrom) * proratedRatio;
                pageDeltaPrice = pageDeltaPriceFrom + (pageDeltaPriceTo - pageDeltaPriceFrom) * proratedRatio;

                price = Math.ceil((basePrice + pageDeltaPrice * pageQty) / (1 - (profitPct / 100)));
            }
            else {
                //case when orderQty is in OrderQtyList range
                for (let iIdx1 = 0; iIdx1 <= (multiQtyParams.daQty.length - 2); iIdx1++)
                {
                    if (orderQty >= multiQtyParams.daQty[iIdx1] && orderQty <= multiQtyParams.daQty[iIdx1 + 1]) {
                        qtyFrom = multiQtyParams.daQty[iIdx1];
                        qtyTo = multiQtyParams.daQty[iIdx1 + 1];
                        basePriceFrom = multiQtyParams.daBasePrice[iIdx1];
                        basePriceTo = multiQtyParams.daBasePrice[iIdx1 + 1];
                        pageDeltaPriceFrom = multiQtyParams.daPageDeltaPrice[iIdx1];
                        pageDeltaPriceTo = multiQtyParams.daPageDeltaPrice[iIdx1 + 1];
                        proratedRatio = (orderQty - qtyFrom) / (qtyTo - qtyFrom);  // Note: we are using dQtyFrom (thus, dBasePriceFrom and dPageDeltaPriceFrom) as calculation base, the ratio is positive value
                        break;
                    }
                }
                basePrice = basePriceFrom + (basePriceTo - basePriceFrom) * proratedRatio;
                pageDeltaPrice = pageDeltaPriceFrom + (pageDeltaPriceTo - pageDeltaPriceFrom) * proratedRatio;

                price = Math.ceil((basePrice + pageDeltaPrice * pageQty) / (1 - (profitPct / 100)));
            }
        }

        let optnPrice: number = 0;

        let prodTypeOptnDtl: IProdTypeOptnDtl | undefined;
        const currentSizeDimension = self.getSizeDimension(self.props.prodType, self.state.sizeDimension);
        const hasOptions = currentSizeDimension && currentSizeDimension.options && currentSizeDimension.options.length > 0;
        if (!hasOptions)
            return { price, optnPrice };

        let prodTypeOptnDtlAbbrs: string[] | undefined;
        if (optnDtlAbbrs && optnDtlAbbrs.length > 0) {
            prodTypeOptnDtlAbbrs = optnDtlAbbrs;
        }
        else {
            if (self.state.prodTypeOptnDtlAbbrs && self.state.prodTypeOptnDtlAbbrs.length > 0)
                prodTypeOptnDtlAbbrs = self.state.prodTypeOptnDtlAbbrs;
        }
        
        const hasSetOptnDtlAbbr = prodTypeOptnDtlAbbrs && prodTypeOptnDtlAbbrs.length > 0 && prodTypeOptnDtlAbbrs[0] !== "";
        if (!hasSetOptnDtlAbbr)
            return { price, optnPrice };

        const optnDtlAbbrsVal: string = prodTypeOptnDtlAbbrs![0];
        let prodTypeOptnDtlVal: IProdTypeOptnDtl | undefined;
        for (let optn of currentSizeDimension.options) {
            prodTypeOptnDtlVal = optn.prodTypeOptnDtl.find((f: IProdTypeOptnDtl) => f.prodTypeOptnDtlAbbr === optnDtlAbbrsVal);
            if (prodTypeOptnDtlVal) {
                prodTypeOptnDtl = prodTypeOptnDtlVal;
                break;
            }
        }

        if (prodTypeOptnDtl && prodTypeOptnDtl.unitPrice) {
            optnPrice = Math.ceil(prodTypeOptnDtl.unitPrice * orderQty);
        }

        return { price, optnPrice}
    }

    private getMultiQtyParams(orderQtyList: string, basePriceList: string, pageDeltaPriceList: string) {
        const saQty = orderQtyList.split(",");
        let daQty: number[] = [];
        for (let i = 0; i < saQty.length; i++) {
            daQty.push(parseInt(saQty[i]));
        }

        const saBasePrice = basePriceList.split(",");
        let daBasePrice: number[] = [];
        for (let i = 0; i < saBasePrice.length; i++) {
            daBasePrice.push(parseInt(saBasePrice[i]));
        }

        const saPageDeltaPrice = pageDeltaPriceList.split(",");
        let daPageDeltaPrice: number[] = [];
        for (let i = 0; i < saPageDeltaPrice.length; i++) {
            daPageDeltaPrice.push(parseInt(saPageDeltaPrice[i]));
        }

        return { daQty, daBasePrice, daPageDeltaPrice };
    }

    private valueIsMultipleOf(val: number, multiplier: number) {
        let rmdr = 0;
        rmdr = val % multiplier;
        return (rmdr === 0);
    }

    private setNumericParams(materialStockAbbr?: string) {
        const currentProdModel = this.getCurrentProdModel(this, materialStockAbbr);
        this.setNumericProps(this, currentProdModel!);
    }

    private getNumerMinVal(prod: IProd) {
        let numericMin = 0;
        if (prod.orderQtyList) {
            const arrQty = prod.orderQtyList.split(',');
            if (arrQty.length > 0)
                numericMin = parseInt(arrQty[arrQty.length - 1]);
        }
        return numericMin;
    }

    private setMaterialFromProd(self: any, result: IProd[] | undefined) {
        result && result.forEach((prod: IProd) => {
            if (prod.materialStock)
                (self.materialModel as any as IMaterialStockListAction).addMaterialStock(prod.materialStock);
        });
    }

    private setCoverMaterialFromProd(self: any, result: IProd[] | undefined) {
        result && result.forEach((prod: IProd) => {
            if (prod.multiPageCoverMaterialStock)
                (self.coverMaterialModel as any as IMaterialStockListAction).addMaterialStock(prod.multiPageCoverMaterialStock);
        });
    }

    private setPageMaterialFromProd(self: any, coverProd: IProd[], coverMaterialAbbr: string) {
        coverProd.filter((f: IProd) => f.multiPageCoverMaterialStock!.materialStockAbbr === coverMaterialAbbr)
            .forEach((itemProd: IProd) => {
                if (itemProd.multiPagePageMaterialStock)
                    (self.pageMaterialModel as any as IMaterialStockListAction).addMaterialStock(itemProd.multiPagePageMaterialStock);
            });
    }

    private setSinglePagePriceValues(prod: IProd, qty: string, optnDtlAbbrs?: string[], _this?: any) {
        const self = (_this) ? _this : this;
        const { modalDialogManager } = self.props;
        const { translate, translateTemplate } = self.props.localize!;

        if (!prod) {
            //if (self._isMounted)
            //    self.setState({ errorCalcPricing: true, priceLoading: false });

            //modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
            //    translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }

        if (!prod.orderQtyList || !prod.orderQtyPriceList || !qty) {
            if (self._isMounted)
                self.setState({ errorCalcPricing: true, priceLoading: false });

            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }

        let price: number = 0;
        let optnPrice: number = 0;
        const arrQty = prod.orderQtyList.split(',');
        const arrQtyPrice = prod.orderQtyPriceList.split(',');
        let maxQty: number = 0;
        if (arrQty.length > 0) {
             maxQty = parseInt(arrQty[arrQty.length - 1]);
        }

        // calc by formula 
        if (maxQty < parseInt(qty)) {
            // Excess Delta Order Qty 500
            // Excess Delta Price 50
            // Excess Discount Delta Order Qty 1000
            // Excess Discount Delta Disc Pct 1 %
            // Excess Max Disc Pct 10 %
            // Prod_Type record: Order_Qty_List = "100,200,300,500,1000,2000,3000,4000,5000"
            // Prod record: Order_Qty_Price_List = "139,179,199,269,460,920,1340,1740,2090"
            // case 1: Qty = 5000 --> Price = 2090
            //case 2: Qty = 5500 -- > price = (2090 + 50 * 1) - Floor((5500 - 5000) / 1000) * 1 % * (50 * 1) = 2140
            //case 3; Qty = 6000 -> Price = (2090 + 50 * 2) - Floor((6000 - 5000) / 1000) * 1 % * (50 * 2) = 2190 - 1
            //case 4: Qty = 6500 -- > Price = (2090 + 50 * 3) - Floor((6500 - 5000) / 1000))* 1 % * (50 * 3) = 2240 - 1.5 = 2238.5 = 2239(rounded to dollar)
            //case 5: Qty = 7000 -- > price = (2090 + 50 * 4) - Floor((7000 - 5000) / 1000) * 1 % * (50 * 4) = 2290 - 4 = 2286
            const excessDiscountDeltaOrderQty = prod.excessDiscountDeltaOrderQty ? prod.excessDiscountDeltaOrderQty : 1;
            const excessDiscountDeltaDiscPct = prod.excessDiscountDeltaDiscPct ? prod.excessDiscountDeltaDiscPct : 0;
            const deltaStepPrice = (prod.excessDeltaPrice! * this.currentNumberStep);
            let discountPct = Math.floor((parseInt(qty) - maxQty) / excessDiscountDeltaOrderQty) * excessDiscountDeltaDiscPct;
            discountPct = discountPct > 10 ? 10 : discountPct;
            const discountPctVal = discountPct / 100;

            const maxQtyPrice = parseInt(arrQtyPrice[arrQtyPrice.length - 1]);
            price = (maxQtyPrice + deltaStepPrice) - discountPctVal * deltaStepPrice;
            price = Math.ceil(price);

        } else {
            for (let i = 0; i < arrQty.length; i++) {
                if (arrQty[i] === qty) {
                    price = parseInt(arrQtyPrice[i]);
                    break;
                }
            }
        }

        let prodTypeOptnDtl: IProdTypeOptnDtl | undefined;
        const currentSizeDimension = self.getSizeDimension(self.props.prodType, self.state.sizeDimension);
        const hasOptions = currentSizeDimension && currentSizeDimension.options && currentSizeDimension.options.length > 0;
        if (hasOptions) {

            let prodTypeOptnDtlAbbrs: string[] | undefined;
            if (optnDtlAbbrs && optnDtlAbbrs.length > 0) {
                prodTypeOptnDtlAbbrs = optnDtlAbbrs;
            }
            else
            {
                if (self.state.prodTypeOptnDtlAbbrs && self.state.prodTypeOptnDtlAbbrs.length > 0)
                    prodTypeOptnDtlAbbrs = self.state.prodTypeOptnDtlAbbrs;
            }
            
            const hasSetOptnDtlAbbr = prodTypeOptnDtlAbbrs && prodTypeOptnDtlAbbrs.length > 0 && prodTypeOptnDtlAbbrs[0] !== "";
            if (hasSetOptnDtlAbbr) {
                const optnDtlAbbrsVal: string = prodTypeOptnDtlAbbrs![0];
                let prodTypeOptnDtlVal: IProdTypeOptnDtl | undefined;
                for (let optn of currentSizeDimension.options) {
                    prodTypeOptnDtlVal = optn.prodTypeOptnDtl.find((f: IProdTypeOptnDtl) => f.prodTypeOptnDtlAbbr === optnDtlAbbrsVal);
                    if (prodTypeOptnDtlVal) {
                        prodTypeOptnDtl = prodTypeOptnDtlVal;
                        break;
                    }
                }

                if (prodTypeOptnDtl && prodTypeOptnDtl.orderQtyList && prodTypeOptnDtl.orderQtyPriceList) {

                    const arrOptnDtlQty = prodTypeOptnDtl.orderQtyList.split(',');
                    const arrOptnDtlQtyPrice = prodTypeOptnDtl.orderQtyPriceList.split(',');

                    let maxOptnQty: number = 0;
                    if (arrOptnDtlQty.length > 0) {
                        maxOptnQty = parseInt(arrOptnDtlQty[arrOptnDtlQty.length - 1]);
                    }

                    // calc by formula 
                    if (maxOptnQty < parseInt(qty)) {
                        const excessDiscountDeltaOrderQty = prodTypeOptnDtl.excessDiscountDeltaOrderQty ? prodTypeOptnDtl.excessDiscountDeltaOrderQty : 1;
                        const excessDiscountDeltaDiscPct = prodTypeOptnDtl.excessDiscountDeltaDiscPct ? prodTypeOptnDtl.excessDiscountDeltaDiscPct : 0;
                        const deltaStepPrice = (prodTypeOptnDtl.excessDeltaPrice! * this.currentNumberStep);
                        let discountPct = Math.floor((parseInt(qty) - maxOptnQty) / excessDiscountDeltaOrderQty) * excessDiscountDeltaDiscPct;
                        discountPct = discountPct > 10 ? 10 : discountPct;
                        const discountPctVal = discountPct / 100;

                        const maxOptnQtyPrice = parseInt(arrOptnDtlQtyPrice[arrOptnDtlQtyPrice.length - 1]);
                        optnPrice = (maxOptnQtyPrice + deltaStepPrice) - discountPctVal * deltaStepPrice;
                        optnPrice = Math.ceil(optnPrice);

                    } else {
                        for (let i = 0; i < arrOptnDtlQty.length; i++) {
                            if (arrOptnDtlQty[i] === qty) {
                                optnPrice = parseInt(arrOptnDtlQtyPrice[i]);
                                break;
                            }
                        }
                    }
                }
            }
        }

        const priceAction = (self.state.price as any as IPriceActions);
        priceAction.setPriceValues(price, optnPrice);
        if (self._isMounted)
            self.setState({
                errorCalcPricing: false,
                priceLoading: false,
                priceVal: price,
                optnPriceVal: optnPrice,
                totalPriceVal: priceAction.getTotalPrice()
            });
    }

    private btnApplyPriceClickHandler() {
        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;

        if (!this.props.onApplyPrice) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorApplyPrice"));
            return;
        }

        const currentSizeDimension = this.getSizeDimension(this.props.prodType, this.state.sizeDimension);
        if (!currentSizeDimension) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorApplyPrice"));
            return;
        }

        let optns: any = {};
        if (currentSizeDimension.options) {
            currentSizeDimension.options.forEach((optn: any) => {
                optn.prodTypeOptnDtl.forEach((optnDtl: any) => {
                    if (this.state.prodTypeOptnDtlAbbrs &&
                        this.state.prodTypeOptnDtlAbbrs.indexOf(optnDtl.prodTypeOptnDtlAbbr) >= 0)
                        optns[optn.prodTypeOptnId] = optnDtl.prodTypeOptnDtlAbbr;
                });
            });
        }

        let currentProd = this.getCurrentProdModel(this);

        if (this.props.price && this.state.price) {
            (this.props.price as any as IPriceActions).setPriceValues(this.state.price.price, this.state.price.optionPrice);
        }

        this.props.onApplyPrice(
            this.props.prodType || "",
            this.state.sizeDimension || "",
            optns,
            (this.state.qty) ? parseInt(this.state.qty) : 0,
            (this.state.multiPageQty) ? parseInt(this.state.multiPageQty) : 0,
            (this.state.multiOrderQty) ? parseInt(this.state.multiOrderQty) : 0,
            (this.props.price as any as IPrice),
            currentProd,
            this.state.showNumeric,
            this.state.showSelfOrderQty);

        this.openDialogHandler(false, false);
    }

    private getCurrentProdModel(_this?: any, materialStockAbbr?: string, coverMaterialStockAbbr?: string, pageMaterialStockAbbr?: string) {
        const self = (_this) ? _this : this;
        const currentProdType = self.getProdType(self.props.prodType);

        let prodList = self.props.prodModel.items.filter((f: IProd) => f.prodType === currentProdType.prodTypeKey &&
            f.sizeDimension === self.state.sizeDimension);

        if (!self.isMultiPage(currentProdType)) {
            prodList = prodList.filter((f: IProd) => f.printSide === (self.props.sideCount === 1 ? "Single" : "Double"));
        }

        const materialVal = (materialStockAbbr) ? materialStockAbbr : self.state.material;
        if (!self.isMultiPage(currentProdType) && materialVal) {
            prodList = prodList.filter((f: IProd) => f.materialStock!.materialStockAbbr === materialVal);
        }

        const coverMaterialStockVal = (coverMaterialStockAbbr) ? coverMaterialStockAbbr : self.state.coverMaterial;
        if (self.isMultiPage(currentProdType) && coverMaterialStockVal) {
            prodList = prodList.filter((f: IProd) => f.multiPageCoverMaterialStock!.materialStockAbbr === coverMaterialStockVal);
        }

        const pageMaterialStockVal = (pageMaterialStockAbbr) ? pageMaterialStockAbbr : self.state.pageMaterial;
        if (self.isMultiPage(currentProdType) && pageMaterialStockVal) {
            prodList = prodList.filter((f: IProd) => f.multiPagePageMaterialStock!.materialStockAbbr === pageMaterialStockVal);
        }

        let currentProd: IProd | undefined = undefined;
        if (prodList.length > 0) {
            currentProd = prodList[0];
        }
        return currentProd;
    }

    private prodTypeLoader(prodTypeId: string, skipShowing: boolean, _this?: any) {
        const self = (_this) ? _this : this;
        const { modalDialogManager } = self.props;
        const { translate, translateTemplate, trn } = self.props.localize!;

        const prodTypeValue = self.getProdType(prodTypeId) as IProdType;
        if (!prodTypeValue)
            return;
        
        self.assignState({prodType: prodTypeValue.prodTypeId});
        prodTypeValue.load().then(() => {
            if (prodTypeValue.sizeDimensions && prodTypeValue.sizeDimensions.length > 0) {
                self.sizeDimensionChangeHandler({ value: self.props.sizeDimension });
                self.openDialogHandler(true, skipShowing);
            }
        }).catch((error:any) => {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", error.message));
            Promise.reject(error);
        });
    }

    private sizeDimensionChangeHandler(result: any) {
        const sizeDimensionValue = this.getSizeDimension(this.props.prodType, result.value) as ISizeDimensionModel;
        const self = this;
        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;				

        if (!sizeDimensionValue)
            return;

        this.setState({
            sizeDimension: sizeDimensionValue.sizeDimension,
            prodTypeOptnDtlAbbrs: this.state.initDialog ? this.state.prodTypeOptnDtlAbbrs : undefined
        });

        (sizeDimensionValue as any as ILoadable).load(false, this.props.prodType).then(() => {
            if (sizeDimensionValue.options) {
                if (!self.state.initDialog) {
                    // Select first available entry (no option)
                    self.optnChangeHandler("0;");
                }
            }
            self.setState({initDialog:false});
        }).catch((error) => {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("defaultModalDlg.errorContent", error.message));
            Promise.reject(error);
        });
    }

    private qtyChangeHandler(value: any) {
        if (value) {
            this.setState({ qty: value.value });
            this.changeSinglePagePrice(this.state.material, value.value);
        }
    }

    private materialChangeHandler(result: any) {
        const materialValue = this.getMaterial(result.value);
        if (materialValue) {
            this.setState({ material: materialValue.materialStockAbbr });
            this.setNumericParams(materialValue.materialStockAbbr);
            this.changeSinglePagePrice(materialValue.materialStockAbbr, this.state.qty);
        }
    }

    private getMultiPageQtyValues(currProd: IProd, self: any) {
        const multiPageQtyList = self.getMultiPageQty(currProd);
        const multiPageQtyVal = (multiPageQtyList.length > 0) ? multiPageQtyList[0].value : 1;
        const multiOrderQtyList = self.getOrderQtyList(currProd);
        const multiOrderQtyVal = (multiOrderQtyList.length > 0) ? multiOrderQtyList[0].value : 1;

        return { multiPageQtyVal, multiOrderQtyVal, hasPageQty: (multiPageQtyList.length > 0), hasOrderQty: (multiOrderQtyList.length > 0) };
    }

    private coverMaterialChangeHandler(coverMaterialVal: any) {

        const { price,  modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);

        if (this.coverMaterialModel.items.length === 0) {
            this.setZeroPrice();
            return;
        }

        (this.pageMaterialModel as any as IMaterialStockListAction).resetLoaded();

        const currentProdType = this.getProdType(this.props.prodType);
        if (!currentProdType || !this.props.prodModel || !this.props.prodModel.items) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }

        let coverProdList = this.props.prodModel.items.filter((f: IProd) => f.prodType === currentProdType.prodTypeKey
            && f.sizeDimension === this.state.sizeDimension
            && f.multiPageCoverMaterialStock!.materialStockAbbr === coverMaterialVal.value);

        this.setPageMaterialFromProd(this, coverProdList, coverMaterialVal.value);
        if (coverProdList.length > 0 && coverProdList[0].multiPagePageMaterialStock) {
            const currProd = coverProdList[0];
            const pageMaterialVal = (this.pageMaterialModel.items.length > 0)
                ? this.pageMaterialModel.items[0].materialStockAbbr
                : currProd.multiPagePageMaterialStock!.materialStockAbbr;
            
            const multiPageQtyValues = this.getMultiPageQtyValues(currProd, this);
            const priceValues = this.calculateMultiPagePrice(currProd, multiPageQtyValues.multiOrderQtyVal, multiPageQtyValues.multiPageQtyVal);
            priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);
            
            this._isMounted && this.setState({
                coverMaterial: coverMaterialVal.value,
                pageMaterial: pageMaterialVal,
                multiPageQty: multiPageQtyValues.multiPageQtyVal,
                multiOrderQty: multiPageQtyValues.multiOrderQtyVal,
                hasPageQty: multiPageQtyValues.hasPageQty,
                hasOrderQty: multiPageQtyValues.hasOrderQty,
                priceVal: priceValues.price,
                optnPriceVal: priceValues.optnPrice,
                totalPriceVal: priceAction.getTotalPrice()!
            });
        } else {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
        }
    }

    private setZeroPrice() {
        const { price } = this.props;
        const priceAction = (price as any as IPriceActions);
        priceAction.setPriceValues(0, 0);
        this._isMounted && this.setState({
            priceVal: 0,
            optnPriceVal: 0,
            totalPriceVal: priceAction.getTotalPrice()!
        });
    }

    private pageMaterialChangeHandler(pageMaterialVal: any) {
        const { modalDialogManager } = this.props;
        const { price } = this.state;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);
        
        if (this.pageMaterialModel.items.length === 0) {
            this.setZeroPrice();
            return;
        }

        const currPageMaterial = this.pageMaterialModel.items.find((f: IMaterialStock) => f.materialStockAbbr === pageMaterialVal.value);
        if (!currPageMaterial) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            return;
        }
        const currProd = this.getCurrentProdModel(this, undefined, this.state.coverMaterial, currPageMaterial.materialStockAbbr);
        if (!currProd) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            return;
        }

        const multiPageQtyValues = this.getMultiPageQtyValues(currProd, this);
        const priceValues = this.calculateMultiPagePrice(currProd, multiPageQtyValues.multiOrderQtyVal, multiPageQtyValues.multiPageQtyVal);
        priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);

        this._isMounted && this.setState({
            pageMaterial: pageMaterialVal.value,
            multiPageQty: multiPageQtyValues.multiPageQtyVal,
            multiOrderQty: multiPageQtyValues.multiOrderQtyVal,
            hasPageQty: multiPageQtyValues.hasPageQty,
            hasOrderQty: multiPageQtyValues.hasOrderQty,
            priceVal: priceValues.price,
            optnPriceVal: priceValues.optnPrice,
            totalPriceVal: priceAction.getTotalPrice()!
        });
    }

    private pageQtyChangeHandler(pageQtyVal: any) {
        
        const { coverMaterial, pageMaterial, multiOrderQty } = this.state;
        const { price, modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);

        const currProd = this.getCurrentProdModel(this, undefined, coverMaterial, pageMaterial);
        if (!currProd) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            return;
        }
       

        const priceValues = this.calculateMultiPagePrice(currProd, parseInt(multiOrderQty!), parseInt(pageQtyVal.value));
        priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);

        this._isMounted && this.setState({
            multiPageQty: pageQtyVal.value,
            priceVal: priceValues.price,
            optnPriceVal: priceValues.optnPrice,
            totalPriceVal: priceAction.getTotalPrice()!
        });
    }

    private orderQtyChangeHandler(orderQtyVal: any) {
        const { coverMaterial, pageMaterial, multiPageQty } = this.state;
        const { modalDialogManager } = this.props;
        const { price } = this.state;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);

        const currProd = this.getCurrentProdModel(this, undefined, coverMaterial, pageMaterial);
        if (!currProd) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            return;
        }
        
        const priceValues = this.calculateMultiPagePrice(currProd, parseInt(orderQtyVal.value), parseInt(multiPageQty!));
        priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);

        this._isMounted && this.setState({
            multiOrderQty: orderQtyVal.value,
            priceVal: priceValues.price,
            optnPriceVal: priceValues.optnPrice,
            totalPriceVal: priceAction.getTotalPrice()!
        });
    }


    private changeSinglePagePrice(materialStockAbbr?: string, qty?: string | undefined, optnDtlAbbrs?: string[] | undefined, _this?: any) {
        const self = (_this) ? _this : this;
        const { modalDialogManager } = self.props;
        const { translate, translateTemplate } = self.props.localize!;
        let prodTypeValue: any = undefined;
        for (let prodType of prodTypeModel.prodTypes) {
            if (prodType.prodTypeId === self.props.prodType) {
                prodTypeValue = prodType;
                break;
            }
        }

        if (!prodTypeValue || !qty || !self.state.sizeDimension || !self.props.sideCount || !self.props.prodModel || !self.props.prodModel.items) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }

        const currentProd = self.getCurrentProdModel(self, materialStockAbbr);
        if (self.props.prodModel.items.length > 0 && !currentProd && self.state.initDialog) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }
        
        this.setSinglePagePriceValues(currentProd, qty, optnDtlAbbrs);
    }
    
    private optnChangeHandler(value: any) {
        //Value is delimited by semicolon
        const optnDtlValueArr = value.split(";");
        const optnDtlValue = optnDtlValueArr[1];
        const optnIndex = +optnDtlValueArr[0];
        if (!isNaN(optnIndex)) {
            const optnDtls = this.getCurrentOptnDtls();
            optnDtls[optnIndex] = optnDtlValue;
            this.setState({ prodTypeOptnDtlAbbrs: optnDtls });
           
            const { price, prodType, modalDialogManager } = this.props;
            const { coverMaterial, pageMaterial, multiPageQty, multiOrderQty } = this.state;
            const { translate, translateTemplate } = this.props.localize!;

            const prodTypeVal = this.getProdType(prodType);
            if (this.isMultiPage(prodTypeVal)) {
                let currProd = this.getCurrentProdModel(this, undefined, coverMaterial, pageMaterial);
                if (currProd && multiOrderQty && multiPageQty) {
                    const priceValues = this.calculateMultiPagePrice(currProd, parseInt(multiOrderQty), parseInt(multiPageQty));
                    const priceAction = (price as any as IPriceActions);
                    priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);
                } else {
                    modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                }
            } else {
                const currentProdModel = this.getCurrentProdModel(this, this.state.material);
                if (this._isMounted && currentProdModel && currentProdModel.excessDeltaOrderQty) {
                    let numericMin = this.getNumerMinVal(currentProdModel);
                    this.setState({ activeShowNumeric: true, numericStep: currentProdModel.excessDeltaOrderQty, numericMin: numericMin });
                }
                this.changeSinglePagePrice(this.state.material, this.state.qty, optnDtls);
            }
        }
    }

    private getCurrentOptnDtls(_this?: any) {
        const self = (_this) ? _this : this;

        if (self.state.prodTypeOptnDtlAbbrs) {
            return self.state.prodTypeOptnDtlAbbrs.slice();
        }

        //Return empty options
        const sd = self.getSizeDimension(self.props.prodType, self.state.sizeDimension);
        if (sd)
            return sd.options.map((optn: IProdTypeOptn) => "");

        return [];
    }

    private getProdType(prodTypeId?: string) {
        if (!prodTypeId) return undefined;

        return prodTypeModel.prodTypes.find((pt) => pt.prodTypeId === prodTypeId);
    }

    private getSizeDimension(prodTypeId?: string, sizeDimension?: string, _this?: any) {
        
        if (!prodTypeId || !sizeDimension) return undefined;

        const self = (_this) ? _this : this;
        const currentProdType = self.getProdType(prodTypeId);
        if (currentProdType) {
            return currentProdType.sizeDimensions.find((sd: ISizeDimensionModel) => sd.sizeDimension === sizeDimension);
        }
        return undefined;
    }

    private getMaterial(material?: string) {
        if (!material) return undefined;
        const currentMaterial = this.materialModel.items.find((m) => m.materialStockAbbr === material);
        return currentMaterial;
    }

    private getCoverMaterial(coverMaterial?: string) {
        if (!coverMaterial) return undefined;
        const currentCoverMaterial = this.coverMaterialModel.items.find((m) => m.materialStockAbbr === coverMaterial);
        return currentCoverMaterial;
    }
    
    private getPageMaterial(pageMaterial?: string) {
        if (!pageMaterial) return undefined;
        const pageCoverMaterial = this.pageMaterialModel.items.find((m) => m.materialStockAbbr === pageMaterial);
        return pageCoverMaterial;
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

        return optnDtls.concat(dtls.map((optnDtl, index) => {
            return {
                text:optnDtl.description,
                value: optnIndex + ";" + optnDtl.prodTypeOptnDtlAbbr,
                selected: currentOptnDtls[optnIndex] === optnDtl.prodTypeOptnDtlAbbr
            }
        }));
    }
  
    private prodTypeIdChangeHandler(value: any) {

    }

    private onShowNumericSteper(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) {

        this.setState({ showNumeric: data.checked! });
        let prod = this.getCurrentProdModel();
        if (prod && prod.orderQtyList) {
            const arrQty = prod.orderQtyList.split(',');
            let qtyVal: string = "0";
            if (!data.checked) {
                if (arrQty.length > 0) {
                    this.setState({ qty: arrQty[0] });
                    qtyVal = arrQty[0];
                }
            } else if (prod.excessDeltaOrderQty) {
                const maxQty = parseInt(arrQty[arrQty.length - 1]);
                qtyVal = (maxQty + prod.excessDeltaOrderQty).toString();
                this.setState({ qty: qtyVal });
            }
            this.currentNumberStep = 1;
            this.changeSinglePagePrice(this.state.material, qtyVal);
        }
    }

    private onShowSelfOrderQty(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) {

        const { modalDialogManager } = this.props;
        const { price } = this.state;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);

        this.setState({ showSelfOrderQty: data.checked! });
        let prod = this.getCurrentProdModel();
        let multiOrderQtyVal: string | undefined = undefined;
        if (!data.checked) {
            if (prod) {
                let orderQtyList = this.getOrderQtyList(prod);
                if (orderQtyList.length > 0) {
                    multiOrderQtyVal = orderQtyList[0].value;
                } 
            } 
        } else {
            multiOrderQtyVal = "1";
        }

        if (prod && this.state.multiPageQty && multiOrderQtyVal) {
            this.calculateMultiPagePrice(prod, parseInt(multiOrderQtyVal), parseInt(this.state.multiPageQty));

            const priceValues = this.calculateMultiPagePrice(prod, parseInt(multiOrderQtyVal), parseInt(this.state.multiPageQty!));
            priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);
            this._isMounted && this.setState({
                multiOrderQty: multiOrderQtyVal,
                priceVal: priceValues.price,
                optnPriceVal: priceValues.optnPrice,
                totalPriceVal: priceAction.getTotalPrice()!
            });
        } else {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            this._isMounted && this.setState({ multiOrderQty: "0" });
            return;
        }
    }

    private selfOrderQtyChangeHandler(data: InputOnChangeData) {

        const { modalDialogManager } = this.props;
        const { price } = this.state;
        const { translate, translateTemplate } = this.props.localize!;
        const priceAction = (price as any as IPriceActions);

        if (!data.value) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            this._isMounted && this.setState({ multiOrderQty: "0" });
            return;
        }
        
        const re = /^\d+$/;
        if (!re.test(data.value)) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            this._isMounted && this.setState({multiOrderQty: "0"});
            return;
        }
        

        let prod = this.getCurrentProdModel();
        if (!prod) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"), translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            this.setZeroPrice();
            this._isMounted && this.setState({multiOrderQty: "0"});
            return;
        }
        
        const priceValues = this.calculateMultiPagePrice(prod, parseInt(data.value), parseInt(this.state.multiPageQty!));
        priceAction.setPriceValues(priceValues.price, priceValues.optnPrice);
        this._isMounted && this.setState({
            multiOrderQty: parseInt(data.value).toString(), // to convert correct number format - without first zero value
            priceVal: priceValues.price,
            optnPriceVal: priceValues.optnPrice,
            totalPriceVal: priceAction.getTotalPrice()!
        });

    }

    qtyNumericChangeHandler(value: number | null, stringValue: string, input: HTMLInputElement) {
        this.setState({ qty: stringValue });

        if (!this.numerKeyDown) {
            this.doNumericSteperAction(stringValue);
            this.numerKeyDown = false;
        }
    }

    onBlurNumeric = (e: any) => {
        this.doNumericSteperAction();
    }

    onKeyDownNumeric = (e: any) => {
        //enter
        this.numerKeyDown = true;

        if (e.keyCode === 13) {
            this.doNumericSteperAction();
        }
    }

    private doNumericSteperAction(qty?: string) {
        const { modalDialogManager } = this.props;
        const { translate, translateTemplate } = this.props.localize!;

        let qtyVal = 0;
        if (qty) {
            qtyVal = parseInt(qty);
        } else {
            if (!this.state.qty) {
                modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                    translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
                return;
            }

            qtyVal = parseInt(this.state.qty);
        }

        let prod = this.getCurrentProdModel();
        if (!prod || !prod.orderQtyList || !prod.excessDeltaOrderQty) {
            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("dlgChangePrice.msgErrorCalcPrice"));
            return;
        }
        const arrQty = prod.orderQtyList.split(',');
        const maxQty = parseInt(arrQty[arrQty.length - 1]);
        const numericMinQtyVal = maxQty + prod.excessDeltaOrderQty;
        
        const re = /^\d+$/;
        if (!re.test(this.state.qty!)) {
            this.setState({ qty: numericMinQtyVal.toString() });
            this.changeSinglePagePrice(this.state.material, numericMinQtyVal.toString());

            modalDialogManager!.error(translate("defaultModalDlg.errorHeader"),
                translateTemplate("dlgChangePrice.msgErrorInputNumericValue"));
            return;
        }

        
        if (qtyVal < numericMinQtyVal) {
            this.setState({ qty: numericMinQtyVal.toString() });
            this.currentNumberStep = 1;
            this.changeSinglePagePrice(this.state.material, numericMinQtyVal.toString());

            modalDialogManager!.error(translate("dlgChangePrice.warningHeader"),
                translateTemplate("dlgChangePrice.lblRecommendedMinQty", numericMinQtyVal));
        } else {
            const surplus = qtyVal % prod.excessDeltaOrderQty;
            if (surplus !== 0) {
                const recommended = qtyVal - surplus + prod.excessDeltaOrderQty;
                this.setState({ qty: recommended.toString() });
                this.currentNumberStep = (recommended / prod.excessDeltaOrderQty) - (maxQty / prod.excessDeltaOrderQty);
                this.changeSinglePagePrice(this.state.material, this.state.qty);

                modalDialogManager!.error(translate("dlgChangePrice.warningHeader"),
                    translateTemplate("dlgChangePrice.lblRecommendedQty", recommended));
            } else {
                this.currentNumberStep = (qtyVal / prod.excessDeltaOrderQty) - (maxQty / prod.excessDeltaOrderQty);
                //this.currentNumberStep = qtyVal < parseInt(this.state.qty!) ? --this.currentNumberStep : ++this.currentNumberStep;
                this.changeSinglePagePrice(this.state.material, this.state.qty);
            }
        }
    }


    componentWillMount() {

        const { trn } = this.props.localize!;
        if (trn) {
            this.sides = [
                { key: 0, text: trn("dlgChangePrice.lblSingleSide"), value: 1 },
                { key: 1, text: trn("dlgChangePrice.lblDoubleSide"), value: 2 }
            ];
        }

        this.showNumericPopupProps = { flowing: true, hoverable: false, position: "bottom center" };
        //this.showNumericPopupProps.content = trn("dlgChangePrice.lblShowNumericSteper");

        this.showSelfOrderQtyPopupProps = { flowing: true, hoverable: false, position: "bottom center" };
        this.showSelfOrderQtyPopupProps.content = trn("dlgChangePrice.lblShowSelfOrderQty");

        if (this.props.pageCount) {
            this.setState({ qty: this.props.pageCount.toString() });
        }

        if (this.props.price) {
            (this.state.price as any as IPriceActions).setPriceValues(this.props.price.price, this.props.price.optionPrice);
        }

        this.openDialogHandler(true, true);
    }

    componentDidMount() {
        this._isMounted = true;

        // subscribe to events
        // when update design spec must update prod model too
        let observerId = storeActionObserver.registerStoreAction(this.props.designSpec, "updateValues", (storeArgs: any, designSpec: any) => {

            if (this.props.prodModel) 
                (this.props.prodModel as any as IProdModelActions).clear();

            this.prodTypeLoader((this.props.designSpec as any as IDesignSpec).prodTypeId, true, this);
        });

        this.setState({ observerId: this.state.observerId!.concat(observerId) });
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.state.observerId!.forEach((observerId: string) => {
            storeActionObserver.removeStoreAction(observerId);
        });
    }

    render() {
        const { trn, translate } = this.props.localize!;
        const { prodModel, loadMyCartData } = this.props;
        const currentProdType = this.getProdType(this.props.prodType);
        const currentSizeDimension = this.getSizeDimension(this.props.prodType, this.state.sizeDimension);
        
        const prodTypes = prodTypeModel.prodTypes ? prodTypeModel.prodTypes.map((pt: IProdType, index: number) => {
            return {
               key:index,
               text:pt.description,
               value:pt.prodTypeId
            }
        }) : [];

        // size
        let sizeDimensions: any[] = [];
        if (this.props.prodType) {
            const pt = this.getProdType(this.props.prodType);
            if (pt) {
                const sd = pt.sizeDimensions;
                if (sd) {
                    sizeDimensions = sd.map((sd, index: number) => {
                        return {
                            key: index,
                            text: sd.description,
                            value: sd.sizeDimension
                        }
                    });
                }
            }
        }
        // size

        // material
        let materials: any[] = [];
        if (this.props.prodType && this.materialModel) {
            materials = this.materialModel.items.map((material, index) => {
                return {
                    key: index,
                    text: material.description,
                    value: material.materialStockAbbr
                }
            });
        }
        // material

        let prod = this.getCurrentProdModel();
        let coverMaterial: any[] = [];
        if (this.props.prodType && prod && this.coverMaterialModel) {
            coverMaterial = this.coverMaterialModel.items.map((material, index) => {
                return {
                    key: `${material.materialStockKey}-${index}`,
                    text: material.description,
                    value: material.materialStockAbbr
                }
            });
        }
        
        let pageMaterials: any[] = [];
        if (this.props.prodType && prod && this.pageMaterialModel) {
            pageMaterials = this.pageMaterialModel.items.map((material, index) => {
                return {
                    key: `${material.materialStockKey}-${index}`,
                    text: material.description,
                    value: material.materialStockAbbr
                }
            });
        }

        let multiPageQty: any[] = [];
        if (prod)
            multiPageQty = this.getMultiPageQty(prod);

        let multiOrderQty: any[] = [];
        if (prod)
            multiOrderQty = this.getOrderQtyList(prod);
        
        // qty
        let qties: any[]  = [];
        if (this.props.prodType) {
            const pt = this.getProdType(this.props.prodType);
            if (pt) {
                const oq = pt.orderQtyList;
                if (oq) {
                    qties = oq.split(',').map((qty, index) => {
                        return {
                            key: index,
                            text: qty,
                            value: qty
                        }
                    });
                }
            }
        }
        // qty

        const isSizeDimensionLoading = prodTypeModel.isLoading || 
            (currentProdType && currentProdType.isLoading);

        const isOptionsLoading = isSizeDimensionLoading ||
            (currentSizeDimension && currentSizeDimension.isLoading) || this.state.initDialog;

        const prodTypeOptns = currentSizeDimension ? (currentSizeDimension.options || []) : [];

        const isLoading = !this.props.disabled &&
        (prodTypeModel.isLoading ||
            isSizeDimensionLoading ||
            isOptionsLoading ||
            this.state.initDialog);

        const isSpecInfoDefined = this.props.prodType && this.state.sizeDimension;
        const currentOptnDtls = this.getCurrentOptnDtls();

        const {
            hasMaterial, errorCalcPricing, hasPageQty, hasOrderQty, hasCoverMaterial, hasPageMaterial,
            priceLoading, coverMaterialLoading, pageMaterialLoading, multiOrderQtyLoading, multiPageQtyLoading, materialLoading
        } = this.state;

        const applyBtnLoadingState = isLoading || priceLoading ||
            (this.isMultiPage(currentProdType)
                ? (coverMaterialLoading || pageMaterialLoading || multiOrderQtyLoading || multiPageQtyLoading)
                : materialLoading);

        const applyBtnDisabled = (isLoading ||
                !isSpecInfoDefined ||
                priceLoading ||
                errorCalcPricing) ||
            (this.isMultiPage(currentProdType)
                ? (!hasPageQty || !hasOrderQty || !hasCoverMaterial || !hasPageMaterial)
                : !hasMaterial);

        const trigerBtnDisabled = isLoading /*|| this.state.materialLoading*/
            //|| (coverMaterialLoading || pageMaterialLoading || multiOrderQtyLoading || multiPageQtyLoading)
            || (prodModel && prodModel.isLoading)
            || loadMyCartData;

        return <Modal id="change-price-dlg" trigger={this.renderTriggerButton(trigerBtnDisabled)} size="large" open={this.state.showDialog}
                      closeOnDimmerClick={true} closeIcon={true}
                      className="wdm"
                      onClose={(e:any) => this.openDialogHandler(false, false)}>
                   <Modal.Header>
                       <Icon className="icon-YP1_price"/>
                       {translate(`dlgChangePrice.${this.isMultiPage(currentProdType) ? "titleMulti": "titleSingle" }`)}
                   </Modal.Header>
                   <Modal.Content>
                       {currentProdType && currentProdType.graphicFile && <div className="img-cont">
                            <div className="inline field img-parent">
                                <Image inline src={currentProdType.graphicFile} className="img-thumb" />
                            </div>
                       </div>}
                       <div className="inline ten wide field optn-notice">{translate("dlgChangePrice.lblOptnNotice")}</div>
                       <Form size="mini" error={this.state.errorMessage !== undefined && this.state.errorMessage !== ""}>
                           <Form.Group className="miniHelper">
                               {this.isMultiPage(currentProdType) ? "" 
                                    : <MiniHelper type={MiniHelperType.MaterialStockInfo}
                                            version={(wdmSettings.htmlRecordVersion as any as HtmlRecordVersion)}
                                            materialStockAbbr={this.state.material}
                                            prodTypeId={currentProdType ? currentProdType.prodTypeId : undefined} />}
                                        <MiniHelper type={MiniHelperType.DaysNeeded} 
                                           version={(wdmSettings.htmlRecordVersion as any as HtmlRecordVersion)}
                                           prodTypeId={currentProdType ? currentProdType.prodTypeId : undefined}
                                           title={currentProdType ? currentProdType.description : undefined} />
                                        <MiniHelper type={MiniHelperType.TemplateDownload} 
                                                    prodTypeId={currentProdType ? currentProdType.prodTypeId : undefined}
                                                    title={currentProdType ? currentProdType.description : undefined} />
                           </Form.Group>
                           <Form.Group>
                               <List>
                                   <List.Item>
                                       <div className="inline four wide field ttl">{trn("dlgChangePrice.lblProdType")}</div>
                                   </List.Item>
                                   <List.Item>
                                       <Form.Select selection inline
                                                    width={8} className="ddl-prod-type ctls"
                                                    options={prodTypes}
                                                    loading={isLoading}
                                                    disabled={true}
                                                    value={this.props.prodType}
                                                    onChange={(e, data) => this.prodTypeIdChangeHandler(data)}/>
                                   </List.Item>
                               </List>
                               <List>
                                   <List.Item>
                                       <div className="inline four wide field ttl">{trn("dlgChangePrice.lblSizeDimension")}</div>
                                   </List.Item>
                                   <List.Item>
                                       <Form.Select width={8} className="ctls"
                                                    options={sizeDimensions}
                                                    loading={isLoading}
                                                    disabled={true}
                                                    value={this.state.sizeDimension}
                                                    onChange={(e, data) => this.sizeDimensionChangeHandler(data)}/>
                                   </List.Item>
                               </List>
                               {this.isMultiPage(currentProdType)
                                    ? <List className="multi-matrl-qty">
                                          <List.Item>
                                              <div className="inline fifteen wide field ttl">{trn("dlgChangePrice.lblCoverMaterial")}</div>
                                          </List.Item>
                                          <List.Item className="multi-cover-mtrl">
                                              {!this.state.coverMaterialLoading && !this.state.hasCoverMaterial
                                                ? <div className="no-options required"> {translate("dlgChangePrice.lblNoOptions")}</div>
                                                : ""}

                                              {(this.state.coverMaterialLoading || this.state.hasCoverMaterial)
                                              &&
                                                <Form.Select className="ctls cover-mtrl"
                                                     options={coverMaterial}
                                                     loading={this.state.coverMaterialLoading}
                                                     disabled={this.state.coverMaterialLoading}
                                                     value={this.state.coverMaterial}
                                                     onChange={(e, data) => this.coverMaterialChangeHandler(data)} />}

                                                <MiniHelper type={MiniHelperType.MaterialStockInfo}
                                                    version={(wdmSettings.htmlRecordVersion as any as HtmlRecordVersion)}
                                                    materialStockAbbr={this.state.coverMaterial}
                                                    prodTypeId={currentProdType ? currentProdType.prodTypeId : undefined}/>
                                          </List.Item>
                                          <List.Item>
                                              <div className="inline fifteen wide field ttl">{trn("dlgChangePrice.lblPageMaterial")}</div>
                                          </List.Item>
                                          <List.Item className="multi-page-mtrl">
                                                {!this.state.pageMaterialLoading && !this.state.hasPageMaterial
                                                    ? <div className="no-options required"> {translate("dlgChangePrice.lblNoOptions")}</div>
                                                    : ""}

                                                {(this.state.pageMaterialLoading || this.state.hasPageMaterial)
                                                    &&
                                                    <Form.Select className="ctls page-mtrl"
                                                       options={pageMaterials}
                                                       loading={this.state.pageMaterialLoading}
                                                       disabled={this.state.pageMaterialLoading}
                                                       value={this.state.pageMaterial}
                                                       onChange={(e, data) => this.pageMaterialChangeHandler(data)} />}

                                                    <MiniHelper type={MiniHelperType.MaterialStockInfo} 
                                                        version={(wdmSettings.htmlRecordVersion as any as HtmlRecordVersion)}
                                                        materialStockAbbr={this.state.pageMaterial}
                                                        prodTypeId={currentProdType ? currentProdType.prodTypeId : undefined}/>
                                          </List.Item>
                                          <List.Item>
                                              <div className="inline fifteen wide field ttl">{trn("dlgChangePrice.lblPageQty")}</div>
                                          </List.Item>
                                          <List.Item className="multi-page-qty">
                                                {!this.state.multiPageQtyLoading 
                                                    && (!this.state.hasPageQty || !this.state.hasPageMaterial || !this.state.hasCoverMaterial)
                                                        ? <div className="no-options required"> {translate("dlgChangePrice.lblNoOptions")}</div>
                                                        : ""}

                                                {(this.state.multiPageQtyLoading || (this.state.hasPageQty && this.state.hasPageMaterial))
                                                    &&
                                                          <Form.Select className="ctls page-qty"
                                                                       options={multiPageQty}
                                                                       loading={this.state.multiPageQtyLoading}
                                                                       disabled={this.state.multiPageQtyLoading}
                                                                       value={this.state.multiPageQty}
                                                                       onChange={(e, data) => this.pageQtyChangeHandler(data)} />}
                                          </List.Item>
                                          <List.Item>
                                              <div className="inline fifteen wide field ttl">{trn("dlgChangePrice.lblOrderQty")}</div>
                                          </List.Item>
                                          <List.Item  className="multi-order-qty">
                                              {!this.state.multiOrderQtyLoading && 
                                                    (!this.state.hasOrderQty|| !this.state.hasPageMaterial || !this.state.hasCoverMaterial)
                                                ? <div className="no-options required"> {translate("dlgChangePrice.lblNoOptions")}</div>
                                                : ""}

                                               {(this.state.multiOrderQtyLoading || (this.state.hasOrderQty && this.state.hasPageMaterial))
                                               ? this.state.showSelfOrderQty
                                                    ? <Input placeholder='0' value={this.state.multiOrderQty}
                                                            onChange={(event: React.SyntheticEvent<HTMLElement>, data: InputOnChangeData) =>
                                                            this.selfOrderQtyChangeHandler(data)} />
                                                    : <Form.Select width={8} className="ctls order-qty"
                                                           options={multiOrderQty}
                                                           loading={this.state.multiOrderQtyLoading}
                                                           disabled={this.state.multiOrderQtyLoading}
                                                           value={this.state.multiOrderQty}
                                                           onChange={(e, data) => this.orderQtyChangeHandler(data)} /> 
                                                  : ""}

                                                {(this.state.multiOrderQtyLoading || (this.state.hasOrderQty && this.state.hasPageMaterial))
                                                    ? <EnhancedCheckbox popupProps={this.showSelfOrderQtyPopupProps}
                                                            disable={(!this.state.activeShowSelfOrderQty).toString()}
                                                            checked={this.state.showSelfOrderQty}
                                                            onChange={(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
                                                                this.onShowSelfOrderQty(event, data)} />
                                                    : ""}
                                          </List.Item>
                                          <List.Item>
                                                <div className="price">$ {this.state.priceLoading ? "-" : this.state.priceVal}</div>
                                          </List.Item>
                                      </List>
                                    : <List>
                                          <List.Item>
                                              <div className="inline four wide field ttl">{trn("dlgChangePrice.lblMaterial")}</div>
                                          </List.Item>
                                          <List.Item>
                                              {!this.state.materialLoading && !this.state.hasMaterial
                                                ? <div className="no-options required"> {translate("dlgChangePrice.lblNoOptions")}</div>
                                                : ""}

                                              {(this.state.materialLoading || this.state.hasMaterial)
                                                && <Form.Select width={8} className="ctls"
                                                    options={materials}
                                                    loading={this.state.materialLoading}
                                                    disabled={this.state.materialLoading}
                                                    value={this.state.material}
                                                    onChange={(e, data) => this.materialChangeHandler(data)} />}
                                          </List.Item>
                                      </List>}

                               {this.isMultiPage(currentProdType) ? ""
                                   :<List>
                                        <List.Item>
                                            <div className="inline four wide field ttl">{trn("dlgChangePrice.lblSides")}</div>
                                        </List.Item>
                                        <List.Item>
                                            <Form.Select width={8} className="ctls"
                                                         options={this.sides}
                                                         loading={isLoading}
                                                         disabled={true}
                                                         value={this.props.sideCount || 2} />
                                        </List.Item>
                                </List>}
                               {this.isMultiPage(currentProdType) ? ""
                                    :<List>
                                        <List.Item>
                                            <div className="inline four wide field ttl">{trn("dlgChangePrice.lblQty")}</div>
                                        </List.Item>
                                        <List.Item className="qty">
                                                    {this.state.showNumeric
                                                        ? <NumericInput min={this.state.numericMin} step={this.state.numericStep} value={this.state.qty} 
                                                                    onChange={(value: number | null, stringValue: string, input: HTMLInputElement) => this.qtyNumericChangeHandler(value, stringValue, input)}
                                                                    onBlur={this.onBlurNumeric}
                                                                    onKeyDown={this.onKeyDownNumeric} />
                                                        : <Form.Select className="ctls qty"
                                                            options={qties}
                                                            loading={isLoading}
                                                            disabled={isLoading || !this.state.hasMaterial}
                                                            value={this.state.qty}
                                                            onChange={(e, data) => this.qtyChangeHandler(data)} />}
                                               
                                                    <EnhancedCheckbox popupProps={this.showNumericPopupProps} disabled={!this.state.activeShowNumeric}
                                                            checked={this.state.showNumeric}
                                                            onChange={(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
                                                                this.onShowNumericSteper(event, data)} />
                                        </List.Item>
                                        <List.Item>
                                            <div className="price">$ {this.state.priceLoading ? "-" : this.state.priceVal}</div>
                                        </List.Item>
                                    </List>}

                               <List>
                                   <List.Item>
                                       <div className="inline four wide field ttl">
                                           {trn("dlgChangePrice.lblOptions")}
                                       </div>
                                   </List.Item>
                                   <List.Item>
                                       {prodTypeOptns.length === 0 
                                            ? <div className="no-options">{!isOptionsLoading && translate("dlgChangePrice.lblNoOptions")}
                                                    {isOptionsLoading && <Loader size="mini" active/>}</div>
                                            : prodTypeOptns.map((optn: any, index: any) => {
                                                    const currentOptnDtl = optn.prodTypeOptnDtl 
                                                        ? optn.prodTypeOptnDtl.find((val: any) => currentOptnDtls.indexOf(val.prodTypeOptnDtlAbbr) >= 0)
                                                        : "";
                                                    let imageSourceUrl = currentOptnDtl ? currentOptnDtl.miniGraphicUrl : "";
                                                    if (imageSourceUrl) imageSourceUrl = imageSourceUrl.split("~").join("");

                                                    if (index === 0 && !isOptionsLoading && prodTypeOptns.length === 0)
                                                        return translate("dlgChangePrice.lblNoOptions");
                                                    else if (index === 0 && isOptionsLoading)
                                                        return <Loader key={index} size="mini" active inline/>;
                                                    else {
                                                        return <div key={index}>
                                                            <Form.Select selection inline
                                                                width={8} className="ctls"
                                                                options={this.getOptnDtlsData(optn.prodTypeOptnDtl, index)}
                                                                loading={isLoading || this.state.materialLoading}
                                                                disabled={isLoading || this.state.materialLoading}
                                                                value={this.state.prodTypeOptnDtlAbbrs && (index + ";" + this.state.prodTypeOptnDtlAbbrs[index])}
                                                                onChange={(e, data) => this.optnChangeHandler(data.value)} />

                                                            {currentOptnDtls.length > 0 &&
                                                                <div className="img-cont">
                                                                    <Image inline src={imageSourceUrl} />
                                                                </div>}
                                                        </div>;
                                                    }
                                                })
                                            }
                                   </List.Item>
                                   <List.Item>
                                       <div className="price">$ {priceLoading ? "-" : this.state.optnPriceVal}</div>
                                   </List.Item>
                                   <List.Item className="total-price">
                                       <div className="label">{translate("dlgChangePrice.lblTotalPrice")}</div>
                                       <div className="price">$ {priceLoading ? "-" : this.state.totalPriceVal}</div>
                                   </List.Item>
                               </List>
                           </Form.Group>
                           <Message error header={trn("dlgChangePrice.msgErrorHeader")} conten={this.state.errorMessage}/>
                       </Form>
                   </Modal.Content>
                   <Modal.Actions>
                       <EnhancedButton primary className="wdm-btn large"
                                       loading={applyBtnLoadingState }
                                       disabled={applyBtnDisabled}
                                       onClick={(e: any) => this.btnApplyPriceClickHandler()}>
                           {trn("dlgChangePrice.lblBtnOk")}
                       </EnhancedButton>
                       <EnhancedButton secondary className="wdm-btn large"
                                       onClick={(e: any) => this.openDialogHandler(false, false)}>
                           {trn("dlgChangePrice.lblBtnCancel")}
                       </EnhancedButton>
                   </Modal.Actions>
               </Modal>;

    }
}