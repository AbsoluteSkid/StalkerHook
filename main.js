// ignore my bad code

const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const userpath = path.join(app.getPath("userData"), 'stalkerhook.json');
let loginWindow;
let mainWindow;

function ReadUserData() {
    try {
        const data = fs.readFileSync(userpath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return false;
    }
}

function WriteUserData(data) {
    if (data.hasOwnProperty('webhook_token') && data.webhook_token === null) {
        delete data.webhook_token;
    }
    fs.writeFileSync(userpath, JSON.stringify(data));
}

async function WebhookExists(url) {
    try {
        if (!url.trim() || !url.startsWith('https://discord.com/api/webhooks/')) {
            return false;
        }
        const response = await fetch(url);
        if (response.status === 200) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

function login() {
    console.log("Login window loaded!");
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
    loginWindow = new BrowserWindow({
        title: 'StalkerHook',
        width: 470,
        height: 320,
        frame: false,
        resizable: false,
        movable: true,
        icon: path.join(__dirname, 'stalkerhook.ico'),
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    loginWindow.loadFile(path.join(__dirname, 'ui', 'html', 'login.html'));
}

function main() {
    console.log("Main window loaded!");
    if (loginWindow) {
        loginWindow.close();
        loginWindow = null;
    }
    mainWindow = new BrowserWindow({
        title: 'StalkerHook',
        width: 900,
        height: 700,
        resizable: false,
        movable: true,
        icon: path.join(__dirname, 'stalkerhook.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    mainWindow.loadFile(path.join(__dirname, 'ui', 'html', 'main.html'));
}

async function LoadApp() {
    console.log("Loading window...");
    const userData = ReadUserData();

    if (userData && typeof userData.webhook_token === 'string' && await WebhookExists(userData.webhook_token)) {
        main();
    } else {
        login();
    }
}

app.whenReady().then(() => {
    LoadApp();
});

ipcMain.handle('get-user-data-path', (event) => {
    return userpath;
});

ipcMain.handle('write-userdata', (event, data) => {
    WriteUserData(data);
});

ipcMain.handle('read-userdata', () => {
    return ReadUserData();
});

ipcMain.on('open-main-window', () => {
    main();
});

ipcMain.on('open-login-window', () => {
    login();
});