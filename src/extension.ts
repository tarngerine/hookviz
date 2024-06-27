import * as vscode from "vscode";
import { parseFramerMotion } from "./parser";

export function activate(context: vscode.ExtensionContext) {
  console.log("HIIIIIIIIIIIIIII ACTIVATED");
  context.subscriptions.push(
    vscode.commands.registerCommand("hookviz.show", () => {
      FramerMotionPanel.createOrShow(context.extensionUri);
    })
  );

  vscode.workspace.onDidChangeTextDocument((event) => {
    console.log("CHANGE TEXT DOcUMENT", event.document.languageId);
    if (
      event.document.languageId === "typescript" ||
      event.document.languageId === "typescriptreact" ||
      event.document.languageId === "javascriptreact"
    ) {
      FramerMotionPanel.update(event.document.getText());
    }
  });
  vscode.commands.executeCommand("hookviz.show");
}

class FramerMotionPanel {
  public static currentPanel: FramerMotionPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private static _contextUri: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, uri: vscode.Uri) {
    this._panel = panel;
    FramerMotionPanel._contextUri = uri;
    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, []);
  }

  public static createOrShow(uri: vscode.Uri) {
    const column = vscode.ViewColumn.Beside;

    if (FramerMotionPanel.currentPanel) {
      FramerMotionPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "framerMotionVisualizer",
        "Framer Motion Visualizer",
        column,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(uri, "dist", "webview")],
        }
      );

      FramerMotionPanel.currentPanel = new FramerMotionPanel(panel, uri);
      const text = vscode.window.activeTextEditor?.document.getText();
      if (text) {
        this.update(text);
      }
    }
  }

  public static update(text: string) {
    if (FramerMotionPanel.currentPanel) {
      const graph = parseFramerMotion(text);
      FramerMotionPanel.currentPanel._panel.webview.postMessage({
        type: "update",
        graph,
      });
    }
  }

  private dispose() {
    FramerMotionPanel.currentPanel = undefined;
    this._panel.dispose();
  }

  private _update() {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        FramerMotionPanel._contextUri,
        "dist",
        "webview",
        "assets",
        "index.js"
      )
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        FramerMotionPanel._contextUri,
        "dist",
        "webview",
        "assets",
        "index.css"
      )
    );
    const html = this._getHtmlForWebview(scriptUri, cssUri);

    webview.html = html;
  }

  private _getHtmlForWebview(
    scriptUri: vscode.Uri,
    cssUri: vscode.Uri
  ): string {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Framer Motion Visualizer</title>
                <link rel="stylesheet" href="${cssUri}"></link>
            </head>
            <body>
                <div id="root"></div>
                <script type="module" src="${scriptUri}"></script>
            </body>
            </html>
        `;
  }
}
