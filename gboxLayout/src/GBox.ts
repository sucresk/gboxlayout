/// <reference path="./GNode.ts" />

namespace gboxLayout {
    export class GBox extends GNode {
        name: string;        
        width: number;
        height: number;
        
        isVertical: boolean;
        parent: GBox;
        brother: GBox;
        children: GBox[] = [];
        render: HTMLElement;
        isMain: boolean;
        split: GSplit;
        owner: GBoxLayout;

        private _panels: string[] = [];
        private _panelIndex: number = 0;
        private _minWidth: number;
        private _minHeight: number;
        private _maxWidth: number;
        private _maxHeight: number
        private _explicitWidth:number;
        private _explicitHeight:number;
        private _x: number;
        private _y: number;
        
        private _sizeDirty: boolean = false;
        private _posDirty: boolean = false;

        private _panelList:GPanel[] = [];
        private _curPanel:GPanel;
        
        private _labelContainer:HTMLElement;
        private _conentContainer:HTMLElement;
        private _toolbarContainer:HTMLElement;

        private _labelList:HTMLElement[] = [];
        private _dragPanel: GPanel;
        private _dropBox: {box: GBox, pos: GDragPosition};
        private _startDrag: boolean = false;
        private _downPos: IPoint;
        private _focused: boolean;

        public getData(): GBoxData {
            let mainindex = 0;
            let children:GBoxData[] = [];
            for (let i: number = 0, len: number = this.children.length; i < len; i++) {
                if(this.children[i].isMain) {
                    mainindex = i;
                }
                children.push(this.children[i].getData())
            }
            let data:GBoxData = {
                name: this.name,
                isVertical: this.isVertical,
                mainIndex: mainindex, // -1,0,1
                width: this._explicitWidth,
                height: this._explicitHeight,
                minWidth: this._minWidth,
                minHeight: this._minHeight,
                maxWidth: this._maxWidth,
                maxHeight: this._maxHeight,
                children: children,
                panels: this._panels,
                panelIndex: this._panelIndex
            }
            if(children.length == 0) {
                delete data.children;
            }
            if(this._panels.length == 0) {
                delete data.panels;
            }
            if(isNaN(this._minWidth) || this._minWidth == GBoxLayout.MIN_SIZE ) {
                delete data.minWidth;
            }
            if(isNaN(this._minHeight) || this._minHeight == GBoxLayout.MIN_SIZE ) {
                delete data.minHeight;
            }
            if(isNaN(this._maxWidth) || this._maxWidth == Number.MAX_VALUE / 100 ) {
                delete data.maxWidth;
            }
            if(isNaN(this._maxHeight) || this._maxHeight == Number.MAX_VALUE / 100 ) {
                delete data.maxHeight;
            }
            return data;
        }

        public get minWidth(): number {
            if(this.children && this.children.length > 0) {
                if(this.children.length == 1 || this.isVertical) {
                    return this.children[0].minWidth;
                } else {
                    return this.children[0].minWidth + this.children[1].minWidth + GBoxLayout.GAP;
                }
            }
            return this._minWidth;
        }
        public set minWidth(v: number) {
            if(isNaN(v) || v < 0) {
                v = GBoxLayout.MIN_SIZE;
            }
            this._minWidth = v;
        }

        public get minHeight(): number {
            if(this.children && this.children.length > 0) {
                if(this.children.length == 1 || !this.isVertical) {
                    return this.children[0].minHeight;
                } else {
                    return this.children[0].minHeight + this.children[1].minHeight + GBoxLayout.GAP;
                }
            }
            return this._minHeight;
        }
        public set minHeight(v: number) {
            if(isNaN(v) || v < 0) {
                v = GBoxLayout.MIN_SIZE;
            }
            this._minHeight = v;
        }

        public get maxWidth(): number {
            if(this.children && this.children.length > 0) {
                if(this.children.length == 1 || this.isVertical) {
                    return this.children[0].maxWidth;
                } else {
                    return this.children[0].maxWidth + this.children[1].maxWidth + GBoxLayout.GAP;
                }
            }
            return this._maxWidth;
        }
        public set maxWidth(v: number) {
            if(isNaN(v) || v < 0) {
                v = Number.MAX_VALUE / 100;
            }
            this._maxWidth = v;
        }

