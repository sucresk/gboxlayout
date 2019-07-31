/// <reference path="./GNode.ts" />

namespace gboxLayout {
    export class GPanel extends GNode {
        parent: GBox;
        labelElement: HTMLElement;
        contentElement: HTMLElement;
        toolBarElement: HTMLElement;
        
        name: string;        
        type: GPanelType;

        constructor(id: string = null) {
            super();
            this.name = id;
            this.type = GPanelType.TAB;
        }
        public renderLabel() {
            if(this.labelElement == null) {
                this.labelElement = document.createElement('span');
                this.labelElement.innerHTML = this.name;
            }
        }
        public renderElement() {
            // this.renderLabel();
            // if(this.contentElement == null) {
            //     this.contentElement = document.createElement('div');
            //     let btn = document.createElement('button');
            //     btn.innerHTML = "导出数据";
            //     btn.addEventListener('click', () => {
            //         if(this.parent && this.parent.owner) {
            //             let  data = this.parent.owner.getData();
            //             console.log(JSON.stringify(data));

            //             let layout4Str = '{"name":"main","isVertical":false,"mainIndex":0,"width":1806,"height":842,"children":[{"name":"child1","isVertical":true,"mainIndex":0,"width":400,"height":842,"panels":["test1"],"panelIndex":0},{"name":"child2","isVertical":true,"mainIndex":0,"width":1404,"height":842,"maxWidth":2000,"children":[{"name":"test3","isVertical":false,"mainIndex":0,"width":1404,"height":421,"panels":["test3"],"panelIndex":0},{"name":"child2","isVertical":false,"mainIndex":0,"width":1404,"height":419,"maxWidth":2000,"children":[{"name":"test2","isVertical":false,"mainIndex":0,"width":702,"height":419,"panels":["test2"],"panelIndex":0},{"name":"child2","isVertical":true,"mainIndex":0,"width":700,"height":419,"maxWidth":2000,"panelIndex":0}],"panelIndex":0}],"panelIndex":0}],"panelIndex":0}'
            //             let layout4 = JSON.parse(layout4Str);
            //             this.parent.owner.setData(layout4);
            //         }
            //     })
            //     this.contentElement.appendChild(btn);
            // }
            // if(this.toolBarElement == null) {
            //     this.toolBarElement = document.createElement('div');
            // }
        }
        public dispose() {
            
        }
        public resize(newWidth: number, newHeight: number): void {

        }
    }
}