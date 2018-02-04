# Gulp Starter Sandbox

Static site sandbox powered by Gulp.


## Getting started

1. Download and install [Node.js](https://nodejs.org) for your OS.
2. Install Gulp CLI globally on your machine from the command-line: `npm install -g gulp`

```bash
git clone http://github.com/vitaliiburlaka/gulp-starter-sandbox.git
cd gulp-starter-sandbox
npm install
```

### Available Tasks
#### Local Dev server

```
npm start
```

#### Development build

Will generate processed files *(with the source maps)* to the "./dist" directory

```
npm run build
```

#### Production build

Will generate optimized files *(without the source maps)* to the `./dist` directory

```
npm run deploy
```

## Features

- Syles (Sass/SCSS) pre-processing, autoprefixing and minification
- Scripts and npm dependencies (JavaScript) linting, concatenation and uglifying
- Images compression and optimization
- File watching and live-reloading server with BrowserSync
