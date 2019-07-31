namespace gboxLayout {
    export class GDragControl{
        public gboxLayout: GBoxLayout;
        public dragContainer: HTMLElement;
        private dragElement: HTMLElement;

        constructor(gboxLayout: GBoxLayout) {
            this.gboxLayout = gboxLayout;
            this.dragElement = document.createElement('div');
            this.dragElement.className = 'dragElement';
            this.dragElement.id = 'dragElement';
        }

        public static getInsertBoxPos(box: GBox, pos: GDragPosition):IRect {
            let x: number = 0;
            let y: number = 0;
            let width: number = 0;
            let height: number = 0;

            if(box) {
                let boxW = box.explicitWidth;
                let boxH = box.explicitHeight;
                let halfBoxW = boxW / 2;
                let halfBoxH = boxH / 2;
                let labelH = box.labelHeight;
                let labelW = box.labelWidth;
                let oneLabelW = box.oneLabelWidth;
                switch(pos) {
                    case GDragPosition.TOP:
                        x = box.x;
                        y = box.y;
                        width = boxW;
                        height = halfBoxH;
                        break;
                    case GDragPosition.BOTTOM:
                        x = box.x;
                        y = box.y + halfBoxH;
                        width = boxW;
                        height = halfBoxH;
                        break;
                    case GDragPosition.LEFT:
                        x = box.x;
                        y = box.y;
                        width = halfBoxW;
                        height = boxH;
                        break;
                    case GDragPosition.RIGHT:
                        x = box.x + halfBoxW;
                        y = box.y;
                        width = halfBoxW;
                        height = boxH;
                        break;
                    case GDragPosition.LABEL:
                    default:
                        let index = pos - GDragPosition.LABEL;
                        x = box.x + oneLabelW * index;
                        y = box.y;
                        width = oneLabelW;
                        height = labelH;
                        break;
                }
            }
            return {x: x, y: y, width: width, height: height};
        }

        public checkOverBox(clientX: number, clientY: number): {box: GBox, pos: GDragPosition} {
            if(this.gboxLayout && this.gboxLayout.boxList) {
                let boxList = this.gboxLayout.boxList;
                for(let i: number = 0, len = boxList.length; i < len; i++) {
                    let box = boxList[i];
                    if(box.isLeaf) {
                        if(clientX > box.x && clientX < box.x + box.explicitWidth &&
                            clientY > box.y && clientY < box.y + box.explicitHeight ) {
                            let pos = this.checkBoxPosition(box, clientX, clientY);
                            this.renderDrag(box, pos);
                            return {
                                box: box,
                                pos: pos
                            }
                         }
                    }
                }
            }
            return null;
        }
        public clearDrag(): void {
            if(this.dragElement && this.dragElement.parentElement) {
                this.dragElement.parentElement.removeChild(this.dragElement);
            }
        }
        private checkBoxPosition(box: GBox, clientX: number, clientY: number): GDragPosition {
            let mouseX = clientX - box.x;
            let mouseY = clientY - box.y;
            let halfW = box.explicitWidth / 2;
            let halfH = box.explicitHeight / 2;
            let labelHeight = box.labelHeight;
            let labelWidth = box.labelWidth;
            let oneLabelWidth = box.oneLabelWidth;
            let minX = Math.abs(Math.min(mouseX, box.explicitWidth - mouseX) / box.explicitWidth);
            let minY = Math.abs(Math.min(mouseY, box.explicitHeight - mouseY) / box.explicitHeight);
            
            if(mouseY < labelHeight && box.hasLabel) {
                let index = Math.floor(mouseX / oneLabelWidth);
                if(index >= box.panels.length) {
                    index = box.panels.length - 1;
                }
                return GDragPosition.LABEL + index;
            } else if(minX - minY > 0) {
                if(mouseY > halfH) {
                    return GDragPosition.BOTTOM;
                } else {
                    return GDragPosition.TOP;
                }
            } else {
                if(mouseX > halfW) {
                    return GDragPosition.RIGHT;
                } else {
                    return GDragPosition.LEFT;
                }
            }
        }

        private renderDrag(box:GBox, pos: GDragPosition) {
            let x: number = 0;
            let y: number = 0;
            let width: number = 0;
            let height: number = 0;
            let rect = GDragControl.getInsertBoxPos(box, pos);
            x = rect.x;
            y = rect.y;
            width = rect.width;
            height = rect.height;
            
            if(width > 0 && height > 0) {
                this.dragElement
                this.dragElement.style.width = width + 'px';
                this.dragElement.style.height = height + 'px';
                this.dragElement.style.left = x + 'px';
                this.dragElement.style.top = y + 'px';
                if(this.dragContainer) {
                    this.dragContainer.appendChild(this.dragElement);
                }
            }
        }

    }
}