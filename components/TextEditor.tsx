import * as React from 'react';
import { EditorState, EditorProps, Editor} from 'draft-js';
import Draft, { htmlToDraft } from 'react-wysiwyg-typescript';
import { stateToHTML } from 'draft-js-export-html';

//import { } from 'react-rte'
  
export interface IMyEditorProps {
    onChange?(html: string): void;
    readOnly?: boolean;
    initHtmlText?: string;
    name?: string;
    onFocus?(e: any): void;
    onBlur?(e: any): void;
};

interface IMyEditorState {
    editorState: EditorState,
    options: string[];
}

export class TextEditor extends React.Component<IMyEditorProps, IMyEditorState> {

    constructor(props: any) {
        super(props);
    }

    public componentWillMount() {


        //let draftEditor = DraftEditor.create();

        let initHtmlText: boolean = false;
        let htmlText: string = "";
        if (this.props.initHtmlText && this.props.initHtmlText !== "") {
            initHtmlText = true;
            htmlText = this.props.initHtmlText;
        }
        if (this.props.readOnly) {
            this.state = {
                editorState: initHtmlText ? htmlToDraft(htmlText) : EditorState.createEmpty(),
                options: [],
                
            };
        }
        else
            this.state = { editorState: initHtmlText ? htmlToDraft(htmlText) : EditorState.createEmpty(), options: ["inline", "blockType", "fontSize", "fontFamily", "list", "textAlign", "colorPicker"] };
    }

    public componentWillUpdate(nextProps: any, nextState: any) {
        if (this.props.name) {
            //console.log(this.props.name);
            // todo: need update operationpopup when changed publishing texteditor
        }
    }

    private onChange = (editorState: EditorState) => {
        
        if (this.props.readOnly)
            return;

        this.setState({ editorState });
        if (this.props.onChange !== undefined) {

            const html = stateToHTML(editorState.getCurrentContent());

            this.props.onChange(html);
        }
    };

    private onEditorFocus(event: any) {
        if (this.props.readOnly)
            return;

        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
    };

    private onEditorBlur(event: any) {
        if (this.props.readOnly)
            return;

        if (this.props.onBlur) {
            this.props.onBlur(event);
        }
    }

    render() {
        return <div>
            <Draft editorState={this.state.editorState}
                toolbar={{ ["options"]: this.state.options }}
                onEditorStateChange={(editorState) => {
                    this.onChange(editorState);
                }}

                onFocus={(event: any) => this.onEditorFocus(event)}
                onBlur={(event: any) => this.onEditorBlur(event)}
            />
               </div>;
    }
}