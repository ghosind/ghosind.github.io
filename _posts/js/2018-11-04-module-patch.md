---
layout: post
title: 使用patch-package修改Node.js依赖包内容
date: 2018-11-04
categories: [Node.js]
tags: [Node.js, Patch, NPM, Yarn]
excerpt: 使用patch-package修改依赖包内容，为依赖包创建补丁。
---

## 前言

公司项目中使用了[kue-scheduler](https://github.com/lykmapipo/kue-scheduler)包，但是在使用中发现了该包中的一个bug。在debug的过程中直接修复了该漏洞，并向该项目提了PR，作者也很快做出了反应。因为该项目疑似已不再维护，代码被合并后作者也未发布新版本。因为后续功能的开发受该bug的影响，只能采用修改内容创建补丁的方式修复bug。

本文中创建补丁的方式为使用了[patch-package](https://github.com/ds300/patch-package)，可能还有更多类似的工具可以使用，有兴趣的朋友可以自己探索。

## 安装patch-package

patch-package包可以通过npm进行安装。

```bash
npm i patch-package --save-dev
```

或者也可以通过yarn进行安装。

```bash
yarn add --dev patch-package postinstall-postinstall
```

## 创建补丁

在修改依赖包内容后，就可以运行patch-package创建patch文件了。

```bash
$ npx patch-package package-name   # 使用npm
$ yarn patch-package package-name  # 使用yarn
```

运行后通常会在项目根目录下的patches目录中创建一个名为`package-name+version.patch`的文件。将该patch文件提交至版本控制中，即可在之后应用该补丁了。

## 部署

完成上述操作后，最后还需要修改package.json的内容，在scripts中加入`"postinstall": "patch-package"`。

```json
"scripts": {
  "postinstall": "patch-package"
}
```

至此，在后续运行`npm install`或是`yarn install`命令时，便会自动为依赖包打上我们编写的补丁了。
