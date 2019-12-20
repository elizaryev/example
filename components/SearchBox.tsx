import * as React from 'react';
import { Search, SearchProps, SearchResultData } from "semantic-ui-react";
import * as _ from "lodash";
import { observer } from 'mobx-react';

export interface ISearchItem {
    key: string,
    title: string,
    data: any;
}

export interface ISearchBoxProps {
    source?: ISearchItem[],
    onEnterKeyPress?(value?: string): void;
    onResultSelect?(value?: string): void;
    onSearchChange?(result: ISearchItem[]): void;
    placeholder?: string;
}

export interface ISearchBoxState {
    isLoading: boolean,
    results: ISearchItem[],
    searchValue?: string;
}


@observer
export class SearchBox extends React.Component<ISearchBoxProps, ISearchBoxState> {
    constructor(props: any) {
        super(props);
        this.state = {
            isLoading: false,
            results: [],
            searchValue: ""
        };
    }

    componentWillMount() {
        this.resetComponent();
    }

    resetComponent = () =>
        this.setState({ isLoading: false, results: [], searchValue: "" });

    handleSearchChange = (e: React.MouseEvent<HTMLElement>, searchValue: SearchProps) => {

        this.setState({ isLoading: true, searchValue: searchValue.value });
        setTimeout(() => {

            if (this.state.searchValue == undefined || this.state.searchValue.length < 1) this.resetComponent();

            const re = new RegExp(_.escapeRegExp(this.state.searchValue), "i");
            const isMatch = (result: ISearchItem) => re.test((result as ISearchItem).title);

            const filteredResult = _.filter(this.props.source, isMatch);

            if (this.props.onSearchChange) {
                this.props.onSearchChange(filteredResult);
            }

            this.setState({
                isLoading: false,
                results: filteredResult
            });
        }, 500);
    };

    handleResultSelect = (e: React.MouseEvent<HTMLElement>, resultSearch: SearchResultData) => {
        this.setState({ searchValue: resultSearch.result.title });
        if (this.props.onResultSelect)
            this.props.onResultSelect(resultSearch.result.title);
    };

    render() {
        return <div>
            <Search className={"search-tag wdm"}
                    input={{ icon: 'tag', iconPosition: 'left' }}
                    type="text"
                    size="small"
                    loading={this.state.isLoading}
                    onResultSelect={this.handleResultSelect}
                    onSearchChange={_.debounce(this.handleSearchChange, 500, { leading: true })}
                    results={this.state.results}
                    value={this.state.searchValue}
                    placeholder={this.props.placeholder}

                    onKeyPress={(ev: any) => {
                    if (ev.key === 'Enter') {
                        if (this.props.onEnterKeyPress)
                            this.props.onEnterKeyPress(this.state.searchValue);
                        ev.preventDefault();
                    }
                }}
                />
        </div>;
    }
}