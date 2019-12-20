import * as React from "react";
import { ILayer, LayerObjectType, ILayerActions, getLayerName } from "../store/Layer";
import { observer, inject } from "mobx-react";
import { IWITDoc, IWITDocActions, IWITDocSettings, ILocalizeStore, ILocalizeActions, ModalDialogManager } from "../store";
import { Dropdown, DropdownProps, Button, Input, Divider, Icon, SemanticICONS, InputOnChangeData} from "semantic-ui-react";
import { TextLayerEditor } from "./TextLayerEditor";
import { IFontLibrary } from "../store/FontLibrary";
import EnhancedButton from "./EnhancedButton";
import { DeleteBackgroundAction } from "./actions";

interface ILayersDropdownProps {
    selection: ILayer[],
    witdoc?: IWITDoc & IWITDocActions,
    docSettings?: IWITDocSettings,
    textEditor?: TextLayerEditor,
    fontLibrary?: IFontLibrary;
    modalDialogManager?:ModalDialogManager;
}

@inject("localize", "witdoc", "docSettings", "modalDialogManager")
@observer
export default class LayersDropdown extends React.Component<ILayersDropdownProps & ILocalizeStore> {    

    renderValue(isSelectionLocked:boolean) {
        const { selection } = this.props;
        const { translate, trn } = this.props.localize!;
        const selLength = this.props.selection.length;
        let selectedLayerName = "";

        if (selection.length > 0) {
            selectedLayerName = getLayerName(selection[0]);
        }
        return <div className="cont" >            
                   <Input disabled={selLength === 0 || selLength > 1}
                          placeholder={selLength === 1
                ? selectedLayerName
                : trn(selLength === 0 ? 'ddLayers.lblNoSelection' : 'ddLayers.lblMultiSelection')}
                value={selLength === 1 ? selectedLayerName : ''}
                className={selection.length === 1 ? "sel" : ""}
                onChange={(event: React.SyntheticEvent<HTMLInputElement>,
                    data: InputOnChangeData) => this.renameSelectedLayer(event, data)} />
                    {selection.length === 1 ? <Icon className={this.getIconClassByLayerType(selection[0].type)} /> : null}
                    {selection.length > 0 && <div className="ddlayer-btns"
                        onMouseDown={(e) => e.preventDefault()}>
                       {/*<Button.Group size='mini'>
                    <Button active={selection.length > 0} icon={isSelectionLocked ? 'lock' : 'unlock'} disabled={selection.length === 0}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => this.lockUnlockLayers(e, selection, !isSelectionLocked)} />
                    <Button icon='remove' disabled={selection.length === 0}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => this.removeLayers(e, selection)} />
                </Button.Group>*/}
                       <EnhancedButton basic compact ypIcon={`YP3_${isSelectionLocked ? "lock" : "unlock"}`}
                                       className={`wdm-btn-simple ${isSelectionLocked ? "unlck" : ""}`}                                       
                                       popup={translate(isSelectionLocked ? "propwin.ttlUnlockLayer" : "propwin.ttlLockLayer")}
                                       onClick={(e) => this.lockUnlockLayers(e, selection)} />
                       <EnhancedButton basic compact ypIcon="YP3_trash"
                                       className="wdm-btn-simple del"
                                       popup={translate("propwin.ttlDelete")}
                                       onClick={(e) => this.removeLayers(e, selection)} />
                   </div>}
               </div>;
    }

    renameSelectedLayer(event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) {
        event.stopPropagation();
        // Max name length is 150 characters
        let val = data.value;
        if (val.length > 150) {
            val = val.substr(0, 150);
        }
        
        (this.props.selection[0] as any as ILayerActions).setName(val);        
    }

    lockUnlockLayers(e: React.MouseEvent<HTMLButtonElement>, layers: ILayer[], value?: boolean) {
        e.preventDefault();
        e.stopPropagation();
        // Set or toggle layer's locked state
        layers.forEach((layer) => (layer as any as ILayerActions).setLocked(value === undefined ? !layer.locked : value));
    }

    removeLayers(e: React.MouseEvent<HTMLButtonElement>, layers: ILayer[]) {
        e.preventDefault();
        e.stopPropagation();

        const { witdoc, localize, modalDialogManager } = this.props;

        if (layers.length === 1 && layers[0].isBackground) {
            const deleteBackgroundAction = new DeleteBackgroundAction(witdoc!, localize!, modalDialogManager!);
            deleteBackgroundAction.execute();
            return;
        }

        // Set or toggle layer's locked state
        (this.props.witdoc as IWITDocActions).removeLayers(layers);
    }

