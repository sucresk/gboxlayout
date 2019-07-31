# gboxlayout

一个布局库
布局编辑器 https://sucresk.github.io/gboxlayout/

使用方法：
1.先在布局编辑器中编辑初始布局，点击保存到剪切板。
2.将数据粘贴到代码中，初始化布局

let appContainer = document.getElementById('container'); // 布局的容器
let layoutStr = `{
            "name": "main",
            "isVertical": false,
            "mainIndex": 0,
            "width": 1806,
            "height": 842,
            "children": [],
            "panels":["panel0"],
            "panelIndex": 0
        }` // 布局数据可以把在编辑器中保存的数据粘贴到这里
let layoutData = JSON.parse(layout4Str);
let layout = new gboxLayout.GBoxLayout();
layout.registPanel('panel0', new LayoutPanel('panel0')); //对应的面板 LayoutPanel需要自己定义，继承gboxLayout.GPanel类
layout.setContainer(appContainer);
layout.setData(layoutData);