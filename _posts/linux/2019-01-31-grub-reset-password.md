---
layout: post
title: 使用GRUB重设Linux用户密码
date: 2019-01-31
categories: [Linux]
tags: [Linux, GRUB]
excerpt: 使用GRUB在无需原密码的情况下重设Linux用户密码。
---

## 前言

在忘记Linux中用户密码的情况下，或是忘记root用户密码无法使用root账户，便可使用GRUB来重设指定用户的密码。

## 操作步骤

1. 重启电脑并进入GRUB，若默认不进入GRUB的情况下可在开机时按住Shift。

2. 选中需要重设密码的系统Image，并按E进行编辑。

3. 在末尾输入`rw init=/bin/bash`，并按Ctrl + X重启。

4. 重启后即可免密以root身份进入系统。

5. 使用`passwd`命令重设用户密码，并使用`reboot`命令重启电脑。

## 结束语

在不同版本的Grub下操作的方式可能会有不同，重设Linux密码的方式也有多种，可根据具体的情况进行选择具体的操作。

## 参考资料

[Ask Ubuntu](https://askubuntu.com/questions/24006/how-do-i-reset-a-lost-administrative-password)
