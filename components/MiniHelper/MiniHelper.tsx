import * as React from "react";
import { inject, observer } from 'mobx-react';
import * as Logger from "js-logger";
import * as _ from "lodash";
import { Popup, PopupProps, Grid, Loader, Segment, Dimmer } from "semantic-ui-react";
import "../../css/MiniHelper.less";
import { ILocalizeActions } from "../../store/Localize";
import EnhancedImage from "../../components/Enhanced/EnhancedImage"
import { IMiniHelper, MiniHelperModel, IMiniHelperActions, IProdTypeZip } from "../../store/MiniHelper"
import { HtmlRecordVersion, MiniHelperType } from "../../constants/enums";
import { sanitize } from 'dompurify'

export interface IMiniHelperProps {
    localize?: ILocalizeActions,
    activeDate?: string,
    editMode?: boolean,
    useMasterVersion?: boolean,
    version?: HtmlRecordVersion,
    className?: string,
    isMultiPage?: boolean,
    showAllMaterials?: boolean,
    text?: string,
    textOff?: boolean;
    title?: string,
    materialStockAbbr?: string,
    materialStock?: string,
    sizeDimension?: string,
    prodTypeId?: string,
    uniqueKey?: string,
    type?: MiniHelperType;
}

interface IMiniHelperState {
    imgSrc?: string;
    text?: string;
    data?: MiniHelperModel;
    popupProps: PopupProps | undefined;
    showPopup: boolean;
}

@inject("localize")
@observer
export default class MiniHelper extends React.Component<IMiniHelperProps, IMiniHelperState> {

    constructor(props: IMiniHelperProps) {
        super(props);
        this.state = {
            showPopup: false,
            popupProps: { flowing: true, hoverable: true, position: "bottom center", className: "mhPopup", basic: true, on: "hover", open: false },
            data: MiniHelperModel.create()
        };
    }

    private _isMounted: boolean = false;
    private updateChildrenProp: boolean = true;
    private alternativeSizeRemarkTitle: string = "";

