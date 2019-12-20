import * as React from 'react';

/**
* MasonryLayout component
*/
export interface IMasonryLayoutProps {
    key?: number,
    columns: number,
    gap: number,
    children?: JSX.Element[] | undefined[];
    sortBySides?: boolean;
}

export interface IMasonryLayoutState {

}

export default class MasonryLayout extends React.Component<IMasonryLayoutProps, IMasonryLayoutState> {

    constructor(props: IMasonryLayoutProps) {
        super(props);
    }

    sortItemsByWidth = (a: JSX.Element, b: JSX.Element) => {
        if (a.props.children.props.size.width === b.props.children.props.size.width) return 0;
        if (a.props.children.props.size.width < b.props.children.props.size.width) return 1;
        if (a.props.children.props.size.width > b.props.children.props.size.width) return -1;
        return 0;
    };

    sortItemsBySides = (a: JSX.Element, b: JSX.Element) => {
        if (a.props.children.props.doubleSide && b.props.children.props.doubleSide) return 0; //if the elements should not be swapped
        if (!a.props.children.props.doubleSide && b.props.children.props.doubleSide) return 1; // if `valueA` comes after `valueB`
        if (a.props.children.props.doubleSide && !b.props.children.props.doubleSide) return -1; //if `valueA` comes before `valueB`
        return 0;
    };

    public componentWillMount() {
    }

    private createColumns(columnWrapper: JSX.Element[], dsColumnWrapper: JSX.Element[]) {
        for (let i = 0; i < this.props.columns; i++) 
            columnWrapper[`column-${i}`] = [];
        
        if (this.props.sortBySides) 
            for (let i = 0; i < this.props.columns / 2 ; i++) 
                dsColumnWrapper[`column-${i}`] = [];
            
    }

    private devidedChildren(columnWrapper: JSX.Element[], children: JSX.Element[]) {
        // divide children into columns
        for (let i = 0; i < this.props.children.length; i++) {

            let height = 100; // set defualt value when not have height parametr
            if (children[i].props.children.props.size) {
                height = children[i].props.children.props.size.height;
            }

            // find min height index column wrapper
            let minHeight = this.columnWrapperHeight[0];
            let indexMinHeight = 0;
            for (let j = this.props.columns - 1; j >= 0; j--) {
                if (this.columnWrapperHeight[j] <= minHeight) {
                    minHeight = this.columnWrapperHeight[j];
                    indexMinHeight = j;
                }
            }

            this.columnWrapperHeight[indexMinHeight] += height;
            columnWrapper[`column-${indexMinHeight}`].push(
                <div key={children[i].key}
                    style={{ marginBottom: `${this.props.gap}rem` }}>
                    {this.props.children[i]}
                </div>
            );
        }

        return columnWrapper;
    }

    private setColumnWrapper(children: JSX.Element[], columnWrapper: JSX.Element[], dsColumnWrapper: JSX.Element[]) {

        let height = 100; // set defualt value when not have height parametr
        let columnWrapperHeight: number[] = [];
        let dsColumnWrapperHeight: number[] = [];
        let indexMinHeight = 0;
        let indexStart1Side = 0;

        for (let i = 0; i < this.props.columns; i++)
            columnWrapperHeight[i] = 0;

        for (let i = 0; i < this.props.columns  / 2; i++)
            dsColumnWrapperHeight[i] = 0;

        // implemention a horizontal masonry in future too
        if (this.props.sortBySides) {
            const doubleSideColumns = this.props.columns / 2;
            for (let i = 0; i < children.length; i++) {
                if (!children[i].props.children.props.doubleSide) {
                    indexStart1Side = i;
                    break; // stop wraping double side
                }

                if (children[i].props.children.props.size) {
                    height = children[i].props.children.props.size.height;
                }

                // find min height index column wrapper
                let minHeight = dsColumnWrapperHeight[indexMinHeight];
                for (let j = doubleSideColumns - 1; j >= 0; j--) {
                    if (dsColumnWrapperHeight[j] <= minHeight) {
                        minHeight = dsColumnWrapperHeight[j];
                        indexMinHeight = j;
                    }
                }

                dsColumnWrapperHeight[indexMinHeight] += height;
                dsColumnWrapper[`column-${indexMinHeight}`].push(
                    <div key={children[i].key}
                         style={{ marginBottom: `${this.props.gap}rem` }}>
                        {children[i]}
                    </div>
                );
            }
        }

        // divide children into columns
        indexMinHeight = 0;
        if (children.length < (indexStart1Side+1)) return;
        for (let i = indexStart1Side; i < children.length; i++) {

            if (children[i].props.children.props.doubleSide) continue;

            if (children[i].props.children.props.size) {
                height = children[i].props.children.props.size.height;
            }

            // find min height index column wrapper
            let minHeight = columnWrapperHeight[indexMinHeight];
            for (let j = this.props.columns - 1; j >= 0; j--) {
                if (columnWrapperHeight[j] <= minHeight) {
                    minHeight = columnWrapperHeight[j];
                    indexMinHeight = j;
                }
            }

            columnWrapperHeight[indexMinHeight] += height;
            columnWrapper[`column-${indexMinHeight}`].push(
                <div key={children[i].key}
                     style={{ marginBottom: `${this.props.gap}rem` }}>
                    {children[i]}
                </div>
            );
        }
    }

    private wrapDsColumn(dsColumnWrapper: JSX.Element[]) {
        let result: JSX.Element[] = [];

        // wrap double side children in each column with a div
        for (let i = 0; i < this.props.columns / 2; i++) {
            result.push(
                <div key={`mansory-container-ds-column-${i}`}
                     className={`item clmn-${this.props.columns} ds`}
                     style={{
                        marginRight: `${this.props.gap}rem`,
                        marginLeft: `${this.props.gap}rem`,
                        //flex: 1,
                    }}>
                    {dsColumnWrapper[`column-${i}`]}
                </div>
            );
        }

        return result;
    }


    private wrapColumn(columnWrapper: JSX.Element[]) {
        let result: JSX.Element[] = [];

        // wrap children in each column with a div
        for (let i = 0; i < this.props.columns; i++) {
            result.push(
                <div key={`mansory-container-column-${i}`}
                    className={`item clmn-${this.props.columns}`}
                    style={{
                        marginRight: `${this.props.gap}rem`,
                        marginLeft: `${this.props.gap}rem`,
                        //flex: 1,
                    }}>
                    {columnWrapper[`column-${i}`]}
                </div>
            );
        }

        return result;
    }

    public render() {

        let columnWrapper: JSX.Element[] = [];
        let dsColumnWrapper: JSX.Element[] = [];

        //console.log('Mansory render:', this.props.children);
        if (!this.props.children || this.props.children.length === 0)
            return "";

        // create columns
        this.createColumns(columnWrapper, dsColumnWrapper);

        let children: JSX.Element[];
        children = (this.props.sortBySides) ? this.props.children.sort(this.sortItemsBySides) : this.props.children;
        
        // divide children into columns
        //this.devidedChildren(columnWrapper, children);
        this.setColumnWrapper(children, columnWrapper, dsColumnWrapper);

        // wrap children in each column with a div by height
        let result = this.wrapColumn(columnWrapper);
        let dsResult = this.wrapDsColumn(dsColumnWrapper);

        return <div style={{width:"100%"}}>
                   {(this.props.sortBySides)
                       ? <div className="masonry-layot">
                             {dsResult}
                         </div>
                       : ""}
                    <div className="masonry-layot">
                       {result}
                   </div>
               </div>;
    }
}