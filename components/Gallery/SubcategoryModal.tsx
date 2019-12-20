import * as React from 'react';
import { Icon, Modal, Grid, Input, Button, InputOnChangeData, Dropdown, Label, Transition, List, Segment } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { ILocalizeActions } from '../../store/Localize';
import { ISubCategory, SubCategory, ISubCategoryActions, IIconDropDown } from "../../store/model/SubCategory";
import { ypFontStyleNameList, YouPrintIcon01List, YouPrintIcon02List, YouPrintIcon03List } from '../../constants/types';
import { Publishing } from "../../components/Gallery/Publishing"; 

interface ISubcategoryModalProps {
    wdmCategoryId: string;
    parent: Publishing;
    onSubcategorySaved?(wdmCategoryId: string, publishing: Publishing): void;
    localize?: ILocalizeActions;
}

interface ISubcategoryModalState {
    showWindow: boolean,
    titleValue: string;
    iconStylesNameList: IIconDropDown[];
    iconList: string[];
    iconCountListRow: number;
    iconCountListColumn: number;
    labelFont: boolean;
    labelIcon: boolean;
    labelTitle: boolean;
    textFontStyleDropdown: string;
    selectIcon: string;
    savingSpinner: boolean;
}

@inject("localize")
@observer
export class SubcategoryModal extends React.Component<ISubcategoryModalProps, ISubcategoryModalState> {

    constructor(props: any) {
        super(props);
        this.state = {
            showWindow: false,
            titleValue: "",
            iconStylesNameList: [],
            iconList: [],
            iconCountListColumn: 10,
            iconCountListRow: 0,
            labelFont: false,
            labelIcon: false,
            labelTitle: false,
            textFontStyleDropdown: "Select font style",
            selectIcon: "",
            savingSpinner: false
        };
    }

    private _isMounted: boolean = false;

    private translate(key: string): string | React.ReactElement<any> {
        return this.props.localize!.trn(key, localStorage.getItem("YPUICulture")!);
    }

    public componentWillMount() {

        let iconStyleNameListVal: IIconDropDown[] = [];
        ypFontStyleNameList.map((icon, index) => {
            iconStyleNameListVal.push(({
                key: index.toString(),
                text: icon,
                value: icon
            } as IIconDropDown));
        });
        this.setState({
            iconStylesNameList: iconStyleNameListVal,
            textFontStyleDropdown: this.translate('scm.selectFontStyleText').toString()
        });
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }
    
    private openDialogHandler(isOpen: boolean = true) {

        if (!isOpen) {
            if (this._isMounted)
                this.setState({ savingSpinner: false });
        }

        if (this._isMounted)
            this.setState({ showWindow: isOpen });
    }

    private renderTriggerElement() {
        return <Button className="wdm-btn large gray"
                       onClick={(event, data) => { this.openDialogHandler(true); }}>
                   <List horizontal>
                       <List.Item>
                           <Icon className="icon-YP2_plus"/>
                       </List.Item>
                       <List.Item className="gallery-item-publish-btns-title">
                           {this.translate('scm.newTitle').toString()}
                       </List.Item>
                   </List>
               </Button>;
    }

    private handleClickSave() {
        if (this.state.titleValue === '' && this.state.selectIcon === '') {
            if (this._isMounted)
                this.setState({ labelTitle: true, labelIcon: true });
            return;
        }
        
        if (this.state.titleValue === '') {
            if (this._isMounted)
                this.setState({ labelTitle: true});
            return;
        }
        if (this.state.selectIcon === '') {
            if (this._isMounted)
                this.setState({ labelIcon: true});
            return;
        }

        let subcategory: ISubCategory = ((SubCategory.create({
            wdmCategoryId: this.props.wdmCategoryId,
            wdmSubCategoryId: this.state.titleValue,
            abbrText: this.state.titleValue,
            description:  this.state.titleValue,
            iconClass: this.state.selectIcon
        })) as any);

        let self = this;
        if (this._isMounted)
            this.setState({ savingSpinner: true });
        (subcategory  as any as ISubCategoryActions).save().then((result) => {
            if (self.props.onSubcategorySaved) {
                self.props.onSubcategorySaved(this.props.wdmCategoryId, this.props.parent);
                this.props.parent.setState({ subCategoryLoaded: true });
            }
            if (this._isMounted)
                self.setState({ savingSpinner: false });
            self.openDialogHandler(false);
        });
    }

    onSelectFontStyle = (e: any, data: any) => {
        let selectIconList: string[] = [];
        switch (data.value) {
            case "YouPrint_Icon_01":
                selectIconList = YouPrintIcon01List;
                if (this._isMounted)
                    this.setState({ iconList: YouPrintIcon01List });
                break;
            case "YouPrint_Icon_02":
                selectIconList = YouPrintIcon01List;
                if (this._isMounted)
                    this.setState({ iconList: YouPrintIcon02List });
                break;
            case "YouPrint_Icon_03":
                selectIconList = YouPrintIcon01List;
                if (this._isMounted)
                    this.setState({ iconList: YouPrintIcon03List });
                break;
        }
        
        let countListRow = Math.ceil(selectIconList.length / this.state.iconCountListColumn);
        if (selectIconList.length % this.state.iconCountListColumn > 0)
            countListRow++;

        if (this._isMounted) {
            this.setState({ iconCountListRow: countListRow, selectIcon: "" });
            this.setState({ textFontStyleDropdown: data.value, labelFont: false });
        }
    }

