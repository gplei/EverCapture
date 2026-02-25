# Tips
Deploy web code to //192.168.1.35/
    > sudo cp -r public/* /Library/WebServer/Documents

## Mac
### Keep express server running
- ~/everCapture > caffeinate -i node server.js
## md (markdown)
https://www.markdownguide.org/cheat-sheet/

To view md file, open the file and cmd+shift+v

## javascript
- CommonJS (CJS) using require
- ES Module (ESM) using import
## css
- npx sass crumb.scss crumb.css
- ~/public > npx sass --watch scss/:css/

## git
- local structure
    - ~/everCapture is from 'git clone https://github.com/gplei/everCapture everCapture'
        - it is connecting to a sqlite db which is initialized while running npm install
    - ~/myEverCapture is from 'git clone everCapture myEverCapture'
        - it is connecting to mysql for personal use.
        ~/public/personal/ contains files for develope use that's not part of the web app
    - Cloned old version at /Users/ping/work/oldEC/everCapture
- git clone remote
    - Remove github.log from local keychain
    - go to https://github.com/settings/tokens and click 'Generate new token'
    - Use the new token as password when prompted
- git log
    - % git log > gitLog.txt

## sql
- SQLite Schema

`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    created_at DATETIME
);`
- MySQL Schema

`CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP
);`

### Database usage
- Use ./server/db/config.js to config database usage
- Use mysql as base and personal use, sqlite as backup or for portability
- create scrip that backport new data from sqlite to mysql

# Logs
## 2024
### 09/24
Get the name 'Ever Capture' by ChatGPT.
Created readme.md to outline the app on git.

### 11/19 Tue
Start to code the app.

### 11/21 Thu
first commit with a version without tag after couple days of coding.

### 12/05 Thu
Achieved a stable version.

pushed to github.

Created a dump from pinabc database as ./db/mysql/pinabc_20241205.sql.  This will be the last dump as pinabc is no longer update although it is still running on pigbox.

Database ever_capture contains Admin, Christine and WeiYuan data since it will be used only within family.  Admin is for test purpose.

Database ever_capture_all contains all data from the dump.  On the user table, there is a column active so that the app can show only the active users.

I have [
    {name: n1, tags: [a, b]},
    {name: n2, tags: [a, b]},
    {name: n3, tags: [a, c]}
]
want to save as [
    tag: b, names: [n1, n2],
    tag: c, names: [n3]
]

get all crumb id with tag 'Food'

## 2025

### 01/13
Here are some frequently used execCommand commands:

"bold": Toggles bold formatting.
"italic": Toggles italic formatting.
"underline": Toggles underline formatting.
"createLink": Creates a hyperlink (requires a URL value).
"insertImage": Inserts an image (requires a URL value).
"foreColor": Changes the text color (requires a color value).

## 2026
### 02/24
Move everCaptureTS to everCapture
initial file 256
