---
layout: post
title: 30天自制操作系统第1天 - Hello World
date: 2021-04-28
categories: [OS]
tags: [OS, 操作系统, 30天自制操作系统]
excerpt: 通过NASM汇编的DB等指令实现制作hello world程序的软盘镜像文件，并通过qemu模拟器运行。
---

> 在拖了一个月后终于开始写《30天自制操作系统》的第一天内容记录，在写本文时对应的项目已经进行到第21天运行由C编写的应用程序，但也卡在该部分暂时没有进展。

开始自制操作系统的第一天，我们的目标是要实现启动虚拟机并在屏幕上打印`hello, world`文字。下面就开始第一天的内容吧。

## 汇编实现

```nasm
; 第一部分：FAT文件系统信息
  DB    0xeb, 0x4e        ; 跳转指令
  DB    0x90              ; NOP指令
  ; 略
  DB    "FAT12   "        ; 文件系统类型（8字节）

  RESB  18                ; 空18字节

; 第二部分：程序主体
  DB    0xb8, 0x00, 0x00, 0x8e, 0xd0, 0xbc, 0x00, 0x7c
  DB    0x8e, 0xd8, 0x8e, 0xc0, 0xbe, 0x74, 0x7c, 0x8a
  DB    0x04, 0x83, 0xc6, 0x01, 0x3c, 0x00, 0x74, 0x09
  DB    0xb4, 0x0e, 0xbb, 0x0f, 0x00, 0xcd, 0x10, 0xeb
  DB    0xee, 0xf4, 0xeb, 0xfd

; 第三部分：信息显示部分数据
  DB    0x0a, 0x0a        ; 两个换行
  DB    "hello, world"
  DB    0x0a              ; 换行
  DB    0

  RESB  0x1fe - ($ - $$)  ; 填写0x00，直到0x001fe

  DB    0x55, 0xaa

; 第四部分：启动区外的内容
  DB    0xf0, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00
  RESB  4600
  DB    0xf0, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00
  RESB  1469432
```

文中假定读者对汇编已经有一定的了解，但在此处也对出现的指令做简单的介绍。在`NASM`汇编中，`DB`指令的作用为写入一个字节指定内容，`RESB`伪指令为预留一定长度的的空间，并在其中使用`0x00`进行填充。`RESB`指令之所以称之为伪指令，是因为该类指令并非真实的x86指令，而是用于指示汇编器的指令。

程序的第一部分为FAT12文件系统的头部信息，在书中作者对该部分的内容做了大致的描述。在后面笔者计划将通过另外的文章具体介绍FAT系列文件系统，对该文件系统有兴趣的读者也可另外查阅相关资料，在最后的参考资料中将给出部分FAT文件系统的相关资料。

第二部分为程序指令的主体部分，但我们在本文中先不介绍该部分的内容，在第二天的内容中我们将具体分析该部分的内容。

第三部分为信息数据部分，本文中我们将只关注其中两行指令。`RESB 0x1fe - ($ - $$)`指令的作用为从当前位置起至`0x1fe`的空间将被预留并使用`0x00`进行填充。这里也是我们使用`NASM`改写后与原文代码出现不同的地方。在`NASM`中，`$`代表当前行汇编后的地址，`$$`代表当前程序开始处的地址。

接下去一行的`DB 0x55, 0xaa`是将`0x55aa`写入到`0x1fe`与`0x1ff`两个位置。`0x55aa`是MBP（Main Boot Partition，主引导分区）结束的标识符。在计算机的Legacy启动模式下，硬盘、软盘等介质的第一个扇区将作为主引导分区使用，该扇区使用`0x55aa`作为结束的标识符。

最后，是FAT文件系统的其它填充数据。同样，我们在本文中也不关注该部分的内容，只需要知道我们会将镜像文件填充至1.44MB大小。

## 制作镜像文件

在了解了程序的构成后，我们需要将该汇编程序制作为`img`镜像来使用。

在前文中我们提到了将使用`NASM`作为汇编器，在这里我们可以使用下面的命令将`helloos.asm`制作为`helloos.img`镜像文件。

```bash
$ nasm -f bin helloos.asm -o helloos.img
```

在上面的命令中，主要由几个部分构成：

- `-f bin`：`NASM`的`-f`选项用于指定输出文件的格式，可选的格式包括由`elf`、`macho`、`win`、`bin`等。在此处我们选择输出的格式为`bin`，即二进制文件。
- `helloos.asm`：不使用选项指定的为源文件列表，该部分可包括多个源文件。
- `-o helloos.img`：`NASM`的`-o`参数用于指定输出文件的路径，此处我们将输出文件保存为当前文件夹下的`helloos.img`文件。

## 运行与结果

《30天自制操作系统》该书编写的年代流行的主要介质还是软盘，所以编写后会将程序安装至软盘上。但是现在软盘与软盘驱动器早就被淘汰了，所以我们使用`qemu`模拟器来运行上述程序（当然作者在书中也是使用了`qemu`，只是写在了第1天第一部分靠后的内容里）。

因为笔者本身使用Mac而非Windows，便也不使用作者提供的`qemu`程序，而是至今使用当前较新的版本。`qemu`提供了许多不同架构的模拟程序，例如`qemu-system-i386`(32位x86)、`qemu-system-x86_64`（64位x86）、`qemu-system-arm`、`qemu-system-mips`等。因为我们的主要是编写针对32位x86平台的操作系统，所以此处我们选择`qemu-system-i386`作为使用的模拟程序。

因为我们是模拟软盘运行，所以需要使用`qemu`的`-fda`选项。`-fda <file>`选项即将`<file>`所指的文件当作软件镜像使用。

```bash
$ qemu-system-i386 -fda helloos.img
```

通过运行上述命令，我们可以得到类似于下图所示的结果：

![hello world](https://dp34867p1nwv4.cloudfront.net/os/hariboteos-1/helloos.png)

本文代码保存于[https://github.com/ghosind/HariboteOS/tree/main/day1](https://github.com/ghosind/HariboteOS/tree/main/day1)中，其中部分代码与文中可能存在部分差异。

## 参考资料

- 川合秀实, *30天自制操作系统*.
- [NASM Documentation](https://www.nasm.us/docs.php)
- [FAT File System](https://www.ntfs.com/fat_systems.htm)
