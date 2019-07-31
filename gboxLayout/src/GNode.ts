namespace gboxLayout {
    export class GNode {
        public static nodeNum: number = 0;
        public id: number = ++GNode.nodeNum;
    }
}