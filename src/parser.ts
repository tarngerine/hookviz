import ts, { isJsxAttribute } from "typescript";

interface MotionHook {
  type: "useMotionValue" | "useTransform";
  outputs: string[];
  inputs: string[];
}

interface MotionComponent {
  type: string;
  props: Record<string, string>;
}

interface ParsedResult {
  hooks: MotionHook[];
  components: MotionComponent[];
}

export function parseFramerMotion(source: string): ParsedResult {
  const sourceFile = ts.createSourceFile(
    "file.tsx",
    source,
    ts.ScriptTarget.Latest,
    true
  );

  const hooks: MotionHook[] = [];
  const components: MotionComponent[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const variableDeclarator = node.name;
      const callExpression = node.initializer;

      if (
        ts.isIdentifier(variableDeclarator) &&
        ts.isIdentifier(callExpression.expression)
      ) {
        const functionName = callExpression.expression.getText();
        if (
          functionName === "useMotionValue" ||
          functionName === "useTransform"
        ) {
          const hook: MotionHook = {
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

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const element = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = element.tagName.getText();
      if (tagName.startsWith("motion.")) {
        const props: Record<string, any> = {};
        element.attributes.properties.forEach((prop) => {
          if (isJsxAttribute(prop) && prop.initializer) {
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

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return { hooks, components };
}

function extractJsxObjectLiteralProps(node: ts.Node): Record<string, string> {
  const props: Record<string, string> = {};

  if (
    ts.isJsxExpression(node) &&
    node.expression &&
    ts.isObjectLiteralExpression(node.expression)
  ) {
    const objectLiteral = node.expression;
    objectLiteral.properties.forEach((prop) => {
      if (
        ts.isPropertyAssignment(prop) ||
        ts.isShorthandPropertyAssignment(prop)
      ) {
        const propName = prop.name.getText();
        // It's possible for it to be JS shorthand assignment
        const propValue = ts.isShorthandPropertyAssignment(prop)
          ? propName
          : prop.initializer.getText();
        props[propName] = propValue;
      }
    });
  }

  return props;
}
