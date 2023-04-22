# 浏览器缓存

### 缓存类型

- 200(from memory cache)
  - 强缓存: 不请求网络资源，资源存储在内存中，一般存储的有字体、图片、脚本。
- 200(from disk cache)
  - 强缓存: 不请求网络资源，资源存储在磁盘中，一般存储非脚本资源，如 css。
- 304
  - 协商缓存
- 200(from prefetch cache)
  - 请求网络资源

### 启动

`yarn start`

### 注意事项

- 以 Chrome 为测试浏览器，打开 Devtools, 不要勾选 Disable cache 选项，否则缓存测试失效。
