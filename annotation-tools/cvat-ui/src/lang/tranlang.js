// parser.js
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser'); // 确保导入了 parser
const traverse = require('@babel/traverse').default; // 确保导入了 traverse

const extractTextFromJSX = (code) => {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
            'jsx',
            'typescript',
            'classProperties', // 解析类属性，如果你使用了这种语法的话
            'decorators', // 解析装饰器，如果你使用了这种语法的话
            'dynamicImport', // 解析动态导入
            // 其他可能的插件...
        ],
    });

    const texts = [];

    traverse(ast, {
        JSXText(path) {
            const text = path.node.value.trim();
            if (text) {
                texts.push(text);
            }
        },
        JSXExpressionContainer(path) {
            // 此处可以添加更多逻辑来处理 JSX 表达式
            if (path.node.expression.type === 'StringLiteral') {
                texts.push(path.node.expression.value);
            }
        },
    });

    return texts;
};

const srcDirectory = './../components';
const extensions = ['.js', '.jsx', '.tsx'];

glob(`${srcDirectory}/**/*{${extensions.join(',')}}`, (err, files) => {
    if (err) {
        console.error('Error finding files', err);
        return;
    }

    const translations = {};

    //   files.forEach(file => {
    //     const relativePath = path.relative(srcDirectory, file).replace(/\\/g, '.');
    //     const code = fs.readFileSync(file, 'utf-8');
    //     const texts = extractTextFromJSX(code);
    //     translations[relativePath] = texts;
    //   });

    files.forEach((file, index) => {
        const relativePath = path.relative(srcDirectory, file).replace(/\\/g, '.');
        // 替换路径中的分隔符
        const formattedPath = relativePath.replace(/\//g, '_').replace(/\./g, '_');
        const code = fs.readFileSync(file, 'utf-8');
        const texts = extractTextFromJSX(code);

        // 处理文本数组，转换为 {key: value} 格式
        const textObjects = texts.reduce((acc, text, index) => {
            // 移除文本中的空格，并取前20个字符作为key
            // let key = text.replace(/\s/g, '').slice(0, 20);
            let key = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

            // 确保key的唯一性
            let uniqueKey = key;
            let counter = 1;
            while (acc[uniqueKey] !== undefined) {
                uniqueKey = `${key}_${counter}`;
                counter++;
            }
            acc[uniqueKey] = text; // 设置key的值
            return acc;
        }, {});

        translations[formattedPath] = textObjects;
    });
    fs.writeFileSync('translations.json', JSON.stringify(translations, null, 2), 'utf-8');
});
