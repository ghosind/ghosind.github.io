---
layout: post
title: React部署于Nginx环境中刷新后404解决方案
date: 2020-08-14
categories: [Nginx]
tags: [Nginx, React, React-Router]
excerpt: 在Nginx角度上，解决React单页应用部署于Nginx环境中，刷新页面后出现404的情况。
---

React单页应用在使用React-Router后，在本地环境中测试一切正常，但在发布到基于Nginx的生产环境后出现了刷新后返回404 Not Found错误。该问题产生的原因大致为加载单页应用后路由改变均由浏览器处理，而刷新时将会请求当前的链接，而Nginx无法找到对应的页面。例如打开页面`http://example.com`后跳转至`http://example.com/page1`，实际上只是由浏览器根据URL解析后加载对应的组件并渲染，而不再向服务器请求对应的页面。当刷新时，浏览器将请求`http://example.com/page1`页面，此时由于资源中并不存在该页面，便导致了返回404的情况。

博主作为一个只负责打包部署的工具人，便不深入写React-Router出现这个问题的原因以及源码上的解决方法，只在Nginx的角度上说说这个问题的解决方法。为了解决这个问题，我们需要在Nginx的配置文件中修改以下内容（通常Nginx配置文件位置为`/etc/nginx/nginx.conf`）：

```conf
server {
  # ...

  location / {
    # ...
    # 增加下列命令，index.html可换为项目中使用的其它文件名
    try_files $uri $uri/ /index.html;
  }
}
```

在修改后使用`nginx -s reload`命令（可能需要root权限）加载修改后的配置即可。在使用该命令之前也可使用`nginx -t`命令检查配置正确性。

## 解决方法解释

对于Nginx的`try_files`命令，它的使用方式为：

```conf
try_files file ... uri;
try_files file ... =code;
```

该命令用于根据指定的参数依次检查寻找对应的文件，若所有文件都找不到将会在内部重定向至最后一个参数指定的文件。当使用`=code`写法时，其代表若找不到对应的文件将返回`code`对应的错误。

另外，上文命令中的`$uri`代表请求的文件及其路径，`$uri/`表示对应路径的目录。例如请求`http://example.com/page`时，`$uri`表示资源目录下是否存在名为`page`的文件，`$uri/`表示名为`page`的目录。

所以，我们在配置文件中增加的命令表示接收到请求时先寻找uri对应的文件或目录，若不存在则返回`index.html`文件。

## 静态文件加载失败问题

在增加上述命令后可能会出现静态资源文件也被解析为`index.html`的情况。碰到这个问题可能可以直接通过修改项目设置的`homepage`字段解决（因为作为工具人没去动前端的代码，没有试一下是否可行），因为在碰到了这个问题，也为了符合主题便提一下如何使用Nginx配置解决。

为了解决该问题，为此我们可能需要增加额外的配置。例如，当静态文件都放置于`/static`目录下时，可在对应的`server`块中增加`/static`对应的`location`指令块，当获取静态文件时Nginx便会按该指令执行。

```conf
location /static/ {
  # ...
}
```

或者可以使用扩展名匹配的方式，但该方法具有一定的局限性，只能匹配到指定后缀的文件。若在后续中加入了其它后缀便可能出现错误，需要碰到时做一定的修改。

```conf
location ~* .(jpg|png|css) {
  # ...
}
```

这两种方案只是作为工具人摸索出来的解决方法，大家可以根据实际情况选择使用的解决方案。

## 参考资料

- [react.js application showing 404 not found in nginx server - Stack Overflow](https://stackoverflow.com/questions/43555282/react-js-application-showing-404-not-found-in-nginx-server)
- [Fix 404 Error When Using React-Router-Dom & Nginx - Coder Rocket Fuel](https://coderrocketfuel.com/article/fix-404-error-when-using-react-rouder-dom-and-nginx)
- [try_files - Nginx Documentation](http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
