"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFramerMotion = void 0;
const typescript_1 = __importStar(require("typescript"));
function parseFramerMotion(source) {
    const sourceFile = typescript_1.default.createSourceFile("file.tsx", source, typescript_1.default.ScriptTarget.Latest, true);
    const hooks = [];
    const components = [];
    function visit(node) {
        if (typescript_1.default.isVariableDeclaration(node) &&
            node.initializer &&
            typescript_1.default.isCallExpression(node.initializer)) {
            const variableDeclarator = node.name;
            const callExpression = node.initializer;
            if (typescript_1.default.isIdentifier(variableDeclarator) &&
                typescript_1.default.isIdentifier(callExpression.expression)) {
                const functionName = callExpression.expression.getText();
                if (functionName === "useMotionValue" ||
                    functionName === "useTransform") {
                    const hook = {
                        type: functionName,
                        outputs: [variableDeclarator.getText()],
                        inputs: callExpression.arguments.map((arg) => arg.getText()),
                    };
                    hooks.push(hook);
                }
            }
        }
        // if (
        //   ts.isVariableDeclaration(node) &&
        //   node.initializer &&
        //   ts.isTaggedTemplateExpression(node.initializer)
        // ) {
        //   const tagName = node.initializer.tag.getText();
        //   if (tagName.startsWith("styled(") && tagName.includes("motion.")) {
        //     const componentName = node.name.getText();
        //     const motionType = tagName.match(/styled\(motion\.(\w+)\)/)?.[1];
        //     if (motionType) {
        //       components.push({
        //         name: componentName,
        //         type: "styled-motion",
        //         props: {},
        //       });
        //     }
        //   }
        // }
        if (typescript_1.default.isJsxElement(node) || typescript_1.default.isJsxSelfClosingElement(node)) {
            const element = typescript_1.default.isJsxElement(node) ? node.openingElement : node;
            const tagName = element.tagName.getText();
            if (tagName.startsWith("motion.")) {
                const props = {};
                element.attributes.properties.forEach((prop) => {
                    if ((0, typescript_1.isJsxAttribute)(prop) && prop.initializer) {
                        const propName = prop.name.getText();
                        if (propName === "style" && prop.initializer) {
                            // Extract style props
                            const styleProps = extractJsxObjectLiteralProps(prop.initializer);
                            Object.assign(props, styleProps);
                        }
                    }
                });
                components.push({
                    type: tagName,
                    props,
                });
            }
        }
        typescript_1.default.forEachChild(node, visit);
    }
    typescript_1.default.forEachChild(sourceFile, visit);
    return { hooks, components };
}
exports.parseFramerMotion = parseFramerMotion;
function extractJsxObjectLiteralProps(node) {
    const props = {};
    if (typescript_1.default.isJsxExpression(node) &&
        node.expression &&
        typescript_1.default.isObjectLiteralExpression(node.expression)) {
        const objectLiteral = node.expression;
        objectLiteral.properties.forEach((prop) => {
            if (typescript_1.default.isPropertyAssignment(prop) ||
                typescript_1.default.isShorthandPropertyAssignment(prop)) {
                const propName = prop.name.getText();
                // It's possible for it to be JS shorthand assignment
                const propValue = typescript_1.default.isShorthandPropertyAssignment(prop)
                    ? propName
                    : prop.initializer.getText();
                props[propName] = propValue;
            }
        });
    }
    return props;
}
//# sourceMappingURL=parser.js.map