    selectLayerHandler(e: React.SyntheticEvent<HTMLElement>, data: DropdownProps) {
        (this.props.witdoc as any as IWITDocActions).changeSelection([String(data.value)]);
    }

    groupUngroupLayers(groupFlag: boolean) {
        const docAction = (this.props.witdoc as any as IWITDocActions);

        if (groupFlag) {            
            docAction.changeSelection([docAction.groupLayers(this.props.selection).uid]);
        } else {
            const ungroupedLayers = docAction.ungroupLayer(this.props.selection[0]);
            if (ungroupedLayers) {
                docAction.changeSelection(ungroupedLayers.map((layer) => layer.uid));
            }
        }
    }

    getIconClassByLayerType(layerType?: string) {
        let iconClass: string = "";

        switch (layerType) {
        case LayerObjectType.TEXT:
            iconClass = 'icon-YP1_text';
            break;
        case LayerObjectType.IMAGE:
                iconClass = 'icon-YP2_graphic';
            break;
        case LayerObjectType.GROUP:
                iconClass = 'icon-YP2_group';
            break;
        case LayerObjectType.VECTOR:
        default:
                iconClass = 'icon-YP2_svg';
            break;
        }
        return iconClass;
    }

    renderGroupChildren(layer: ILayer) {
        return <div className="ddlayer-group-item">{layer.children!.map((sublayer, index) => {
            return <div key={index} className="ddlayer-group-subitem">
                       <Icon className={this.getIconClassByLayerType(sublayer.type)}/>&nbsp;&nbsp;
                       <span>{getLayerName(sublayer)}</span>
                   </div>;
        }).reverse()}
        </div>;
    }

    render() {
        const { selection } = this.props;
        const {translate} = this.props.localize!;
        const renderedItems = this.props.witdoc!.selectedPage!.selectedCanvas!.layers.map((value) => {            
            let layer = value;
            const layerIconClass = this.getIconClassByLayerType(layer.type);
            const layerName = getLayerName(layer);

            return {
                text: layerName,
                value: layer.uid,
                content:<div>
                    <div className="ddlayer-item">
                             <Icon className={layerIconClass}/>&nbsp;&nbsp;
                             <span>{layerName}</span>&nbsp;&nbsp;
                             <div onMouseDown={(e) => e.preventDefault()} className="ddlayer-sub-item">
                                 <EnhancedButton basic compact ypIcon={`YP3_${layer.locked || layer.isBackground ? "lock" : "unlock"}`}
                                                className={`wdm-btn-simple ${layer.locked || layer.isBackground ? "unlck" : ""}`}
                                                 popup={translate(layer.locked || layer.isBackground ? "propwin.ttlUnlockLayer" : "propwin.ttlLockLayer")}
                                                 onClick={(e) => this.lockUnlockLayers(e, [layer])} />
                                 <EnhancedButton basic compact ypIcon="YP3_trash"
                                                 className="wdm-btn-simple del"
                                                 popup={translate("propwin.ttlDelete")}
                                                 onClick={(e) => this.removeLayers(e, [layer])} />
                             </div>                             
                    </div>
                    { layer.type === LayerObjectType.GROUP && this.renderGroupChildren(layer) }
                </div>,
                selected: this.props.selection.indexOf(layer) >= 0
            };
        }).reverse();

        let isSelectionLocked = selection.length > 0;
        let isSelectionContainsGroup = false;
        let isSelectionGroup = selection.length == 1 && selection[0].type === LayerObjectType.GROUP;
        selection.forEach((layer) => {
            isSelectionLocked = isSelectionLocked && (layer.locked === true || layer.isBackground);
            isSelectionContainsGroup = isSelectionContainsGroup || layer.type === LayerObjectType.GROUP;
        });

        return <div className="ddlayer">
            {/*<div className="ddlayer-btns">
                <Button icon={isSelectionContainsGroup ? 'object ungroup' : 'object group'} disabled={(isSelectionContainsGroup && selection.length > 1) || (!isSelectionContainsGroup && selection.length <= 1)}
                    size='mini'
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => this.groupUngroupLayers(!isSelectionContainsGroup)} />
           </div>*/}
            <div className="ttl-layers">{translate("ddLayers.title")}</div>
            <Dropdown value={[]} trigger={this.renderValue(isSelectionLocked)}
                multiple={true}
                scrolling
                onChange={(e: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => this.selectLayerHandler(e, data)}
                options={renderedItems} compact />
        </div>;
    }
}