        public get maxHeight(): number {
            if(this.children && this.children.length > 0) {
                if(this.children.length == 1 || !this.isVertical) {
                    return this.children[0].maxHeight;
                } else {
                    return this.children[0].maxHeight + this.children[1].maxHeight + GBoxLayout.GAP;
                }
            }
            return this._maxHeight;
        }
        public set maxHeight(v: number) {
            if(isNaN(v) || v < 0) {
                v = Number.MAX_VALUE / 100;
            }
            this._maxHeight = v;
        }

        public get explicitWidth(): number {
            return this._explicitWidth;
        }
        public set explicitWidth(v: number) {
            if(v != this._explicitWidth) {
                this._explicitWidth = v;
                this.width = v;
                this._sizeDirty = true;
            }
        }

        public get explicitHeight(): number {
            return this._explicitHeight;
        }
        public set explicitHeight(v: number) {
            if(v != this._explicitHeight) {
                this._explicitHeight = v;
                this.height = v;
                this._sizeDirty = true;
            }
        }

        public get x(): number {
            return this._x;
        }
        public set x(v: number) {
            if(v != this._x) {
                this._x = v;
                this._posDirty = true;
            }
        }
        public get y(): number {
            return this._y;
        }
        public set y(v: number) {
            if(v != this._y) {
                this._y = v;
                this._posDirty = true;
            }
        }

        public get focused(): boolean {
            return this._focused;
        }
        public set focused(v: boolean) {
            if(v != this._focused) {
                this._focused = v;
                if(this.render) {
                    if(this._focused) {
                        this.render.className = 'gbox gfocus';
                    } else {
                        this.render.className = 'gbox';
                    }
                }
                
            }
        }

        public get panels(): string[] {
            return this._panels;
        }
        public set panels(v: string[]) {
            if(v != this._panels) {
                this._panels = v;
                this.parsePanels();
                this.panelIndex = 0;
            }
        }

        public get panelIndex(): number {
            return this._panelIndex;
        }
        public set panelIndex(v: number) {
            this._panelIndex = v;
            if(this._panelIndex < this._panelList.length) {
                this._curPanel = this._panelList[this._panelIndex];
            } else {
                if(this._panelList.length > 0) {
                    this._curPanel = this._panelList[this._panelList.length - 1];
                }
            }
        }

        public get isLeaf(): boolean {
            return this.children == null || this.children.length == 0;
        }

        public get hasLabel(): boolean {
            return this._curPanel && this._curPanel.type == GPanelType.TAB;
        }
        public get labelHeight():number {
            if(this._labelContainer && this.hasLabel) {
                return this._labelContainer.offsetHeight + 5;
            }
            return 0;
        }

        public get labelWidth():number {
            if(this._labelContainer) {
                return this._labelContainer.offsetWidth + 5;
            }
            return 0;
        }
        public get oneLabelWidth(): number {
            let len = this._panelList.length;
            if(len <= 0) {
                len = 1;
            }
            return this.labelWidth / len;
        }
        
        public removePanel(panel: GPanel) {
            let panelname = panel.name;
            let panelIndex = this.panels.indexOf(panelname);
            if(panelIndex >= 0) {
                this.panels.splice(panelIndex, 1);
                this._panelList.splice(panelIndex, 1);
                panel.parent = null;
            }
            if(panel == this._curPanel) {
                this.panelIndex = 0;
                this._curPanel = this._panelList[0];
            }
            this.renderPanel();
        }
        public addPanel(panel:GPanel, box: GBox, pos:GDragPosition) {
            let index = pos - GDragPosition.LABEL;
            let panelName = panel.name;
            this.panels.splice(index, 0, panelName);
            this._panelList.splice(index, 0, panel);
            panel.parent = this;
            this.panelIndex = this._panelIndex;
            panel.resize(this.explicitWidth, this.explicitHeight);
            this.renderPanel();
        }
        public resize(): void {
            if(this._panelList) {
                for(let i: number = 0, len: number = this._panelList.length; i < len; i++) {
                    this._panelList[i].resize(this.explicitWidth, this.explicitHeight);
                }
            }
        }

