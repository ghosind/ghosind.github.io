---
layout: post
title: 浅谈Shell注入
date: 2020-05-18
categories: [安全]
tags: [Shell注入, 网络安全]
excerpt: 通过实际例子介绍Shell注入，并简单地介绍Shell注入的方法及其方法措施。
---

## 什么是Shell注入

Shell注入又被称之为OS命令注入，它指的是利用程序所存在的漏洞，构建含有恶意指令的字符串使目标程序执行攻击者的命令。Shell注入命名来自Unix shell，但大多数允许程序调用命令行接口的系统上运行的程序都可能在无意中引入Shell注入相关的漏洞。具有Shell注入潜在风险的接口包括有Java中的`java.lang.Runtime.exec()`、.NET中的`System.Diagnostics.Process.Start()`等。

相对于SQL注入等漏洞，Shell注入较少被提及，但由于其可以直接接触程序外的资源，通常会更为严重的影响。

写这篇文章是在朋友写的demo程序中发现了一个shell注入漏洞，于是就将该程序改写了一下作为开篇的示例。在下列Java代码中，前端传递docker镜像名至后端服务器，由后端服务器调用`docker pull`命令拉取对应的镜像文件。

```java
String imageName = (String) params.get("imageName");
String cmd = "docker pull " + imageName;
Process process = Runtime.getRuntime().exec(cmd);
// ...
```

当前端传入的`imageName`参数值为正常的镜像名称时（如`nginx`），会执行`docker pull nginx`命令拉取nginx镜像。而当前端传入的`imageName`参数值为`nginx; echo hacked`，即带有恶意指令`echo hacked`时，后端程序将在执行`docker pull nginx`成功后执行`echo hacked`命令。此处为了演示方便以及避免造成误操作，所以采用了直观且无害的`echo`命令。在终端直接运行该命令的结果如下所示：

```sh
# 示例中省略了执行结果与本文无关的一些输出信息
$ docker pull nginx; echo hacked
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
hacked # <- 此处为执行恶意命令的结果
```

接下来，将以一个来自于DVWA中的PHP程序介绍Shell注入的各种方式。

## Shell注入的方式

以下是一个PHP程序，它将接受一个来自客户端的参数ip作为ping命令的参数，并输出运行的结果。

```php
$target = $_REQUEST['ip'];
$cmd = shell_exec('ping -c 4 ' . $target);

echo "<pre>{$cmd}</pre>";
```

本节中将通过上述程序介绍几种Shell注入的方式，示例将采用结果直观且无害的命令作为演示。

- `;` 连续指令

使用连续指令`command1; command2`时，在执行完成`command1`命令后将继续执行`command2`命令。在示例中，当用户输入的参数为`127.0.0.1; echo hacked`时，程序将先执行`ping -c 4 127.0.0.1`命令，执行完成后将继续执行`echo hacked`命令。该命令在终端中运行的输出如下：

```sh
$ ping -c 4 127.0.0.1; echo hacked
PING 127.0.0.1 (127.0.0.1): 56 data bytes
# ... ping的执行结果
4 packets transmitted, 4 packets received, 0.0% packet loss
hacked # <- echo hacked的执行结果
```

- 管道 `|`

通过`command1 | command2`使用管道，会在执行完`command1`后将其输出作为`command2`的输入。例如输入的参数为`127.0.0.1 | grep loss`时，程序会将`ping -c 4 127.0.0.1`命令的输出作为`grep loss`命令的输入。命令`grep loss`将会输出ping命令输出中带有loss的行，例如：

```sh
$ ping -c 4 127.0.0.1 | grep loss
4 packets transmitted, 4 packets received, 0.0% packet loss
```

- `&` 后台执行

在命令后使用`&`表示该命令将在后台执行。当`&`后跟着其他命令时（`command1 & command2`），将会在后台执行`command1`，并在前台执行`command2`。例如命令`ping -c 4 127.0.0.1 & echo hacked`，将会在后台执行`ping -c 4 127.0.0.1`，并执行`echo hacked`命令。通常，该命令的结果如下所示：

```sh
$ ping -c 4 127.0.0.1 & echo hacked
[1] 2333 # <- ping命令的进程号
hacked # <- echo hacked的执行结果
PING 127.0.0.1 (127.0.0.1): 56 data bytes
# ... ping的执行结果
```

注： `ping`命令涉及网络I/O，所以输出在`echo`命令之后，而非`ping`命令在`echo`之后执行。

- `&&`与`||`

`&&`与`||`相类似，使用方式均为`command1 && command2`或`command1 || command2`。二者的区别为`&& command2`中的`command2`仅在`command1`执行成功后（退出码为0）执行，而`|| command2`中的`command2`仅在`command1`执行失败（退出码为非0值）后执行。

- `` `command` ``与`$(command)`

二者的作用类型，都将执行`command`命令。当命令为`command1 $(command2)`时（`` command1 `command2` ``同理），`command2`的输出将作为`command1`的参数。例如用户输入的参数为`$(echo hacked)`时，程序在执行`ping`之前将会先执行`echo hacked`命令。

除了上述几种shell注入的方式以外，例如重定向（`>`、`>>`、`<`、`<<`）等也可能被攻击者所利用。

## Shell注入防御措施

- 避免直接执行用户输入的命令

在程序中应当尽量避免通过命令行接口执行命令，或应当避免直接使用用户输入的数据作为shell命令的参数。如文章开头的Docker命令，可使用Docker提供的API接口拉取对应的镜像而非直接使用`docker pull`命令。

- 对用户输入的参数进行校验

如上文示例中的ping程序，假设它需要的参数为一个IPv4地址，便可通过正则检查参数的格式是否为一个合法的IPv4地址字符串。

```php
$target = $_REQUEST['ip'];
if (!preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $target)) {
  throw new Exception('Invalid ip');
}

$cmd = shell_exec('ping  -c 4 ' . $target);

echo "<pre>{$cmd}</pre>";
```

- 过滤常见的符号

过滤包括上文提到的`|`、`&`、`;`等符号，若需要参数中包括了特定的符号，可对符号进行转义。例如`echo hacked \&`命令将不会在后台执行，其输出结果为`hacked &`。

- 使用黑白名单机制

建立黑白名单，限制命令所允许的参数。

- 使用语言提供的转码方法

部分语言提供了对shell参数进行转码的方法，如php中的`escapeshellarg()`等，但并不能完全信任它们是安全的。

- 使用最少权限的用户运行程序

例如在Web应用中，使用最低需求权限的用户运行应用程序。该措施并非一个真正意义上的防御措施，其旨在于避免被攻击后造成更大的影响，也不仅限于被用于应对Shell注入。

- ...

## 参考资料

- [DVWA](http://www.dvwa.co.uk/)
- [Command Injection - OWASP](https://owasp.org/www-community/attacks/Command_Injection)
- [Code injection - Wikipedia](https://en.wikipedia.org/wiki/Code_injection#Shell_injection)
