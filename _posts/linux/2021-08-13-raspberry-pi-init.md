---
layout: post
title: 无图形化Raspberry Pi OS配置
date: 2021-08-13
categories: [Linux]
tags: [Linux, Raspberry Pi OS, Raspberry Pi5]
excerpt: 简单介绍设置无图形化界面的Raspberry Pi OS Lite的无线网络、开启SSH以及替换apt源。
---

本文内容适用于树莓派官方维护的无图形界面版Raspberry Pi OS，主要为使用新机时连接wifi、开启SSH以及替换apt为国内源等问题。

## 配置wifi

在具有图形化界面的Linux中，可以通过图形化界面轻易地完成wifi的配置。对于没有图形化界面版的Raspberry Pi OS，可以通过以下两种方式连接wifi：

- 连接显示器并启动后，编辑`/etc/wpa_supplicant/wpa_supplicant.conf`文件
- 在SD卡的根目录中创建并编辑`wpa_supplicant.conf`文件

`wpa_supplicant.conf`文件的内容，可参考以下示例：

```conf
country=CN
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
network={
  ssid="wifi1的ssid"
  psk="wifi1的密码"
  key_mgmt=WPA-PSK
}
network={
  ssid="wifi2的ssid"
  psk="wifi2的密码"
  key_mgmt=WPA-PSK
}
```

在该文件中，通过设置多个`network`项可以使其支持多个无线网络。对于未设置密码或使用WEP加密的无线网络，需要将`network`配置中的`key_mgmt`项设置为`NONE`并将`psk`设置为`wep_key0`。

## 开启并配置SSH

要使树莓派支持SSH，只需要在SD卡根目录中添加一个空白的`ssh`文件即可。在使用终端进行操作时，可在对应目录下（例如在MacOS中可能为`/Volumes/boot`目录）运行`touch ssh`命令即可。

在创建`ssh`文件并将SD卡插回树莓派上并启动树莓派后，即可通过账户密码或证书的方式使用SSH远程连接树莓派。在未修改的情况下，Raspberry Pi OS默认的管理员账户为`pi`，密码为`raspberry`。

## 设置apt源

在默认情况下，Raspberry Pi OS中apt使用官方源，在国内使用时速度较慢，可以将其替换为国内源，下面便以替换为清华源为例。

Raspberry Pi OS基于Debian，所以可以参考清华源中的Debian镜像使用帮助
（[https://mirrors.tuna.tsinghua.edu.cn/help/debian/](https://mirrors.tuna.tsinghua.edu.cn/help/debian/)）配置。设置时需要知道当前Debian版本，可以通过查看`/etc/os-release`文件获得。例如通过下面的信息可知当前Debian版本为`buster`。

```
VERSION_CODENAME=buster
```

在获得apt源配置信息后可以通过替换`/etc/apt/source.list`文件修改其使用的源，替换该文件前最好先备份（例如使用`sudo cp source.list source.list.brk`进行备份）。以下为`buster`版本清华apt源配置信息：

```bash
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free
deb https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free
```

在替换配置后需要运行`sudo apt update`命令更新索引文件，以使其生效。

### 修复apt源缺少公钥错误

在运行`apt update`命令时，可能会提示以下信息并返回错误：

```
The following signatures couldn't be verified because the public key is not available: ******
```

出现该错误的原因是更换源后缺少对应的公钥，可通过以下命令添加对应公钥。在使用该命令时需要将`******`部分替换为实际缺少的公钥。

```
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ******
```

如果在运行`apt update`时出现缺少多个公钥的错误信息，可以逐一运行上述命令添加。