        public renderElement() {
            // if(!this._sizeDirty && !this._posDirty) {
            //     return;
            // }
            if(this.children.length == 2) {
                if(this.split == null) {
                    this.split = new GSplit();
                }
                this.split.boxs = this.children;
                this.split.isVertical = this.isVertical;
                this.split.parent = this;
                this.split.owner = this.owner;
                if(this.isVertical) {

                    this.split.x = this.x;
                    this.split.y = this.y + this.children[0].explicitHeight - GBoxLayout.GAP_SPLIT;
                    
                    this.split.explicitWidth = this.explicitWidth;
                    this.split.explicitHeight = GBoxLayout.GAP + GBoxLayout.GAP_SPLIT * 2;
                    this.split.width = this.explicitWidth;
                    this.split.height = GBoxLayout.GAP;

                    
                } else {
                    this.split.y = this.y;
                    this.split.x = this.x + this.children[0].explicitWidth - GBoxLayout.GAP_SPLIT;
                    
                    this.split.explicitWidth = GBoxLayout.GAP + GBoxLayout.GAP_SPLIT * 2;
                    this.split.explicitHeight = this.explicitHeight;
                    this.split.width = GBoxLayout.GAP;
                    this.split.height = this.explicitHeight;
                }
                this.split.renderElement();
            } else {
                if(this.split) {
                    this.split.dispose();
                }
                this.split = null;
            }

            if (this.children.length > 0) {
                return;
            }
            
            if(this.render == null) {
                this.render  = document.createElement('div');
                this.render.className = 'gbox';
                this.render.addEventListener('mousedown', this.onFocusBox);
            }
            this.render.style.width = this.explicitWidth + 'px';
            this.render.style.height = this.explicitHeight + 'px';
            this.render.style.left = this.x + 'px';
            this.render.style.top = this.y + 'px';
            this.render.id = this.name;

            this.renderPanel();
            if(this._sizeDirty) {
                this._sizeDirty = false;
                this.resize();
            }
            this._posDirty = false;  
        }

        onFocusBox = (e:MouseEvent) => {
            if(this.owner) {
                this.owner.focusBox = this;
            }
        }
        onLabelClick = (e:MouseEvent) => {
            let selectId = parseInt(e.target['id']);
            if(isNaN(selectId)) {
                return;
            }
            if(this.panelIndex != selectId) {
                this.panelIndex = selectId;
                this.renderPanel();
            }
        }

        onLabelMouseDown = (e:MouseEvent) => {
            let selectId = parseInt(e.target['id']);
            if(isNaN(selectId)) {
                return;
            }
            this._dragPanel = this._panelList[selectId];
            if(document) {
                document.addEventListener('mousemove', this.onLabelMouseMove);
                document.addEventListener('mouseup', this.onLabelMouseUp);
            }
            this._downPos = {x: e.clientX, y: e.clientY};
        }

        onLabelMouseMove = (e:MouseEvent) => {
            if(!this._startDrag && this._downPos) {
                let len = (this._downPos.x - e.clientX) * (this._downPos.x - e.clientX) + (this._downPos.y - e.clientY) * (this._downPos.y - e.clientY);
                if(len > 100) {
                    this._startDrag = true;
                }
            }
            if(this.owner && this._startDrag) {
                let box = this.owner.dragControl.checkOverBox(e.clientX - this.owner.layoutX, e.clientY - this.owner.layoutY);
                this._dropBox = box;
            }
        }

        onLabelMouseUp = (e:MouseEvent) => {
            if(document) {
                document.removeEventListener('mousemove', this.onLabelMouseMove);
                document.removeEventListener('mouseup', this.onLabelMouseUp);
            }
            this.owner.dragControl.clearDrag();

            if(this._dragPanel && this._dropBox) {
                if(this._dropBox.box == this && 
                   this.panels.length == 1) {
                    
                } else {
                    let owner = this.owner;
                    let dragPanel = this._dragPanel;
                    let dropBox = this._dropBox;
                    owner.removePanel(dragPanel);
                    owner.addPanel(dragPanel, dropBox.box, dropBox.pos);
                }
                
            }
            this._dragPanel = null;
            this._dropBox = null;
            this._startDrag = false;
        }