    private changeTitleHandler(data: InputOnChangeData) {
        if (this._isMounted) {
            this.setState({ titleValue: data.value, labelTitle: false });
        }
    }

    private onIconClick(iconName: string) {
        let index = this.state.iconList.findIndex(fi => fi === iconName)
        if (this._isMounted) {
            this.setState({ selectIcon: this.state.iconList[index], labelIcon: false });
        }
    }

    private renderIconTable() {

        let result: JSX.Element[] = [];
        let currIconIndex = 0;
        for (let currRow = 1; currRow <= this.state.iconCountListRow; currRow++) {

            let items = this.state.iconList
                .slice(currIconIndex, (currRow * this.state.iconCountListColumn)-1)
                .map((icon, index) => {
                    let item = <List.Item key={index}>
                                <Icon key={index} className={icon + " gallery-item-icon-subcategory"}
                                    onClick={() => this.onIconClick(icon) }
                                     size="big"/>
                    </List.Item>;
                    return item;
                });
            currIconIndex = currRow * this.state.iconCountListColumn;

            result.push(<List.Item key={`list-icon-${currRow}`}><List horizontal>{items}</List></List.Item>);
        }
        return result;
    }

    public render() {

        return <Modal trigger={this.renderTriggerElement()} open={this.state.showWindow}
                      closeOnDimmerClick={true} closeIcon={true} size="large"
                      className="gallery-item-new-subcategory-wnd"
                      onClose={(e) => this.openDialogHandler(false)}>
                   <Modal.Header><Icon className="icon-YP1_book"/> 
                       {this.translate('scm.newSubCategoryTitle').toString()}
                    </Modal.Header>
                   <Modal.Content>
                       <Grid>
                           <Grid.Row>
                               <Grid.Column width={2} className="gallery-item-wdm-1">
                                    {this.translate('scm.chooseFontStyleTitle').toString()}
                               </Grid.Column>
                               <Grid.Column width={14}>
                                    <Dropdown button className='icon  published-dropdown-icon-list' floating labeled
                                             onChange={this.onSelectFontStyle}
                                             options={this.state.iconStylesNameList}
                                             search
                                             size="tiny"
                                             text={this.state.textFontStyleDropdown}/>
                               </Grid.Column>
                            </Grid.Row>
                           <Grid.Row  className="gallery-item-row-no-padding">
                               <Grid.Column width={2} className="gallery-item-wdm-1">
                                    {this.translate('scm.choiceIconTitle').toString()}
                               </Grid.Column>
                               <Grid.Column>
                                    <Segment className="gallery-item-icon-segment">
                                        <List>
                                            {this.renderIconTable()}
                                        </List>
                                    </Segment>
                               </Grid.Column></Grid.Row>
                           <Grid.Row className="gallery-item-row-no-padding">
                                <Grid.Column width={2} className="gallery-item-wdm-1">
                                   {this.translate('scm.titleText').toString()}:
                               </Grid.Column>
                               <Grid.Column width={14}>
                                <List horizontal className="gallery-item-select-icon-list">
                                    <List.Item className="gallery-item-select-icon">
                                        <Icon className={this.state.selectIcon} size="big" />
                                    </List.Item>
                                    <List.Item>
                                        <Input value={this.state.titleValue} className="gallery-item-title-selected-icon"
                                               onChange={(event: React.SyntheticEvent<HTMLElement>,
                                            data: InputOnChangeData) => this.changeTitleHandler(data)} />
                                    </List.Item>
                                </List>
                               </Grid.Column>
                            </Grid.Row>
                            <Grid.Row className="">
                                <Grid.Column>
                                    <Transition visible={this.state.labelTitle} duration={1} animation={"fade"}>
                                        <Label basic color="red">
                                            {this.translate('scm.enterTitleText').toString()}
                                        </Label>
                                    </Transition>
                                   <Transition visible={this.state.labelIcon} duration={1} animation={"fade"}>
                                       <Label basic color="red">
                                            {this.translate('scm.errChooseFontStyleTitle').toString()}
                                       </Label>
                                    </Transition>
                                </Grid.Column>
                           </Grid.Row>
                       </Grid>
                   </Modal.Content>
                   <Modal.Actions>
                       <Button content={this.translate('scm.cancelTitle').toString()} className="d-gray-btn-large"
                               disabled={this.state.savingSpinner}
                            onClick={(e) => this.openDialogHandler(false)}/>
                       <Button icon="save" className="green-btn-large" loading={this.state.savingSpinner}
                            disabled={this.state.savingSpinner}
                            content={this.translate('scm.saveTitle').toString()} 
                            onClick={(e) =>this.handleClickSave()}/>
                   </Modal.Actions>
               </Modal>;
    }
}

