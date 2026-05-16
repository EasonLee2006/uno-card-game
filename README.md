# UNO

### goal
Trying to make a working online UNO card game. \
disclaimer: this is not official UNO, it's just a project for myself.

## How to run locally

- step 1:
clone this repository
```bash
git clone https://github.com/EasonLee2006/uno-card-game.git
```

- step 2:
go to the root directory of this project and install the packages
```bash
cd uno-card-game
npm install
```

- step 3:
start the server
```bash
node dist/server.js
```

- step 4:
go to http://localhost:3000/ in your browser to check the result

## How to develop

**DO NOT modify the files under `dist/` , they are generated with the files under `src/` .**

### frontend
modify the files under `punlic/` as you want. then start the server and go to http://localhost:3000/ to check out the result.

### backend
modify the files under `src/` as you want. then start the server and go to http://localhost:3000/ to check out the result.