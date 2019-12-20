import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { DragDropContext} from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import Page from '../containers/Page';
import { IWITDoc, IWITDocActions } from '../store/WITDoc';
import { IWITDocSettings } from '../store/WITDocSettings';

interface IWITDocProps {
    witdoc?: IWITDoc & IWITDocActions,
    docSettings?: IWITDocSettings
}

/**
 * This is for rendering document or set of elements right into a headless browser
 * for further printing to PDF or making a screenshot
 */

@inject("witdoc", "docSettings")
@observer
export class DocumentRenderer extends React.Component<IWITDocProps> {

    //Render additional styles passed from outsides
    // E.g. @page CSS with page size passed from parser
    renderAdditionalStyles() {
        if (window.__extraCSS) {
            console.log("Got extra CSS: " + window.__extraCSS);
            return <style type="text/css" dangerouslySetInnerHTML={{__html:window.__extraCSS }}/>;
        }
        return null;
    }

    public render() {
        return <div className='witapp'>                 
            {this.renderAdditionalStyles()}
            {this.props.witdoc!.pages.map((page) => <Page key={page.uid} page={page} zoom={this.props.docSettings!.zoom} renderMode={this.props.docSettings!.viewMode} />)}                                                                                                  
            </div>;
    }
}

export default DragDropContext(HTML5Backend)(DocumentRenderer);