    componentWillMount() {
        
        const { trn } = this.props.localize!;
        const text = (this.props.textOff) ? "" : (this.props.text) ? this.props.text : trn(`miniHelper.${this.props.type}Text`);

        this.alternativeSizeRemarkTitle = trn("miniHelper.alternativeSizeRemarkTitle");

        const self = this;
        // get and set data for each type
        switch (this.props.type) {
            case MiniHelperType.MaterialStockInfo:
                this.setState({ imgSrc: "MiniHelp_Mat_Stock.png", text: text });
                // get data from DB
                if (this.state.data && (!this.state.data.isLoaded || !this.state.data.isLoading)) {
                    this.setMaterialInfo();
                }
                break;
            case MiniHelperType.DaysNeeded:
                this.setState({ imgSrc: "MiniHelp_Days_Needed.png", text: text });
                if (this.state.data && (!this.state.data.isLoaded || !this.state.data.isLoading)) {
                    this.setDaysNeeded();
                }
                break;
            case MiniHelperType.TemplateDownload:
                this.setState({ imgSrc: "MiniHelp_Temp_Download.png", text: text });
                if (this.state.data && (!this.state.data.isLoaded || !this.state.data.isLoading)) {
                    this.setTemplateDownloadList();
                }
                break;
        }
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentWillUpdate(nextProps: any, nextState: any) {
        // change material
        if (this.props.type === MiniHelperType.MaterialStockInfo && nextProps && this.props && this.props.materialStockAbbr !== nextProps.materialStockAbbr ) {
            this.updateChildrenProp = true;
            this.setMaterialInfo(nextProps.materialStockAbbr);
        }
    }

    private setTemplateDownloadList() {
        const self = this;
        const dataAction = (this.state.data as any as IMiniHelperActions);
        this.state.popupProps.children = <Dimmer active inverted>
                                             <Loader inverted size="small"/>
                                         </Dimmer>;
        dataAction.getTemplateDownloadInfo(this.props.prodTypeId, this.alternativeSizeRemarkTitle)
            .then((prodTypeZipInfo: IProdTypeZip[]) => {
                
                if (self.state.popupProps) {
                    self.state.popupProps.children = self.getTemplateDownloadPopupContent(prodTypeZipInfo);
                    if (self.updateChildrenProp) {
                        self.updateChildrenProp = false;
                        if (self._isMounted)
                            self.forceUpdate();
                    }
                }
            });
    }

    private setDaysNeeded() {
        const self = this;
        const dataAction = (this.state.data as any as IMiniHelperActions);
        this.state.popupProps.children = <Dimmer active inverted>
                                             <Loader inverted size="small" />
                                         </Dimmer>;
        dataAction.getDaysNeededInfo(this.props.prodTypeId, this.props.activeDate, this.props.version)
            .then((helperData: IMiniHelper) => {
                dataAction.setData(helperData.html, helperData.width, helperData.height);

                if (self.state.popupProps) {
                    self.state.popupProps.children = self.getDaysNeededPopupContent();
                    if (self.updateChildrenProp) {
                        self.updateChildrenProp = false;
                        self.forceUpdate();
                    }
                }
            });
    }

    private setMaterialInfo(materialStockAbbr?: string) {
        const self = this;
        const dataAction = (this.state.data as any as IMiniHelperActions);

        if (self.updateChildrenProp)
            this.state.popupProps.children = <Dimmer active inverted>
                                                 <Loader inverted size="small" />
                                             </Dimmer>;

        dataAction.getMaterialInfo(this.props.prodTypeId,
                this.props.activeDate,
                this.props.version,
                materialStockAbbr ? materialStockAbbr : this.props.materialStockAbbr,
                this.props.isMultiPage)
            .then((materialData: IMiniHelper[]) => {
                if (self.state.popupProps) {
                    self.state.popupProps.children = self.getMaterialPopupContent(materialData);
                    if (self.updateChildrenProp) {
                        self.updateChildrenProp = false;
                        if (self._isMounted)
                            self.forceUpdate();
                    }
                }
            });
    }

    private getMaterialPopupContent(materialData: IMiniHelper[]) {
        if (materialData.length === 0) 
            return <div onMouseLeave={this.onMouseLeave}></div>;

        if (this.props.isMultiPage) {
            let currentMPType = "";
            let concatBlock = materialData.map((data: IMiniHelper, index) => {

                let multiPageTypeDescr: JSX.Element | undefined = undefined;

                if (currentMPType !== data.multiPageType && data.multiPageType) {
                    currentMPType = data.multiPageType;
                    multiPageTypeDescr = <div className="mhMPMaterialTitle" style={{
                        width: `${data.width === 0 ? 100 : data.width}${data.width === 0 ? "%" : "px"}`,
                        height: `${data.height === 0 ? 100 : data.height}${data.height === 0 ? "%" : "px"}`
                    }}>
                                             {data.multiPageTypeDescr}
                                         </div>;
                }

                return <div>
                           {multiPageTypeDescr ? multiPageTypeDescr : ""}
                           <div style={{
                        width: `${data.width === 0 ? 100 : data.width}${data.width === 0 ? "%" : "px"}`,
                        height: `${data.height === 0 ? 100 : data.height}${data.height === 0 ? "%" : "px"}`
                    }}
                                dangerouslySetInnerHTML={{ __html: sanitize(data.html ? data.html : "") }} />
                       </div>;
            });

            return <div onMouseLeave={this.onMouseLeave}>
                       <div className="flyoutTitle">{this.props.title}</div>
                       {concatBlock}
                   </div>;
        } else {
            const data: IMiniHelper = materialData[0];
            return <div onMouseLeave={this.onMouseLeave}>
                       <div className="flyoutTitle">{this.props.title}</div>
                       <div style={{
                    width: `${data.width === 0 ? 100 : data.width}${data.width === 0 ? "%" : "px"}`,
                    height: `${data.height === 0 ? 100 : data.height}${data.height === 0 ? "%" : "px"}`
                }}
                            dangerouslySetInnerHTML={{ __html: sanitize(data.html ? data.html : "") }} />
                   </div>;
        }
    }

    private getTemplateDownloadPopupContent(prodTypeZipInfo: IProdTypeZip[]) {
        // table
        const { trn } = this.props.localize!;

        return <div className="prodTypeZip" onMouseLeave={this.onMouseLeave}>
                   <div className="flyoutTitle">{this.props.title}</div>
                   <Grid>
                       <Grid.Row className="header">
                           <Grid.Column>{trn("miniHelper.header-size")}</Grid.Column>
                           <Grid.Column>{trn("miniHelper.header-processing")}</Grid.Column>
                           <Grid.Column>{trn("miniHelper.header-cutting-size")}</Grid.Column>
                           <Grid.Column>{trn("miniHelper.header-bleed-size")}</Grid.Column>
                           <Grid.Column>{trn("miniHelper.header-safety-area-size")}</Grid.Column>
                           <Grid.Column>{trn("miniHelper.header-dot-bleeding-size")}</Grid.Column>
                           <Grid.Column className="download">{trn("miniHelper.header-download")}</Grid.Column>
                       </Grid.Row>
                       {prodTypeZipInfo.map((zipData: IProdTypeZip, index) => {

                           const downloadUrlArr = zipData.downloadUrl ? zipData.downloadUrl.split('/') : [];    
                           // todo: add Fingerprint.Tag(htmlText)  for hreaf
                           const downloadHref = <a href={zipData.downloadUrl}>{downloadUrlArr.length > 0
                                ? downloadUrlArr[downloadUrlArr.length - 1]
                                : "" }</a>;

                            return <Grid.Row key={index} className={(index % 2) > 0 ? "downld-even" : "downld-odd" }>
                                      <Grid.Column key={`sr-${index}`}>{zipData.sizeRemark}</Grid.Column>
                                      <Grid.Column key={`or-${index}`}>{zipData.optnRemark}</Grid.Column>
                                      <Grid.Column key={`cs-${index}`}>{zipData.cuttingSize}</Grid.Column>
                                      <Grid.Column key={`bs-${index}`}>{zipData.bleedingSize}</Grid.Column>
                                      <Grid.Column key={`ss-${index}`}>{zipData.safeSize}</Grid.Column>
                                      <Grid.Column key={`bps-${index}`}>{zipData.bleedingPixelSize}</Grid.Column>
                                      <Grid.Column className="download" key={`du-${index}`}>{downloadHref}</Grid.Column>
                            </Grid.Row>;
                       })}
                   </Grid>
               </div>;
    }

    private getDaysNeededPopupContent() {
        if (this.state.data && this.state.data.isLoaded) {
            return <div onMouseLeave={this.onMouseLeave}>
                       <div className="flyoutTitle">{this.props.title}</div>
                       <div style={{ width: `${this.state.data.width === 0 ? 100 : this.state.data.width}${this.state.data.width === 0 ? "%" : "px"}`,
                                     height: `${this.state.data.height === 0 ? 100 : this.state.data.height}${this.state.data.height === 0 ? "%" : "px"}` }}
                            dangerouslySetInnerHTML={{ __html: sanitize(this.state.data.html ? this.state.data.html : "") }} />
                   </div>;
        } else
            return <div></div>;
    }
  
    onMouseEnter = (e: any) => {
        this.setState({ showPopup: true });
        if (this.state.popupProps) {
            this.state.popupProps.open = true;
        }
    }

    onMouseLeave = (e: any) => {
        this.setState({ showPopup: false });
        if (this.state.popupProps)
            this.state.popupProps.open = false;
    }

    render() {

        return <div className="miniHelper" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
            <EnhancedImage src={require(`../../assets/${this.state.imgSrc}`)}
                className="enh-img"
                popupProps={this.state.popupProps} />
            <div className="info-text">
                    {this.state.text}
            </div>
        </div>;
    }
}