        private disposePanels(): void {
            if(this._panelList) {
                for(let i: number = 0, len: number = this._panelList.length; i < len; i++) {
                    this._panelList[i].dispose();
                }
                this._panelList.length = 0
            }
        }
        public parsePanels(): void {
            this.disposePanels();
            if(this._panels && this.owner) {
                for(let i: number = 0, len: number = this._panels.length; i < len; i++) {
                    let panelID = this._panels[i];
                    let panel = this.owner.getPanel(panelID);
                    panel.parent = this;
                    this._panelList.push(panel);
                }
            }
            this.panelIndex = 0;
        }
        private renderPanel() {
            if(this._conentContainer == null) {
                this.initPanelElement();
            }
            this.renderPanelLabel();
            if(this._panelList) {
                for(let i: number = 0, len: number = this._panelList.length; i < len; i++) {
                    this._panelList[i].renderElement();
                }
            }
            
            if(this._curPanel) {
                this.removeElementChildren(this._conentContainer);
                this.removeElementChildren(this._toolbarContainer);
                if(this._curPanel.contentElement) {
                    this._conentContainer.appendChild(this._curPanel.contentElement);
                }
                if(this._curPanel.toolBarElement) {
                    this._toolbarContainer.appendChild(this._curPanel.toolBarElement);
                }
            }
        }

        private initPanelElement(): void {
            this._conentContainer = document.createElement('div');
            this._conentContainer.className = 'gPanelConent';
            this._labelContainer = document.createElement('span');
            this._labelContainer.className = 'gPanelLabels';
            this._toolbarContainer = document.createElement('span');
            this._toolbarContainer.className = 'gPanelToolbar';
            this.render.appendChild(this._labelContainer);
            this.render.appendChild(this._toolbarContainer);
            this.render.appendChild(this._conentContainer);
        }

        private renderPanelLabel(): void {
            this.removeElementChildren(this._labelContainer);
            this.disposeLabels();
            if(this._panelList.length == 1 && this._panelList[0].type == GPanelType.BLOCK) {
                this._labelContainer.className = 'gPanelLabels none';
            } else {
                this._labelContainer.className = 'gPanelLabels';
                for(let i: number = 0, len: number = this._panelList.length; i < len; i++) {
                    let label = this.createLabel(this._panelList[i], this.panelIndex == i, i);
                    this._labelList.push(label);
                    this._labelContainer.appendChild(label);
                }
            }
            
        }

        private createLabel(panel:GPanel, selected: boolean, index: number): HTMLElement {
            panel.renderLabel();
            let label = document.createElement('span');
            label.className = selected ? 'gLabel gLabelSelect' : 'gLabel';
            if(panel.labelElement) {
                label.appendChild(panel.labelElement);
            } else {
                label.innerHTML = panel.name;
            }
            label.id = index.toString();
            label.addEventListener('click', this.onLabelClick);
            label.addEventListener('mousedown', this.onLabelMouseDown);
            
            return label;
        }
        private disposeLabels(): void {
            for(let i: number = 0, len: number = this._labelList.length; i < len; i++) {
                let label = this._labelList[i];
                label.removeEventListener('click', this.onLabelClick);
            }
        }
        public removeElementChildren(element:HTMLElement): void {
            if(element == null) {
                return;
            }
            if(element.childNodes) {
                while(element.childNodes.length > 0) {
                    element.removeChild(element.childNodes[0]);
                }
            }
        }
        public removeElement(element:HTMLElement) {
            if(element == null) {
                return;
            }
            if(element.parentElement){
                element.parentElement.removeChild(element);
            }
        }
        public dispose(): void {
            this.name = null;        
            this.width = 0;
            this.height = 0;
            if(this.render) {
                this.render.removeEventListener('mousedown', this.onFocusBox);
            }
            this.isVertical = false;
            this.parent = null;
            this.brother = null;
            this.children = [];
            this.render = null;
            this.isMain = false;
            this.split = null;
            this.owner = null;

            this._panels = [];
            this._panelIndex = 0;
            this._minWidth = 0;
            this._minHeight = 0;
            this._maxWidth = 0;
            this._maxHeight = 0;
            this._explicitWidth = 0;
            this._explicitHeight = 0;
            this._x = 0;
            this._y = 0;
            this._sizeDirty = false;
            this._posDirty = false;

            this._panelList = [];
            this._curPanel = null;
        
            this._labelContainer = null;
            this._conentContainer = null;
            this._toolbarContainer = null;

            this._labelList = [];
            this._dragPanel = null;
            this._dropBox = null;
        }
    }
    
}