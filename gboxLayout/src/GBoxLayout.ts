/// <reference path="./GBox.ts" />

namespace gboxLayout {
    export class GBoxLayout extends GBox{
        
        public static MIN_SIZE: number = 10;
        public static GAP: number = 2;
        public static GAP_SPLIT:number = 4;
        public clientWidth: number = 100;
        public clientHeight: number = 100;
        public dragControl: GDragControl;

        private _data: GBoxData;
        private _mainBox: GBox;
        private _boxList: GBox[] = [];
        private _container:HTMLElement;
        private _dragContainer: HTMLElement;

        private _panelDic: {[id: string]:  GPanel | {new (): GPanel}} = {};
        private _panelParamsDic : {[id: string]: any[]} = {};

        private _boxPool:GBox[] = [];
        private _focusBox: GBox;

        constructor() {
            super();
            window.addEventListener('resize', ()=>{
                this.resizeHandler();
            })

            this._dragContainer = document.createElement('div');
            this._dragContainer.className = 'dragContainer';
            this._dragContainer.id = 'dragContainer';

            this.dragControl = new GDragControl(this);
            this.dragControl.dragContainer = this._dragContainer;
        }

        public get boxList(): GBox[] {
            return this._boxList;
        }

        public get layoutX(): number {
            if(this._container) {
                return this._container.offsetLeft;
            }
            return 0;
        }

        public get layoutY(): number {
            if(this._container) {
                return this._container.offsetTop;
            }
            return 0;
        }

        public get focusBox(): GBox {
            return this._focusBox;
        }
        public set focusBox(v: GBox) {
            if(v != this._focusBox) {
                if(this._focusBox) {
                    this._focusBox.focused = false;
                }
                this._focusBox = v;
                if(this._focusBox) {
                    this._focusBox.focused = true;
                }
            }
        }

        public setData(data:GBoxData) {
            this._data = data;
            this.clearLayout();

            this.parseData();
            this.calculatePosition();
            this.refreshLayout();
        }

        public getData(): GBoxData {
            if(this._mainBox) {
                return this._mainBox.getData();
            }
            return null;
        }
        public setContainer(container: HTMLElement) {
            if(container){
                this._container = container;
                this.clientWidth = this._container.offsetWidth;
                this.clientHeight = this._container.offsetHeight;

                if(this._dragContainer) {
                    this._container.appendChild(this._dragContainer);
                }
            }
        }
        public resizeHandler(): void {
            this.clientWidth = this._container.offsetWidth;
            this.clientHeight = this._container.offsetHeight;
            this.calculatePosition();
            this.refreshLayout();
        }

        public moveSplit(split: GSplit, splitPos:IPoint, boxABound: IRect, boxBBound: IRect, offX: number, offY: number) {
            if(split && split.boxs.length == 2){
                let boxA = split.boxs[0];
                let boxB = split.boxs[1];
                if(split.isVertical) {
                    let explicitOffY = offY;
                    let boxAHeight = boxABound.height + explicitOffY;
                    let boxBHeight = boxBBound.height - explicitOffY;
                    if(explicitOffY < 0) {
                        if(boxAHeight < boxA.minHeight) {
                            explicitOffY = boxA.minHeight - boxABound.height;
                        } else if(boxBHeight > boxB.maxHeight && boxB.maxHeight > boxB.explicitHeight) {
                            explicitOffY = boxB.maxHeight - boxABound.height;
                        }
                    } else {
                        if(boxBHeight < boxB.minHeight) {
                            explicitOffY = boxBBound.height - boxB.minHeight;
                        } else if( boxAHeight > boxA.maxHeight ) {
                            explicitOffY = boxA.maxHeight - boxABound.height;
                        }
                    }
                    this.calculateBoxPositionSize(boxA, boxA.x, boxA.y, boxA.explicitWidth, boxABound.height + explicitOffY);
                    split.y = splitPos.y + explicitOffY;
                    this.calculateBoxPositionSize(boxB, boxB.x, boxBBound.y + explicitOffY, boxB.explicitWidth, boxBBound.height - explicitOffY);
                    
                } else {
                    let explicitOffX = offX;
                    let boxAWidth = boxABound.width + explicitOffX;
                    let boxBWidth= boxBBound.width - explicitOffX;
                    if(explicitOffX < 0) {
                        if(boxAWidth < boxA.minWidth) {
                            explicitOffX = boxA.minWidth - boxABound.width;
                        } else if(boxBWidth > boxB.maxWidth) {
                            explicitOffX = boxB.maxWidth - boxBBound.width;
                        }
                    } else {
                        if(boxBWidth < boxB.minWidth) {
                            explicitOffX = boxBBound.width - boxB.minWidth;
                        } else if( boxAWidth > boxA.maxWidth) {
                            explicitOffX = boxA.maxWidth - boxABound.width;
                        }
                    }
                    this.calculateBoxPositionSize(boxA, boxA.x, boxA.y, boxABound.width + explicitOffX, boxA.explicitHeight);
                    split.x = splitPos.x + explicitOffX;
                    this.calculateBoxPositionSize(boxB, boxBBound.x + explicitOffX, boxB.y, boxBBound.width - explicitOffX, boxB.explicitHeight);
                }
                this.renderElement();
            }
        }

