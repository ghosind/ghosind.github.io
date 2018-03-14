---
layout: post
title: Grub Rescue修复
date: 2014-05-19
categories: [Linux]
tags: [Linux, Grub]
excerpt: 
---

## 前言

先介绍下环境：windows 7 + ubuntu 12.04 双系统

昨天无聊把win7给还原了，电脑扔着还原自己跑别的地方玩去了，回来一看电脑重启了，出来了grub rescue的界面，当时被吓了一跳，之前也没遇到过这种情况，于是就上网搜了下，找到了下面这种方法。

## 找到grub的目录

先输入ls命令，出来的结果可能不同，以下是我的电脑出来的结果。

```bash
grub rescue: ls
(hd0),(hd0,msdos7),(hd0,msdos6),(hd0,msdos5),(hd0,msdos3),(hd0,msdos2),(hd0,msdos1)
```

然后就得到了你的磁盘分区信息，接下去使用ls (分区名称)/boot/grub 寻找grub所在目录。

```bash
grub rescue: ls (hd0,msdos7)/boot/grub
unknown filesystem
```

如果出现的文字为unknown filesystem则表示grub不在当前分区或目录，继续尝试其他目录直到出现了大量xxx.mod的文件，这就说明你已经找到grub所在分区，然后就可以进入下一步了。

注：我的grub目录在/boot下，而一些资料上所说，也可能直接在/目录下，可根据具体情况尝试。

## 设置root及prefix

根据上一步的查找，我的grub目录在hd0,msdos6这个分区中，于是使用以下命令设置root及prefix。

```bash
grub rescue: set root=(hd0,msdos6)
grub rescue: set prefix=(hd0,msdos6)/boot/grub
```

## 载入normal模块

normal模块位于grub中，文件名为normal.mod，使用insmod命令即可载入。

```bash
grub rescue: insmod /boot/grub/normal.mod
```

当时我查找的资料上写的命令为insmod normal.mod，而我尝试后发现直接使用这条命令不可行，于是就使用了完整的路径。

载入完成后原本灰色字体的grub rescue将变为白色，即说明载入成功（其实我忘了是不是灰色的了，只是在记忆中那个是灰色的字）。

## 进入normal模式

完成这一步后我们就可以见到熟悉的grub界面了，这一步其实很简单，只要输入normal即可。

```bash
grub rescue: normal
```

## 修复grub

进入grub后选择我们的linux系统，然后在终端中输入update-grub，如果你当前用户不是root记得加上sudo，当然我相信这点大家都是知道的。

```bash
user@hostname:~$ sudo update-grub
```

接下去我们需要使用grub-install命令。

```bash
user@hostname:~$ sudo grub-install /dev/sda
```

命令中/dev/sda为你的启动磁盘，根据具体情况修改。

我的/目录挂载在sda7上，一开始以为命令要写为sudo grub-install /dev/sda7，试了好几次都不成功，甚至重启了一次还没成功，然后才意识到不需要加那个7。

至此我们的grub就修复完成了，然后重启就可以直接看到熟悉的grub界面而不是grub rescue了。

这种方法适用于还要继续使用linux的朋友，如果你不再使用linux，插入windows启动盘进入故障诊断模式，然后使用fixmbr即可。

## 参考资料

1. 百度知道：电脑网络工程师老杨的解答

2. 红黑联盟：Grub Rescue修复方法

当时我是参考1中的解答修复的grub，而2则是为了保证本文的客观性参考的文章。