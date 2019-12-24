---
layout: post
title: 解决安装Electron缓慢问题
date: 2019-02-28
last_modified_at: 2019-12-24
categories: [Electron]
tags: [Node.js, Electron, npm]
excerpt: 安装Electron过程中下载安装包速度慢的解决方法。
---

在使用npm安装Electron的过程，可能会碰到一直卡在下载安装包的过程中。这时可能会先想到切换到淘宝的镜像下载，会发现也没有效果。例如下面这种情况。

```bash
$ npm i -D electron@latest

> electron@4.0.6 postinstall /tmp/node_modules/electron
> node install.js

Downloading tmp-46341-0-electron-v4.0.6-darwin-x64.zip
[>                                            ] 0.0% (0 B/s)
^C
$ npm i -D electron@latest --registry=https://registry.npm.taobao.org

> electron@4.0.6 postinstall /tmp/node_modules/electron
> node install.js

Downloading tmp-46341-0-electron-v4.0.6-darwin-x64.zip
[>                                            ] 0.0% (0 B/s)
```

## 解决方法

Electron官方提供了一个该情况的解决方法，可以选择手动下载该安装包存放在本地目录中代替网络下载。缓存包包括了名为`electron-v4.0.6-darwin-x64.zip`与`SHASUMS256.txt-4.0.6`的两个文件，这里以在Mac上安装v4.0.6版的Electron为例，可以根据使用的具体版本及平台改变文件名中对应的字段。

首先，需要到Electron的Github发布页面下载上述两个文件，下载地址为`https://github.com/electron/electron/releases/tag/vVERSION`，根据安装的版本更改VERSION字段。例如安装v4.0.6版本可以前往`https://github.com/electron/electron/releases/tag/v4.0.6`下载。在下载完成后，需要将两个文件拷贝到Electron的缓存文件夹。不同平台的缓存文件夹位置如下所述。

- Linux: `$XDG_CACHE_HOME`或`~/.cache/electron/`
- MacOS: `~/Library/Caches/electron/`
- Windows: `$LOCALAPPDATA/electron/Cache`或`~/AppData/Local/electron/Cache/`
- 老版本Electron的缓存文件夹可能会位于`~/.electron`中

另外，也可以通过设置`ELECTRON_CACHE`环境变量指定一个新的缓存文件夹位置。在完成上述操作后，重新运行npm即可完成Electron的安装。

## 2019/12/24更新

由于`@electron/get`包的修改，使上文中方法无效。解决方式为使用`ELECTRON_MIRROR="https://cdn.npm.taobao.org/dist/electron/" npm install electron`命令安装。

## 参考链接

- [安装 - Electron](https://electronjs.org/docs/tutorial/installation)
- [electron/get 修改了镜像的读取地址路径...](https://github.com/cnpm/cnpmjs.org/issues/1530)