        public registPanel(id: string, panel: GPanel | {new (): GPanel}, params: any = null): void {
            this._panelDic[id] = panel;
            this._panelParamsDic[id] = params;
        }

        public getPanel(id: string):GPanel {
            let panelInstance = this._panelDic[id];
            if (panelInstance) {
                if( typeof(panelInstance) === 'object') {
                    panelInstance.name = id;
                    return panelInstance as any;
                } else {
                    
                    let panelClz = panelInstance as any;
                    let newPanel = new panelClz();
                    newPanel.name = id;
                    return newPanel;
                }
            } else {
                return new GPanel(id);
            }
        }

        public renderElement(): void {
            
            if(this.render == null) {
                this.render  = document.createElement('div');
                this.render.className ='gapp';
            }
            this.removeElementChildren(this.render);
            if(this._boxList) {
                for (let i: number = 0, len: number = this._boxList.length; i < len; i++) {
                    let box = this._boxList[i];
                    if(box){
                        box.renderElement();
                        if(box.render) {
                            this.render.appendChild(box.render);
                        } else if (box.split) {
                            this.render.appendChild(box.split.render);
                        }
                    }
                }
            }
            if(this._container) {
                this._container.appendChild(this.render);
            }
        }

        public removePanel(panel: GPanel):void {
            let box = panel.parent;
            if(box) {
                if(box.panels.length <= 1 ) {
                    this.removeBox(box); 
                } else {
                    box.removePanel(panel);
                }
            }
        }
        public removeBox(box:GBox): void {
            let targetBox = box;

            if(targetBox && targetBox.parent) {
                let parentBox = targetBox.parent;
                let brotherBox = targetBox.brother;
                
                this.calculateBoxPositionSize(brotherBox, parentBox.x ,parentBox.y, parentBox.explicitWidth, parentBox.explicitHeight);

                //调整层级关系
                if(parentBox.parent != null) {
                    for(let i: number = 0, len: number = parentBox.parent.children.length; i < len; i++) {
                        if(parentBox.parent.children[i] == parentBox) {
                            parentBox.parent.children[i] = brotherBox;
                            break;
                        }
                    }
                    parentBox.children.length = 0;
                } else {
                    //删除主box，当前box为主box；
                    this._mainBox = brotherBox as GBox;
                    this._mainBox.brother = null;
                    this._mainBox.parent = null;
                }
                brotherBox.parent = parentBox.parent;
                brotherBox.brother = parentBox.brother;
                if(brotherBox.brother) {
                    brotherBox.brother.brother = brotherBox;
                }
                parentBox.parent = null;
                parentBox.brother = null;
                targetBox.parent = null;
                targetBox.brother = null;

                if(parentBox.split) {
                    if(parentBox.split.render && parentBox.split.render.parentElement) {
                        parentBox.split.render.parentElement.removeChild(parentBox.split.render);
                    }
                }
                for(let i: number = 0, len: number = this._boxList.length; i < len; i++) {
                    if(this._boxList[i] == parentBox || this._boxList[i] == targetBox) {
                        this._boxList.splice(i, 1);
                        i--;
                        len--;
                    }
                }
                this.disposeBoxToPool(parentBox as any);
                this.disposeBoxToPool(targetBox as any);
                this.renderElement(); 
            }
        }
        public addPanel(panel:GPanel, box: GBox, pos:GDragPosition) {
            if(pos >= GDragPosition.LABEL) {
                box.addPanel(panel, box, pos);
            } else {
                this.addBox(panel, box, pos);
            }
        }
        public addBox(panel:GPanel, box: GBox, pos:GDragPosition) {
            let boxParent = box.parent;
            let newParentBox = this.createBoxFromPool();

            //新的parent
            let isVertical = pos == GDragPosition.TOP || pos == GDragPosition.BOTTOM;
            newParentBox.name = box.name;
            newParentBox.x = box.x;
            newParentBox.y = box.y;
            newParentBox.width = box.width;
            newParentBox.height = box.height;
            newParentBox.explicitHeight = box.explicitHeight;
            newParentBox.explicitWidth = box.explicitWidth;
            newParentBox.isVertical = isVertical;
            newParentBox.minWidth = box.minWidth;
            newParentBox.minHeight = box.minHeight;
            newParentBox.maxWidth = box.maxWidth;
            newParentBox.maxHeight = box.maxHeight;
            newParentBox.owner = this;
            newParentBox.panels = [];
            newParentBox.panelIndex = 0;

            newParentBox.parent = boxParent;
            newParentBox.brother = box.brother;
            newParentBox.brother.brother = newParentBox;
            let boxIndex = boxParent.children.indexOf(box);
            if(boxIndex >= 0) {
                boxParent.children[boxIndex] = newParentBox;
            }
            this._boxList.push(newParentBox);
            

            let rect = GDragControl.getInsertBoxPos(box, pos);

            //处理新的box
            let panelBox = this.createBoxFromPool();
            panelBox.name = panel.name;
            panelBox.width = rect.width;
            panelBox.height = rect.height;
            panelBox.isVertical = false;
            panelBox.minWidth = NaN;
            panelBox.minHeight = NaN;
            panelBox.maxWidth = NaN;
            panelBox.maxHeight = NaN;
            panelBox.owner = this;
            panelBox.panels = [panel.name];
            panelBox.parsePanels();
            panelBox.panelIndex = 0;
            
            box.brother = panelBox;
            panelBox.brother = box;
            
            panelBox.parent = newParentBox;
            switch(pos) {
                case GDragPosition.TOP:
                case GDragPosition.LEFT:
                    newParentBox.children.push(panelBox);
                    newParentBox.children.push(box);
                    break;
                case GDragPosition.BOTTOM:
                case GDragPosition.RIGHT:
                    newParentBox.children.push(box);
                    newParentBox.children.push(panelBox);
                    break;
            }
            this._boxList.push(panelBox);
            //处理 老的box
            switch(pos) {
                case GDragPosition.TOP:
                case GDragPosition.BOTTOM:
                    box.height = box.height / 2;
                case GDragPosition.LEFT:
                case GDragPosition.RIGHT:
                    box.width = box.width / 2;
                    break;
            }
            box.parent = newParentBox;
            this. calculateBoxPositionSize(newParentBox, newParentBox.x ,newParentBox.y, newParentBox.width, newParentBox.height);
            this.renderElement();
        }

