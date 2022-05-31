---
layout: post
title: Nginx设置基础认证
date: 2022-05-31
categories: [Nginx]
tags: [Nginx, Basic Auth]
excerpt: 简单介绍在Nginx配置基础认证，并通过htpasswd或openssl工具生成用户密码信息。
---

[基本认证（Basic Authentication）](https://www.ghosind.com/2020/10/30/basic-authentication)是一个简单但常用的鉴权方式，在有一定安全性要求但要求不高的情况下可以使用。本文将简单介绍在Nginx中配置基本认证的步骤。

## Nginx配置

在Nginx配置中，Basic Auth主要涉及到`auth_basic`与`auth_basic_user_file`两个命令。两个命令一般在`location`指令中使用。

`auth_basic`命令用于启用基于HTTP Basic Authentication 协议的身份验证，其语法规则为`auth_basic <string | off>`。`auth_basic`的第一个参数值默认为`off`，代表不开启基础认证。当参数值不为`off`时，表示开启基础认证并将其值设置为`realm`的值。

`auth_basic_user_file`命令指定存放有用于认证的用户名与密码文件的路径，其语法规则为`auth_basic_user_file <file_path>`。指定文件路径的参数值可以使用相对路径或是绝对路径，在不确定的情况下可以直接使用绝对路径避免不必要的麻烦。

## 创建用户信息文件

用户信息文件可以使用`htpasswd`工具创建，`htpasswd`工具在`apache2-utils`（Debian、Ubuntu等）或`httpd-tools`（RedHat、CentOS等）包中。文件内容的格式为：

```
# 注释
user1:pass1
user2:pass2:注释
user3:pass3
```

使用`htpasswd`工具创建用户信息文件时需要指定文件的路径以及用户名，若文件不存在则需要使用`-c`选项。

```
htpasswd -c <file_path> <user>
```

在默认情况下，`htpasswd`将使用Unix环境下的`crypt()`函数对密码进行加密。另外也可以使用其它的加密方式，例如使用`-m`选项选择MD5算法，或是使用`-B`选项选择Bcrypt算法。

除了使用`htpasswd`工具以外，也可以使用`openssl`等工具生成加密后的密码并按照用户信息文件的格式手动创建该文件。例如可以使用`openssl passwd -crypt <password>`命令生成通过`crypt()`函数加密的密码。

> openssl 3.0及之后的版本将会移除`-crypt`选项。

## 示例

下属例子中，我们将分别配置使用基础认证的`/secure`资源以及未使用基础认证的`/insecure`资源。

```
location /insecure {
  # ...
}

location /secure {
  auth_basic "realm";
  auth_basic_user_file conf/htpass;
  # ...
}
```

在修改Nginx配置后，可以使用`sudo nginx -s reload`命令加载Nginx配置。当我们访问`/insecure`资源时，可以直接打开，而访问`/secure`资源时，浏览器将提示需要输入账号与密码进行验证。

## 参考资料

- [HTTP认证之基本认证](https://www.ghosind.com/2020/10/30/basic-authentication)
- [Module ngx_http_auth_basic_module](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)
- [Restricting Access with HTTP Basic Authentication](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/)
- [htpasswd - Manage user files for basic authentication](https://httpd.apache.org/docs/current/programs/htpasswd.html)
- [openssl-passwd](https://www.openssl.org/docs/manmaster/man1/openssl-passwd.html)
