---
layout: post
title: 利用Github+Jekyll搭建个人博客
date: 2018-03-02
categories: [Jekyll]
tags: [Jekyll, Github, Github Pages, Blog]
excerpt: 利用免费的Github Pages服务以及Jekyll搭建一个静态的个人博客。
---

## 前言

拥有一个个人博客基本上已经接近是开发者的标配之一了，在博客中记录自己的学习过程，分享自己的经验总结，也是促进自己技术成长的重要途径。当前有许多种创建个人博客的方式可以选择，如选择专业的博客网站提供的博客服务，国内有例如CSDN、博客园等，或是自己购买服务器搭建博客。在这里，也是推荐一种新的博客架设方式，也就是使用Github Pages服务搭建自己的博客。通过Jekyll在Github上搭建一个博客是一个很方便的选择，虽然其缺点是只能搭建静态的博客，但也能满足大多数的需求。

## 最简便的方式

现在在Github上已经有着许多的Jekyll主题，若直接使用他人搭建好的主题只需fork对应的repo并修改名称即可。但在这里不介绍这种方式去搭建博客，而是选择在本地安装Jekyll进行搭建。

## 安装Jekyll

首先，要在系统中安装RubyGems。RubyGems是一个Ruby的包管理器，类似于Ubuntu中的apt-get以及RedHat中的yum。在Ubuntu中可以使用`
apt-get install gem`命令安装RubyGems。安装完成后，需要通过RubyGems安装Jekyll和Bunlder。其中，Jekyll是我们需要的网站搭建程序，它是一个静态博客的生成程序。安装完成后只要通过`jekyll new name`命令即可创建一个新的博客站点。

```bash
$ gem install jekyll bundler
$ jekyll new blog
$ cd blog
blog $ bundle exec jekyll serve
```

这样就完成了Jekyll的安装，并使用最后一行的命令启动了服务器，默认情况下可以通过`http://localhost:4000`进行访问。后续要再运行服务只需要进入博客的目录使用最后一行的命令启动即可，不需要再次进行安装。

![博客页面](/assets/images/jekyll/0917bff3/blog.png)

## 目录结构

默认情况下刚生成的博客目录下有以下目录和文件（从Jekyll 3.2开始，之前版本会生成更多的目录，各目录的含义如下文表中所述）。

```text
.
|- _posts
|  |- 2018-03-02-welcome-to-jekyll.markdown
|- .gitignore
|- 404.html
|- about.md
|- _config.yml
|- Gemfile
|- Gemfile.lock
|- index.md
```

其中，_posts文件夹存放要发布的博文，_config.yml是博客的配置文件。在默认情况下，特定的文件如文章、HTML文件等都需要存放在特定的目录下，各目录的名称及其含义如下表。

|---|---|
|目录名|作用|
|_data|存放网站数据，通常为`.yml`、`.yaml`、`.json`格式|
|_drafts|存放草稿|
|_includes|存放需要重用部分的布局|
|_layouts|存放模板|
|_posts|存放发布的文章|
|_sass|存放sass文件|
|_site|默认存放运行时生成的页面|

## 个性化修改

创建的Jekyll博客默认采用了minima主题，若要自定义修改博客的整体结构及样式，可在`_config.yml`文件中移除`theme: minima`。保存后还需对部分文件进行修改，并添加自定义的模板框架。具体关于自定义Jekyll的资料请查阅[Jekyll Docs](https://jekyllrb.com/docs/home/)。

## 上线

在完成Jekyll的搭建后，登录Github，创建一个新的repo，名称为xxx.gihub.io，其中xxx为Github帐号的用户名。完成repo的创建后使用shell进入创建好的Jekyll目录，使用下列命令将目录初始化为git版本库并复制内容至本地。

```bash
blog $ git init
blog $ git remote add origin https://github.com/xxx/xxx.github.io.git
blog $ git pull origin master
```

编辑.gitignore文件，将_site、.sass-cache及.jekyll-metadata加入到其中（生成博客的时候默认会生成，但可能会被git所覆盖，若覆盖只需重新编辑即可）。

```text
_site
.sass-cache
.jekyll-metadata
```

完成后，使用git命令将要上传的文件上传至Github，即可通过xxx.github.io访问搭建好的博客了。

### 使用自定义域名

Github Pages支持自定义域名，使用的方法也很简单，只需在根目录中创建一个CNAME文件，写入自定义的域名地址即可。当然，不要忘记更改DNS的记录到Github Pages的IP地址。设置DNS只需添加一个A记录，指向`192.30.252.153`或是`192.30.252.154`。注意，CNAME文件只支持单个域名，若需要多地址支持需要通过DNS进行设置。

## 广告

前段时间修改了博客的界面后便顺便做了个版本供有兴趣的朋友使用，名为Jekyll Paper，且计划持续进行开发新的功能以及优化界面。Jekyll Paper在大方向上将会和我的博客同步进行更新，也欢迎大家加入开发。Jekyll Paper的项目地址是：[https://github.com/ghosind/Jekyll-Paper](https://github.com/ghosind/Jekyll-Paper)。

## 参考资料

1. [Jekyll](https://jekyllrb.com/)
2. [Github Pages](https://pages.github.com/)