        private refreshLayout(): void {
            this.renderElement();
        }

        private clearLayout(): void {
            for(let i:number = 0, len: number = this._boxList.length; i < len; i++) {
                this.disposeBoxToPool(this._boxList[i]);
            }
            this._boxList.length = 0;
        }

        private parseData(): void {
            if(this._data == null) {
                return;
            }
            this._mainBox = this.parseBox(this._data);
        }
        private parseBox(boxData:GBoxData): GBox {
            let box = this.getBox(boxData);
            if(boxData.children) {
                let childBox1: GBox;
                let childBox2: GBox;
                if(boxData.children.length >= 1) {
                    childBox1 = this.parseBox(boxData.children[0])
                }
                if(boxData.children.length >= 2) {
                    childBox2 = this.parseBox(boxData.children[1])
                }
                if(childBox1 && childBox2) {
                    childBox1.brother = childBox2;
                    childBox2.brother = childBox1;
                }
                if(boxData.mainIndex == 0 && childBox1) {
                    childBox1.isMain = true;
                    if(childBox2) {
                        childBox2.isMain = false;
                    }
                }
                if(boxData.mainIndex == 1 && childBox2) {
                    childBox2.isMain = true;
                    if(childBox1) {
                        childBox1.isMain = false;
                    }
                }
                if(childBox1) {
                    box.children.push(childBox1);
                    childBox1.parent = box;
                }
                if(childBox2) {
                    box.children.push(childBox2);
                    childBox2.parent = box;
                }
            }
            this._boxList.push(box);
            return box;
        }

