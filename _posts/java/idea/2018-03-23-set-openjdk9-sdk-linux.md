---
layout: post
title: Linux下IDEA无法设置OpenJDK 9为SDK解决方法
date: 2018-03-23
categories: [Java]
tags: [Java, IDEA, OpenJDK]
excerpt: Linux下IDEA无法设置OpenJDK 9为SDK解决方法。
---
## 前言

之前一直在Linux下用OpenJDK 8开发Java应用，随着JDK 10的发布，想着一直都没有用JDK 9，就安装了OpenJDK 9来试试。安装完OpenJDK 9后到IDEA下设置Projects SDK，但是怎么都设置不了，点击了确定就跳出`Cannot find JDK classes in '/usr/lib/jvm/java-9-openjdk-amd64`的错误。刚开始以为是IDEA的问题，更新了IDEA（之前用的2017.3.4，更新到了2017.3.5），但发现没有效果，仍然无法设置SDK。而且查到的资料显示IDEA 2017.3是支持Java 9的，所以就上网搜了一下这个问题，发现了问题的所在及其解决方案。

## 问题原因

因为在Ubuntu下安装JDK是直接用`apt-get install openjdk-9-jdk`安装的OpenJDK 9，但是这样安装后附带的`openjdk-9-jre-headless`包中包含的`lib\jrt-fs.jar`没有被正确地编译。根据launchpad上显示，除Ubuntu外，Debian和OpenSUSE也存在同样的问题，且在我写这篇文章的时候还尚未被修复。

## 解决方法

因为是OpenJDK中`jrt-fs.jar`文件的问题，可以选择以下方法中任意一种。

1. 使用Oracle JDK或其它JDK替换OpenJDK。
2. 使用Oracle JDK等JDK中的`jrt-fs.jar`文件替换`/usr/lib/jvm/java-9-openjdk-amd64/lib`或相应目录下的`jrt-fs.jar`文件。

在替换后，进入IDEA若仍无法设置Project SDK，则可能是因为Cache的问题，只需要在IDEA中执行`File | Invalidate Caches`即可。

## 参考资料

- [https://bugs.launchpad.net/ubuntu/+source/openjdk-9/+bug/1727002](https://bugs.launchpad.net/ubuntu/+source/openjdk-9/+bug/1727002)
- [https://bugs.openjdk.java.net/browse/JDK-8174808](https://bugs.openjdk.java.net/browse/JDK-8174808)
- [https://youtrack.jetbrains.com/issue/IDEA-179481](https://youtrack.jetbrains.com/issue/IDEA-179481)