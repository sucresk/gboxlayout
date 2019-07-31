/// <reference path="./GNode.ts" />

namespace gboxLayout {
    export class GSplit extends GNode {
        x: number;
        y: number;
        isVertical: boolean;
        width: number;
        height: number;
        explicitWidth: number;
        explicitHeight: number;
        parent: GBox;
        boxs: GBox[];
        render: HTMLElement; 
        owner: GBoxLayout;

        private _downPos:IPoint = {x:0,y:0};
        private _downBoxA:IRect = {x:0,y:0,width:1,height:1};
        private _downBoxB:IRect = {x:0,y:0,width:1,height:1};
        private _downSplitPos:IPoint = {x:0,y:0};
        
        constructor() {
            super();
        }
        private initEvent():void {
            if(this.render){
                this.render.addEventListener('mousedown', this.onMouseDown);
            }
        }
        public onMouseDown = (e:MouseEvent):void => {
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseup', this.onMouseUp);
            this._downPos.x = e.clientX;
            this._downPos.y = e.clientY;
            let boxA = this.boxs[0];
            let boxB = this.boxs[1];
            this._downBoxA.x = boxA.x;
            this._downBoxA.y = boxA.y;
            this._downBoxA.width = boxA.explicitWidth;
            this._downBoxA.height = boxA.explicitHeight;
            this._downBoxB.x = boxB.x;
            this._downBoxB.y = boxB.y;
            this._downBoxB.width = boxB.explicitWidth;
            this._downBoxB.height = boxB.explicitHeight;
            this._downSplitPos.x = this.x;
            this._downSplitPos.y = this.y;
        }
        public onMouseUp = (e:MouseEvent): void => {
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('mouseup', this.onMouseUp);
        }
        public onMouseMove = (e:MouseEvent): void => {
            let offX = 0;
            let offY = 0;
            if(this.isVertical) {
                offY = e.clientY - this._downPos.y; 
            } else {
                offX = e.clientX - this._downPos.x; 
            }
            if(this.owner) {
                this.owner.moveSplit(this, this._downSplitPos, this._downBoxA, this._downBoxB, offX, offY);
            }
        }
        public renderElement() {
            if (this.boxs.length < 2) {
                return;
            }
            if (this.render == null) {
                this.render  = document.createElement('div');
                this.render.className = 'gsplit';

                if (this.isVertical) {
                    this.render.className += ' gsplit_v';
                } else {
                    this.render.className += ' gsplit_h';
                }
                this.initEvent();
            }
            
            this.render.style.width = this.explicitWidth + 'px';
            this.render.style.height = this.explicitHeight + 'px';
            
            this.render.style.left = this.x + 'px';
            this.render.style.top = this.y + 'px';
            this.render.id = this.id.toString();
        }
        public dispose() {
            if(this.render){
                this.render.removeEventListener('mousedown', this.onMouseDown);
            }
            if(window) {
                window.removeEventListener('mousemove', this.onMouseMove);
                window.removeEventListener('mouseup', this.onMouseUp);
            }
        }
    }
    
}