export class IntensitySegments {
    constructor() {
        this.intensities = new Map();
    }

    add(from, to, amount) {
        // 先按键排序
        let sortedKeys = Array.from(this.intensities.keys()).sort((a, b) => a - b);
        let updatedIntensities = new Map();

        let appliedAmount = false;
        // console.log('sortedKeys.length=',sortedKeys.length)
        let len = sortedKeys.length;
        if (len > 0) {
            for (let i = 0; i < len; i++) {
                let key = sortedKeys[i];
                if (from > key && !appliedAmount) {
                    // 如果from在key之后，先复制当前的强度变化
                    updatedIntensities.set(key, this.intensities.get(key));
                    continue;
                }

                if (from <= key && !appliedAmount) {
                    // 遇到第一个大于等于from的key时，应用强度变化
                    let baseIntensity = 0;
                    if (updatedIntensities.size > 0) {
                        let lastKey = Array.from(updatedIntensities.keys()).pop();
                        baseIntensity = updatedIntensities.get(lastKey);
                    }
                    updatedIntensities.set(from, baseIntensity + amount);
                    appliedAmount = true;
                }

                // 为剩余的点更新强度
                let currentIntensity = this.intensities.get(key) + (appliedAmount ? amount : 0);
                if (key >= from && key < to) {
                    updatedIntensities.set(key, currentIntensity);
                } else if (key >= to) {
                    updatedIntensities.set(key, currentIntensity - amount);
                }
            }

            // 如果to点超出所有现有的点
            if (to > sortedKeys.pop()) {
                updatedIntensities.set(to, 0);
            }
            {
                sortedKeys = Array.from(updatedIntensities.keys()).sort((a, b) => a - b);

                if (sortedKeys.length > 0) {
                    let key = sortedKeys[0];

                    if (updatedIntensities.get(key) == 0) {
                        updatedIntensities.delete(key);
                    }
                    key = sortedKeys[sortedKeys.length - 2];
                    if (updatedIntensities.get(key) == 0) {
                        key = sortedKeys[sortedKeys.length - 1];
                        updatedIntensities.delete(key);
                    }
                }
            }
        } else {
            updatedIntensities.set(to, 0);
            updatedIntensities.set(from, amount);
        }
        this.intensities = updatedIntensities;
        // console.log('this.intensities=',this.intensities, " len=",this.intensities.size)
    }

    toString() {
        // 按照上述逻辑，toString方法将输出当前所有区间的强度分布情况
        let result = [];
        let sortedKeys = Array.from(this.intensities.keys()).sort((a, b) => a - b);
        for (let key of sortedKeys) {
            result.push(`[${key},${this.intensities.get(key)}]`);
        }
        let ret = `[${result.join(',')}]`;

        console.log(ret);
        return ret;
    }
}

var segments = new IntensitySegments();
segments.toString(); // Should be "[]"
segments.add(10, 30, 1);
segments.toString(); // Should be: "[[10,1],[30,0]]"
segments.add(20, 40, 1);
segments.toString(); // Should be: "[[10,1],[20,2],[30,1],[40,0]]"
segments.add(10, 40, -2);
segments.toString(); // Should be: "[[10,-1],[20,0],[30,-1],[40,0]]"
// Another example sequence:
var segments = new IntensitySegments();
segments.toString(); // Should be "[]"
segments.add(10, 30, 1);
segments.toString(); // Should be "[[10,1],[30,0]]"
segments.add(20, 40, 1);
segments.toString(); // Should be "[[10,1],[20,2],[30,1],[40,0]]"
segments.add(10, 40, -1);
segments.toString(); // Should be "[[20,1],[30,0]]"
segments.add(10, 40, -1);
segments.toString(); // Should be "[[10,-1],[20,0],[30,-1],[40,0]]"
