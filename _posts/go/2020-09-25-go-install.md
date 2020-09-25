---
layout: post
title: Golang安装及golang.org包的安装
date: 2020-09-25
categories: [Go]
tags: [Go, VSCode]
excerpt: 通过二进制安装包、包管理器或源码安装Go，并通过GitHub或通过GOPROXY安装golang.org包。
---

## Golang安装

[Golang官网](https://golang.org)提供了各平台的二进制包，可直接下载并安装。由于某种不可抗力，golang.org被屏蔽无法直接访问，但可以通过官方提供的国内版官网[golang.google.cn](https://golang.google.cn)进行下载。

除了直接通过二进制包安装外，也可通过包管理器安装。如在Ubuntu中使用`apt-get install golang`，或在MacOS中使用`brew install go`下载安装。

另外，也可通过官网或[GitHub](https://github.com/golang/go)下载源码后编译安装，可参考官方提供的[源码安装文档](https://golang.google.cn/doc/install/source)。

## 非预装官方包

在使用Go时，除了Go标准库以外，Google还提供了一些扩展包，但不包括在二进制安装包中，需要另外使用`go get`命令进行安装。例如在VSCode中安装Golang相关扩展插件时需要安装一些第三方包，而它们大多会使用到官方提供的非预装扩展包。官方非预装扩展包的命名以为`golang.org/x/`开头，例如`golang.org/x/tools`，下面列出了各官方非预装扩展包及其用途：

- benchmarks：性能测试支持
- blog：[blog.golang.org](https://blog.golang.org)源码实现
- build：[build.golang.org](https://build.golang.org)源码实现
- crypto：额外的密码学支持
- debug：实验性的Go debugger
- image：额外的图像支持
- mobile：移动端支持
- net：额外的网络支持
- perf：性能分析工具
- pkgsite：[pkg.go.dev](https://pkg.go.dev)源码实现
- review：Gerrit代码review工具支持
- sync：额外的并发支持
- sys：系统调用支持
- text：文本处理支持
- time：额外的时间相关支持
- tools：godoc、goimports等工具
- tour：[tour.golang.org](https://tour.golang.org)源码实现
- exp：实验性以及落后的特性

## golang.org包的安装

由于`golang.org`以及`google.golang.org`在国内无法访问，为了安装这些包，可以通过GitHub下载源码进行安装或在Go13及以上版本中通过设置`GOPROXY`进行安装：

### 通过GitHub下载源码安装

`golang.org`包在GitHub上有对应的镜像，例如`golang.org/x/tools`包对应的GitHub镜像为[`https://github.com/golang/tools`](https://github.com/golang/tools)，`google.golang.org/grpc`包对应的镜像为[`https://github.com/grpc/grpc-go`](https://github.com/grpc/grpc-go)。

在对应的镜像中下载源码后，需要将其放置于`GOPATH`环境变量指定的目录下。例如下载`golang.org/x/tools`包后，需要将其移动到`$GOPATH/src/golang.org/x/tools`目录中。

下面以`golang.org/x/image`为例演示如何进行安装：

```sh
# 下载源码，使用--depth=1只克隆最后一次commit
$ git clone https://github.com/golang/image.git --depth=1
$ mkdir -p $GOPATH/src/golang.org/x
$ mv image $GOPATH/src/golang.org/x
```

### 通过GOPROXY设置代理服务安装（推荐）

Go11加入了go module包依赖管理工具，并增加了`GOPROXY`环境变量设置代理服务。设置该环境变量后，使用`go get`下载包时将通过设置的代理地址下载。当前可使用的代理服务有`https://goproxy.io`、阿里云的`https://mirrors.aliyun.com/goproxy/`等，可根据需求选择。

在使用GOPROXY之前需要开启go module，开启go module的方式为设置`GO111MODULE`环境变量的值为`on`：

```bash
$ export GO111MODULE="on"
```

若使用Go13及以上版本，可使用下面的命令设置代理服务：

```bash
$ go env -w GOPROXY="<proxy>,direct"
```

若使用Go11或Go12，需要使用下面的命令设置：

```bash
$ export GOPROXY="<proxy>"
```

使用`export`命令只会在本次登陆中有效，若需要长期有效需要将其写入`profile`文件中（例如Bash的`.bash_profile`或zsh的`.zshrc`）。

在Windows中可通过下面的命令设置：

```powershell
$env:GOPROXY="<proxy>"
```

在使用命令时，需要将命令中的`<proxy>`替换为对应代理服务的地址。在设置`GOPROXY`后，就可正常使用`go get`命令下载安装`golang.org`包。

## 参考资料

- [阿里云镜像站](https://developer.aliyun.com/mirror/goproxy)
- [goproxy.io](https://goproxy.io/)
- [go如何下载golang.org的包 - ppmoon](https://www.jianshu.com/p/096c5c253f75)
