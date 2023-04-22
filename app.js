const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Koa = require('koa');

const app = new Koa();

// 资源类型常量列表
const mimes = {
  css: 'text/css',
  less: 'text/css',
  gif: 'image/gif',
  html: 'text/html',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  swf: 'application/x-shockwave-flash',
  tiff: 'image/tiff',
  txt: 'text/plain',
  wav: 'audio/x-wav',
  wma: 'audio/x-ms-wma',
  wmv: 'video/x-ms-wmv',
  xml: 'text/xml'
};

// 解析资源类型
function parseMime(url) {
  // path.extname获取路径中文件的后缀名
  let extName = path.extname(url);
  extName = extName ? extName.slice(1) : 'unknown';
  return mimes[extName];
}

const parseStatic = (dir) => {
  return new Promise((resolve) => {
    resolve(fs.readFileSync(dir), 'binary');
  });
};

function getFileStat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, function (err, stats) {
      if (stats) {
        resolve(stats);
      } else {
        reject(err);
      }
    });
  });
}

async function getETag(filePath) {
  const fileBuffer = await parseStatic(filePath);

  const hash = crypto.createHash('md5');

  hash.update(fileBuffer);

  return `"${hash.digest('hex')}"`;
}

async function getLastModified(filePath) {
  const fileStat = await getFileStat(filePath);
  return fileStat.mtime.toGMTString();
}

// 协商缓存: etag, if-none-match; Last-Modified, if-modified-since
function shouldReturn304(ctx, lastModified, etag) {
  if (!ctx.request || !ctx.request.headers) {
    return false;
  }

  const ifModifiedSince = ctx.request.header['if-modified-since'];
  const ifNoneMatch = ctx.request.headers['if-none-match'];

  // console.log('[ifModifiedSince]', ifModifiedSince);
  // console.log('[ifNoneMatch]', ifNoneMatch);

  if (!ifModifiedSince || !ifNoneMatch) {
    return false;
  }

  if (ifModifiedSince) {
    if (ifModifiedSince !== lastModified) {
      return false;
    }
    return true;
  }

  if (ifNoneMatch) {
    if (ifNoneMatch !== etag) {
      return false;
    }
    return true;
  }
}

app.use(async (ctx) => {
  const url = ctx.request.url;
  // console.log('[url]', url);
  if (url === '/') {
    // 访问根路径返回index.html
    ctx.set('Content-Type', 'text/html');
    ctx.body = await parseStatic('./index.html');
  } else {
    const filePath = path.resolve(__dirname, `.${url}`);
    ctx.set('Content-Type', parseMime(url));

    // 强缓存: Expires设置10秒后过期
    ctx.set('Expires', new Date(Date.now() + 10000).toUTCString());

    // 强缓存: Cache-Control max-age=10 设置10秒后过期
    ctx.set('Cache-Control', 'max-age=10');

    // 协商缓存: Last-Modified, if-modified-since;
    const lastModified = await getLastModified(filePath);
    ctx.set('Last-Modified', lastModified);

    // 协商缓存: etag, if-none-match;
    const etag = await getETag(filePath);
    ctx.set('etag', etag);

    if (shouldReturn304(ctx, lastModified, etag)) {
      // console.log('[304]');
      ctx.status = 304;
      return;
    }

    // console.log('[200]');
    ctx.body = await parseStatic(filePath);
  }
});

app.listen(3000, () => {
  console.log('starting at port 3000');
});
