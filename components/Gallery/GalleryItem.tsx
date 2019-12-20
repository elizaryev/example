import * as React from 'react';
import { Card, Grid, Image, Label, Segment, Icon, Loader, Button, List } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import {
    GalleryModel, IGalleryItem, IGallery, IGalleryItemActions,
    ViewMediaType, GalleryItemType, IViewMediaImageActions,
    getViewMediaTypeByIndex, IViewMediaData
} from '../../store/Gallery/Gallery';
import { IWITDoc } from '../../store/WITDoc';
import * as $ from "jquery";
import * as _ from "lodash";
import {LayerSourceProps} from "ClientApp/containers/WITElement";
import { ConnectDragSource, ConnectDragPreview, DragSourceSpec, DragSourceConnector, DragSourceMonitor, DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

export interface GalleryItemProps {
    //items?: IGalleryItem[];
    item: IGalleryItem,
    previewMediaType?: string,
    onItemSelected?(item: IGalleryItem): void,
    onItemLoaded?(item: IGalleryItem): void,
    /**
     * Called when the content has beef phisically loaded
     * @param item
     */
    onContentLoaded?(item:IGalleryItem):void;
    galleryItemClassName?: string
}

export interface GalleryItemState {
    isImageLoading: boolean;
    isImageLoaded: boolean;
    loadedCount:number;
}


// ----------- Drag-n-Drop behavior -----------------

export interface GalleryItemSourceProps {
    connectDragSource: ConnectDragSource,
    connectDragPreview: ConnectDragPreview,
    item:IGalleryItem,
    isDragging: boolean
}

// Spec: drag events to handle.
const galleryItemSourceSpec: DragSourceSpec<GalleryItemSourceProps & GalleryItemProps> = {
    beginDrag: (props: GalleryItemProps):IGalleryItem => (props.item),
};

// Collect: Put drag state into props
const galleryItemSourceCollector = (connect: DragSourceConnector, monitor: DragSourceMonitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        offset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }
};

type GalleryItemExtendedProps = GalleryItemProps & GalleryItemSourceProps;

@observer
class GalleryItem extends React.Component<GalleryItemExtendedProps, GalleryItemState> {

    constructor(props: GalleryItemExtendedProps & GalleryItemSourceProps) {
        super(props);
        this.state = { isImageLoading: false, isImageLoaded:false, loadedCount:0};
    }

    componentDidMount() {
        const { item, connectDragPreview } = this.props;
        const self = this;
        if (item) {
            (item as any as IGalleryItemActions).loadMedia(this.props.previewMediaType).then(() => {
                self.imageLoadedHandler();
            }).catch(() => {
                self.imageLoadedHandler();
            });
        }

        //const img: any = <img src={(item.viewMedia[0] as any as IViewMediaImageActions).getImageUrl(item.hash,
        //    ViewMediaType.Thumb,
        //    item.isInMyCloud)} onLoad={() => {
        //        connectDragPreview(img);
        //        console.log('loaded');
        //    }}/>;
        connectDragPreview(getEmptyImage(), { captureDraggingState: true });

    }

    private imageLoadedHandler() {
        this.setState({ isImageLoading: false, isImageLoaded: true });
        if (this.props.onItemLoaded) this.props.onItemLoaded(this.props.item);
    }

    private itemClickHandler(e: React.MouseEvent<HTMLDivElement>, galleryItem: IGalleryItem) {
        //Prevent parent's onClick handeler
        e.stopPropagation();
        //const newState: GalleryItemState = { isImageLoading: !this.state.isImageLoading };
        //this.setState(newState);        
        if (this.props.onItemSelected) {
            this.props.onItemSelected(galleryItem);
        }    
        //if (newState.isImageLoading) {
        //    (galleryItem as any as IGalleryItemActions).load();
        //}
    }

    private onNextImageLoaded(index: number) {
        //const { item, connectDragPreview } = this.props;
        //console.log('onnextimage loaded');
        //this.setState(_.assign({}, this.state, { loadedCount: this.state.loadedCount + 1 }));
        //if (this.state.loadedCount + 1 >= this.props.item.viewMedia.length) {
        //    if (this.props.onContentLoaded) this.props.onContentLoaded(this.props.item);

        //    let src = (item.viewMedia[0].thumbImage as any as IViewMediaImageActions).getImageUrl(
        //        item.hash,
        //        ViewMediaType.Thumb,
        //        item.isInMyCloud);
        //    console.log('connect drag preview');
        //    if(connectDragPreview)
        //        connectDragPreview(<div style={{width:"10px", height:"10px", position:"absolute"}}></div>);
        //}
    }

    private renderImages(viewMediaArr:IViewMediaData[]) {        
        const { hash, type, isInMyCloud } = this.props.item;
        let previewMediaType = this.props.previewMediaType;

        if (!viewMediaArr) {
            return <Image src={require('../../assets/element-stub.png')}/>;
        }        

        return <Grid divided centered columns={2}>
                   <Grid.Row>
                {this.props.item.viewMedia.map((viewMedia, index, arr) => {
                    const currentImage = previewMediaType === ViewMediaType.Screen ? viewMedia.screenImage! :
                        viewMedia.thumbImage!;
                    if (type === GalleryItemType.Design || type === GalleryItemType.Element || type === GalleryItemType.Background)
                        previewMediaType = getViewMediaTypeByIndex(index);
                    const contentOrUrl: string | undefined = (currentImage as any as IViewMediaImageActions).getImageUrl(hash, previewMediaType || ViewMediaType.Thumb, isInMyCloud) || currentImage.content;
                           return <Grid.Column width={Math.round(16 / arr.length) as any} key={index}>
                               <Image src={contentOrUrl || require('../../assets/element-stub.png')} onLoad={() => this.onNextImageLoaded(index)}/>
                                  </Grid.Column>;
                       })}
                   </Grid.Row>
               </Grid>;
    }

    shouldComponentUpdate(nextProps: GalleryItemExtendedProps, nextState: GalleryItemState) {
        //DnD performance fix
        if (!nextProps.isDragging && (nextProps as any).offset !== (this.props as any).offset) return false;
        return true;
    }

    public render() {
        const { item, connectDragSource } = this.props;
        if (!item) return null;

        let itemClassName = this.props.galleryItemClassName || 'gallery-item';
        // Double-side class adds x2 width
        if (item.viewMedia && item.viewMedia.length === 2) itemClassName += " ds";        

        return connectDragSource(
            <div onClick={(e: any) => this.itemClickHandler(e, item)}>
                           <Card raised className={itemClassName}>
                               {this.state.isImageLoaded
                                   ? this.renderImages(item.viewMedia)
                                   : <Loader active inline/>}
                               <Card.Content>
                                   <Label size='mini' basic attached='bottom' className='lbl-gallery'>{item.name}</Label>
                               </Card.Content>
                           </Card>
        </div>);
    }
}

export default DragSource('item', galleryItemSourceSpec, galleryItemSourceCollector)(GalleryItem) as any;
