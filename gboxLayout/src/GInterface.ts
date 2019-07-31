namespace gboxLayout {
    export enum GPanelType {
        BLOCK,
        TAB
    }
    export enum GDragPosition {
        TOP,
        BOTTOM,
        LEFT,
        RIGHT,
        LABEL,
    }
    export type GBoxData = {
        name: string,
        isVertical: boolean,
        mainIndex: number, // -1,0,1
        width: number,
        height: number,
        minWidth?: number,
        minHeight?: number,
        maxWidth?: number,
        maxHeight?: number,
        children?: GBoxData[],
        panels?: string[],
        panelIndex?: number
    }

    export interface IPoint {
        x: number;
        y: number;
    }
    export interface IRect extends IPoint{
        width: number;
        height: number;
    }
} 