import { observer, inject } from 'mobx-react';
import { isAlive, IStateTreeNode } from 'mobx-state-tree';
import * as React from 'react';
import * as $ from "jquery";
import { ILocalizeActions } from "../../store/Localize";
import { servicesConfig } from "conf";
 
export interface IFlippingBookProps {

    // The hash name of the multi-page folder from the Store folder. 
    // The FlippingBook.aspx page of the YP site will be finding folder with than hash
    designFolderHash?: string, 

    uniqId?: string,
    enableCtrlBar?: string,
    scaleMode?: string,
    bookSize?: string,
    graphicsWidth?: string,
    height?: number,
    width?: number;
    className?: string;

    onClickHandler?(event: any): void;
    frameLoadedEvent?(loaded: boolean):void;
}

export interface IFlippingBookState {
    ID: number;
}

@inject()
@observer
export default class FlippingBook extends React.Component<IFlippingBookProps, IFlippingBookState> {

    constructor(props: any) {
        super(props);
        this.state = {
            ID: Date.now()
        };
    }

    componentDidMount() {

        const { height, width } = this.props;

        const self = this;
        $(`#flippingBook-frame-${this.state.ID}`).on('load',
            () => {
                //console.log("flippingbook iframe loaded:", self.props.designFolderHash);

                if (self.props.frameLoadedEvent)
                    self.props.frameLoadedEvent(true);

                $(`#flippingBook-frame-${this.state.ID}`).contents().on("click", $.proxy(this.onClickHandler, this));

                $(`#flippingBook-frame-${this.state.ID}`).contents().find("#pageflip").attr("style",
                    `height: ${height ? height : "260"}px; width: ${width ? width - 10 : "430"}px`);

                const rightBtnElements = $(`#flippingBook-frame-${this.state.ID}`).contents().find(".pf-right-buttons");
                rightBtnElements.addClass("pf-right-buttons-mini");
                rightBtnElements.removeClass("pf-right-buttons");

                const centeredBtnElements = $(`#flippingBook-frame-${this.state.ID}`).contents().find(".pf-centered-buttons");
                centeredBtnElements.addClass("pf-centered-buttons-mini");
                centeredBtnElements.removeClass("pf-centered-buttons");
            });
    }

    onClickHandler(event: any) {
        if (this.props.onClickHandler && !this.ignoreClickHandler(event.toElement))
            this.props.onClickHandler(event);
    }

    ignoreClickHandler(element: any) : boolean {

        if (element.parentElement.id === "pageflip-controls")
            return true;

        if (element.parentElement.id === "pf-stage" || element.parentElement.id === "pageflip")
            return false;

        return this.ignoreClickHandler(element.parentElement);
    }

    render() {

        const {
            uniqId, enableCtrlBar, scaleMode, designFolderHash, bookSize, graphicsWidth,
            className, height, width
        } = this.props;

        let url: string = `${servicesConfig.YPFlippingBookFrameUrl}?_isWdmStgOrderDtl=true`;
        url = url.concat(`&_UniqId=${uniqId}`);
        url = url.concat(`&_EnableCtrlBar=${enableCtrlBar ? enableCtrlBar : "true"}`);
        url = url.concat(`&_ScaleMode=${scaleMode ? scaleMode : "FullScale"}`);
        url = url.concat(`&_DesignPath=${designFolderHash}`);
        url = url.concat(`&_BookSize=${bookSize}`);
        url = url.concat(`&_GraphicsWidth=${graphicsWidth}`);

        return <iframe id={`flippingBook-frame-${this.state.ID}`}
            src={url}
            height={height ? height : "260px"}
            width={(width) ? width : "440px"}
            frameBorder="0"
            className={className}
            onClick={() => console.log("iframe click") }/>;
    }
}