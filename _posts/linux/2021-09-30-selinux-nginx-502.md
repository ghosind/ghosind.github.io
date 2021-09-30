---
layout: post
title: SELinux服务器Nginx反向代理返回502错误问题
date: 2021-09-30
categories: [Linux]
tags: [Linux, SELinux, Nginx]
excerpt: 修复在SELinux启用的服务器中，使用Nginx反向代理提供Web服务返回502错误的问题。
---

## 场景说明

在启用了SELinux的服务器中，通过Nginx反向代理提供web服务，如下示例配置所示：

```conf
upstream api {
  127.0.0.1:6000;
}

server {
  # ...

  location / {
    proxy_pass http://api;
    # ...
  }
}
```

开启Nginx服务后，访问其提供的Web服务，得到502 Bad Gateway错误。查看API服务日志，发现无请求记录，而Nginx的error.log文件中存在以下记录：

```shell
tail /var/log/nginx/error.log
# [crit] 16384#16384: *30 connect() to 127.0.0.1:6000 failed (13: Permission denied) while connecting to upstream, ...
```

## 问题原因

在默认情况下，SELinux只允许部分端口提供对外的web服务，若反向代理上游服务使用的端口不在允许端口列表中（通常允许的端口默认为`80`，`81`，`443`，`488`，`8008`，`8009`，`8443`与`9000`），则将会出现上述Permission denied错误。

了解问题的原因后，我们可以通过`semanage`命令查看当前允许的端口：

```shell
semanage port --list | grep http_port_t
# http_port_t                    tcp      80, 81, 443, 488, 8008, 8009, 8443, 9000
```

## 解决方法

为了实现对外开放，我们可以通过`semanage`命令添加端口规则：

```shell
# 添加开放的端口规则
semanage port --add --type http_port_t --proto tcp 6000
semanage port --list | grep http_port_t
# http_port_t                    tcp      6000, 80, 81, 443, 488, 8008, 8009, 8443, 9000
```