        private calculatePosition(): void {
            if(this._mainBox) {
                this.calculateBoxPositionSize(this._mainBox, 0, 0, this.clientWidth, this.clientHeight);
            }
        }
        private calculateBoxPositionSize(box:GBox, x: number ,y: number, width: number, height: number) {
            box.x = x;
            box.y = y;
            box.explicitWidth = width;
            box.explicitHeight = height;;
            if (box.children && box.children.length > 0) {
                if (box.children.length == 1) {
                    this.calculateBoxPositionSize(box.children[0], x, y, width, height);
                } else {
                    let box1 = box.children[0];
                    let box2 = box.children[1];
                    let mainIndex = 0;
                    if(box1.isMain) {
                        mainIndex = 0;
                    } else if(box2.isMain) {
                        mainIndex = 1;
                    }
                    let childBoxSize = this.caculateBoxSize(box, x, y, width, height);
                    this.calculateBoxPositionSize(box1, childBoxSize.box1.x, childBoxSize.box1.y, childBoxSize.box1.width, childBoxSize.box1.height);
                    this.calculateBoxPositionSize(box2, childBoxSize.box2.x, childBoxSize.box2.y, childBoxSize.box2.width, childBoxSize.box2.height);
                }
                
            }
        }
        private caculateBoxSize(box:GBox, x: number ,y: number, width: number, height: number): {box1:{x:number,
                                                                                                                      y: number,
                                                                                                                      width: number,
                                                                                                                      height: number},
                                                                                                                box2:{x:number,
                                                                                                                      y: number,
                                                                                                                      width: number,
                                                                                                                      height: number},
                                                                                                                } {
            let box1 = box.children[0];
            let box2 = box.children[1];
            let mainIndex = 0;
            if(box1.isMain) {
                mainIndex = 0;
            } else if(box2.isMain) {
                mainIndex = 1;
            }
            let result = {box1: {x: x, y: y, width: 10, height:10}, box2:{x: x, y: y, width: 10, height: 10}}
            let isVertical = box.isVertical;
            if(isVertical) {
                let box1Height = this.caculateSize(height, box1.height, this.getMinHeight(box1),this.getMaxHeight(box1),
                                                           box2.height, this.getMinHeight(box2), this.getMaxHeight(box2), mainIndex);
                
                let box1MinHeight = this.getMinHeight(box1);
                if(box1Height < box1MinHeight) {
                    box1Height = box1MinHeight;
                }
                let box2Height = height - box1Height - GBoxLayout.GAP;
                let box2MinHeight = this.getMinHeight(box2);
                if(box2Height < box2MinHeight) {
                    box2Height = box2MinHeight;
                }
                result.box1.x = x;
                result.box1.y = y;
                result.box1.width = width;
                result.box1.height = box1Height;
                result.box2.x = x;
                result.box2.y = y + box1Height + GBoxLayout.GAP;
                result.box2.width = width;
                result.box2.height = box2Height;
            } else {
                let box1Width = this.caculateSize(width, box1.width, this.getMinWidth(box1),this.getMaxWidth(box1),
                                                          box2.width, this.getMinWidth(box2), this.getMaxWidth(box2), mainIndex);

                let box1MinWidth = this.getMinWidth(box1);
                if(box1Width < box1MinWidth) {
                    box1Width = box1MinWidth;
                }
                let box2Width = width - box1Width - GBoxLayout.GAP;
                let box2MinWidth= this.getMinWidth(box2);
                if(box2Width < box2MinWidth) {
                    box2Width = box2MinWidth;
                }
                result.box1.x = x;
                result.box1.y = y;
                result.box1.width = box1Width;
                result.box1.height = height;
                result.box2.x = x + box1Width + GBoxLayout.GAP;
                result.box2.y = y;
                result.box2.width = box2Width;
                result.box2.height = height;
            }
            return result;
        }
        private caculateSize(lastSize: number, size1: number, minSize1: number ,maxSize1: number, size2: number ,minSize2: number ,maxSize2: number, mainIndex: number): number {
            // 主的最小 》 主的最大 》 副的最小 》 副的最大 》 主的实际 》 副的实际
            let size = lastSize - GBoxLayout.GAP;
            let curSize = size;
                if(size <= 0) {
                    return 0;
                } else {
                    //可以满足最小
                    if (size > minSize1 + minSize2) {
                        // 可以满足当前
                        if(size > size1 + size2) {
                            //比最大还大
                            if(size > maxSize1 + maxSize2) {
                                if(mainIndex == 0) {
                                    curSize = maxSize1;
                                } else {
                                    curSize = size - maxSize2;
                                }
                            } else {
                                //比最大小，比当前大
                                //满足主当前时，比副的最大大，先满足副的最大
                                
                                if(mainIndex == 0) {
                                    if(size - size1 > maxSize2) {
                                        curSize = size - maxSize2;
                                    } else {
                                        curSize = size1;
                                    }
                                } else {
                                    if(size - size2 > maxSize1) {
                                        curSize = maxSize1;
                                    } else {
                                        curSize = size - size2;
                                    }
                                }
                            }
                        } else {
                            // 不能满足两个当前，优先主当前
                            if(mainIndex == 0) {
                                if(size > size1 + minSize2) {
                                    curSize = size1;
                                } else {
                                    curSize = size - minSize2;
                                }
                            } else {
                                if(size > size2 + minSize1) {
                                    curSize = size - size2;
                                } else {
                                    curSize = size - minSize1;
                                }
                            }
                        }
                    } else {
                        //不能满足最小，两个都取最小
                        curSize = minSize1;
                    }
                }
            return curSize;
        }
        private getMinHeight(box: GBox): number {
            if(!isNaN(box.minHeight)) {
                return box.minHeight;
            }
            return GBoxLayout.MIN_SIZE;
        }
        private getMinWidth(box: GBox): number {
            if(!isNaN(box.minWidth)) {
                return box.minWidth;
            }
            return GBoxLayout.MIN_SIZE;
        }
        private getMaxHeight(box: GBox): number {
            if(!isNaN(box.maxHeight)) {
                return box.maxHeight;
            }
            return Number.MAX_VALUE;
        }
        private getMaxWidth(box: GBox): number {
            if(!isNaN(box.maxWidth)) {
                return box.maxWidth;
            }
            return Number.MAX_VALUE;
        }
        private getBox(boxData:GBoxData): GBox {
            let box = this.createBoxFromPool();
            box.name = boxData.name;
            box.width = boxData.width;
            box.height = boxData.height;
            box.isVertical = boxData.isVertical;
            box.minWidth = boxData.minWidth;
            box.minHeight = boxData.minHeight;
            box.maxWidth = boxData.maxWidth;
            box.maxHeight = boxData.maxHeight;
            box.owner = this;
            box.panels = boxData.panels ? boxData.panels : [];
            box.panelIndex = boxData.panelIndex;
            return box;
        }
        private createBoxFromPool():GBox {
            if(this._boxPool.length) {
                let box = this._boxPool.shift();
                return box;
            } else {
                return new GBox();
            }
        }
        private disposeBoxToPool(box:GBox): void {
            if(box) {
                box.dispose();
                this._boxPool.push(box);
            }
        }
    }
}