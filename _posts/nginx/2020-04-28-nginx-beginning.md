---
layout: post
title: Nginx系列之新手入门
date: 2020-04-28
categories: [Nginx]
tags: [Nginx]
excerpt: 简单介绍Nginx的安装、使用与配置，并通过其实现提供静态资源HTTP服务。
---

Nginx是一个高性能的HTTP以及反向代理服务器，同时提供了诸如邮件、TCP/UDP代理服务以及负载均衡等功能。在本文中，将初步的介绍nginx安装、使用及其基本配置，并以一个使用者视角提供一些简单需求下的nginx配置。

## Nginx安装

对于windows用户，[Nginx官网](#http://nginx.org/en/download.html)提供了二进制包的下载。

对于Unix-like的用户，可以使用包管理工具下载，例如：

```sh
# 采用deb包的Linux，如Debian、Ubuntu
$ apt-get install nginx
# 采用rpm包的Linux，如RedHat、CentOS
$ yum install nginx
# MacOS
$ brew install nginx
# FreeBSD
$ pkg_install -r nginx
# ...
```

另外，也可直接通过源码编译。Nginx的源代码BSD协议开源，可通过官网或Github获得其源码。

## Nginx使用

在完成Nginx的安装后，可以通过`nginx`命令启动，并可以使用`nginx -s [signal]`执行特定的操作：

- `reload`：重新加载配置
- `reopen`：重新打开日志文件
- `stop`：快速退出nginx，无论是否存在正在处理中的请求
- `quit`：在所有处理中的请求结束后再退出Nginx

另外，Nginx提供了下列几个参数：

- `-h`：显示帮助信息
- `-v`：显示版本信息
- `-V`：显示版本及编译配置信息
- `-t`：检查配置文件正确性
- `-T`：检查配置文件正确性并输出配置信息
- `-q`：检查配置时不输出非错误的信息
- `-p prefix`：指定路径前缀
- `-c filename`：指定配置文件
- `-g directives`：传入配置文件外的参数

启动nginx后，可访问本地80端口测试nginx是否正常运行。

## Nginx配置

Nginx配置文件通常位于`/usr/local/nginx/conf`、`/etc/nginx`或`/usr/local/nginx/etc`目录下，在修改配置后可以通过`nginx -t`测试并通过`nginx -s reload`命令重新加载配置。

Nginx配置包括了简单命令以及块命令。其中，块命令中可以包含简单命令以及块命令。其语法规则如下：

```conf
# 简单命令
命令 参数;

# 块命令
块名 {
  命令 参数;
  # ...
}
```

下面是一个简单的Nginx配置示例：

```
use nginx;

http {
  server {
    location / {
      root /data/www;
    }
  }
}
```

在了解了基本的Nginx配置规则后，下面通过几个示例来介绍Nginx的使用。

## 静态内容提供

张三编写了一个本地门户网站，准备通过Nginx将其公开到互联网上。站点内容存放在`/data/www`目录下，需要实现通过服务器的ip可以访问该网站。使用下方的配置替换nginx.conf中的`http`模块。

```conf
http {
  server {
    root /data/www;
  }
}
```

`http`模块包括了有关与HTTP服务的相关配置，它需要位于Nginx主模块上下文中（即配置文件中最外层，而非其他块中）。

`server`块用于定义一个虚拟服务及其配置（即一个站点），它需要位于`http`上下文中。Nginx的http服务支持创建多个虚拟服务，每个虚拟服务对应于一个`http`块中的`server`配置块。对于一个虚拟服务，它默认会监听80端口的所有请求，并根据请求及配置寻找对应的资源。在`server`块中，可使用`root`命令设定资源的目录，即上例中所有的请求将获取`/data/www`目录下定义的资源。

在修改配置文件后，使用`nginx -s reload`重新加载配置文件，即可通过`http://{ip}`（将`{ip}`替换为服务器ip地址）或在本地通过`http://localhost`访问搭建的网站。

随着网站的发展，图片资源文件也越来越多。为了方便对代码的管理，张三决定将图片资源转移到`/data/images`目录下。由于图片目录不再位于站点目录下，所以需要修改nginx配置使当url包含`/images/`是前往`/data/images`目录寻找对应资源。

```conf
http {
  server {
    root /data/www;
    # 等同于：
    # location / {
    #   root /data/www;
    # }

    location /images/ {
      root /data/images;
    }
  }
}
```

`location`块用于对一些特定的URL进行配置，格式为`location [url匹配规则] { }`，它需要位于`server`块或其他`location`块中。

为了实现张三需要的效果，需要定义图片资源对应的location块`location /images/ { }`。当请求路径包含`/images/`时，需要告知nginx资源目录为`/data/images`，所以在location块中，也添加了`root /data/images;`命令指定资源目录。

## 正则匹配

网站的发展越来越快，张三准备在网站中支持音频资源，但是不像图片资源一样都在url中包含`/images/`。为了实现这个需求，可以使用正则表达式匹配资源后缀名。当资源后缀为音频格式时（如`.mp3`、`.wav`等），请求目录将为`/data/musics`，否则仍为`/data/www`或`/data/images`。

```conf
http {
  server {
    # ...

    location ~ \.(mp3|wav)$ {
      root /data/musics;
    }
  }
}
```

在Nginx配置文件中使用正则表达式，需要以`~`作为标志，其后跟着自定的正则规则。例如例子中的`\.(mp3|wav)$`代表了匹配.mp3或.wav结尾的请求地址。

## 多站点

在网站上线后，张三准备将自己的博客也放到服务器上。上一节介绍过，`http`块中可以有多个`server`用于提供多个网站，那为了增加这个博客就只需要再加个`server`块就行了。但是张三很快意识到了一个新的问题，增加了`server`块后检查配置文件，得到了这样一个警告信息：`nginx: [warn] conflicting server name "" on 0.0.0.0:80, ignored`，即多个服务配置监听同个端口，Nginx将忽略后定义的服务配置。为了解决这个问题，张三决定把博客的端口设置为8080。

```conf
http {
  # ...之前的内容

  server {
    listen 8080;

    location / {
      root /data/blog;
    }
  }
}
```

`listen`命令用于指定服务监听的地址及端口，其格式为`listen [地址]:[端口] [其它选项]`。未显式使用`listen`命令的情况下，服务将使用80端口（HTTP）服务或443端口（HTTPS服务）。对于一个服务，可监听多个地址及端口，即`listen`命令可多次使用。下面是`listen`命令的示例：

```conf
listen 192.168.1.1:80;
listen 127.0.0.1;
listen [:::a83f:3d82]:80; # IPv6
listen 443 ssl;
```

对于`listen`命令的选项，有以下几个常用的选项：

- `default_server`：无其它匹配服务的情况下的默认服务，在未指定的情况下第一个server会被隐式设为`default_server`。
- `ssl`：必须使用SSL，即通过HTTPS访问。

但是一直通过ip及端口访问体验非常糟糕，于是张三便购买了自己的域名`zhangsan.com`。通过`zhangsan.com`或`www.zhangsan.com`可以访问门户网站，通过`blog.zhangsan.com`访问博客，无需使用非80端口。于是，就可以使用Nginx的`server_name`命令指定虚拟服务的识别路径。

```conf
http {
  server {
    server_name blog.zhangsan.com;

    # ...
  }

  server {
    server_name zhangsan.com www.zhangsan.com;

    # ...
  }
}
```

`server_name`命令的格式为`server_name hostname1 [hostname2...]`。对于一个`server`块，可分配一个或多个主机名，nginx会根据请求头部的`Host`字段匹配到对应的服务。下面是`server_name`的几个示例：

```conf
server_name www.zhangsan.com;
server_name www.zhangsan.com zhangsan.com;
server_name *.zhangsan.com;
server_name .zhangsan.com; # *.zhangsan.zhangsan.com
server_name *.zhangsan.*;
server_name ~^(www)\.zhangsan\.com$; # 使用较为复杂的正则表达式
server_name _;
server_name "";
```

对于使用通配符的名称，`*`只能在最前端或最后端，例如`w*.zhangsan.com`或`www.zhangsan.*m`是不合法的。

当使用`server_name _`时，该服务将匹配任意路径。当没有使用`server_name`时，会隐式设置为`server_name ""`，该服务为无匹配服务情况下的默认服务。

运行`nginx -s reload`重新加载配置文件后，即可通过`http://zhangsan.com`或`http://www.zhangsan.com`访问门户网站，通过`http://blog.zhangsan.com`访问博客。

## 结束语

本文中简单介绍了关于Nginx的安装、配置以及使用，后续将会继续深入了解Nginx的反向代理、负载均衡等功能，并在源码层面上对Nginx进行分析。

## 参考资料

- [Nginx documentation](#http://nginx.org/en/docs/).
- Dimitri Aivaliotis. *Mastering Nginx*.
- Martin Fjordvald, Clement Nedulcu. *Nginx HTTP Server, Fourth Edition*.
