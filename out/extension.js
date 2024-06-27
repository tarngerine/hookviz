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
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
function activate(context) {
    console.log("HIIIIIIIIIIIIIII ACTIVATED");
    context.subscriptions.push(vscode.commands.registerCommand("hookviz.show", () => {
        FramerMotionPanel.createOrShow(context.extensionUri);
    }));
    vscode.workspace.onDidChangeTextDocument((event) => {
        console.log("CHANGE TEXT DOcUMENT", event.document.languageId);
        if (event.document.languageId === "typescript" ||
            event.document.languageId === "typescriptreact" ||
            event.document.languageId === "javascriptreact") {
            FramerMotionPanel.update(event.document.getText());
        }
    });
    vscode.commands.executeCommand("hookviz.show");
}
exports.activate = activate;
class FramerMotionPanel {
    static currentPanel;
    _panel;
    static _contextUri;
    constructor(panel, uri) {
        this._panel = panel;
        FramerMotionPanel._contextUri = uri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, []);
    }
    static createOrShow(uri) {
        const column = vscode.ViewColumn.Beside;
        if (FramerMotionPanel.currentPanel) {
            FramerMotionPanel.currentPanel._panel.reveal(column);
        }
        else {
            const panel = vscode.window.createWebviewPanel("framerMotionVisualizer", "Framer Motion Visualizer", column, {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(uri, "dist", "webview")],
            });
            FramerMotionPanel.currentPanel = new FramerMotionPanel(panel, uri);
            const text = vscode.window.activeTextEditor?.document.getText();
            if (text) {
                this.update(text);
            }
        }
    }
    static update(text) {
        if (FramerMotionPanel.currentPanel) {
            const graph = (0, parser_1.parseFramerMotion)(text);
            FramerMotionPanel.currentPanel._panel.webview.postMessage({
                type: "update",
                graph,
            });
        }
    }
    dispose() {
        FramerMotionPanel.currentPanel = undefined;
        this._panel.dispose();
    }
    _update() {
        const webview = this._panel.webview;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(FramerMotionPanel._contextUri, "dist", "webview", "assets", "index.js"));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(FramerMotionPanel._contextUri, "dist", "webview", "assets", "index.css"));
        const html = this._getHtmlForWebview(scriptUri, cssUri);
        webview.html = html;
    }
    _getHtmlForWebview(scriptUri, cssUri) {
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
//# sourceMappingURL=extension.js.map