---
layout: post
title: Linux创建新用户并设置SSH证书登录
date: 2021-11-10
categories: [Linux]
tags: [Linux, SSH]
excerpt: Linux下使用`useradd`命令创建新用户，并设置密码或生成证书设置SSH登录。
---

## 创建用户

要在Linux下创建一个新的用户，需要登录到`root`用户或是具有`sudo`权限的用户中，然后使用`useradd`命令创建用户：

```bash
# 若登录root用户则无需使用sudo
$ sudo useradd <user>
```

在创建用户后，可以使用`su - <user>`命令变更当前用户为新创建的用户，测试是否创建成功（测试后可通过`exit`命令退回到当前用户）。`su`命令中的`-`代表变更用户后将变更实际登录的环境（环境变量、当前目录等）。

在创建用户后，可使用`passwd <user>`命令为其设置登录密码。在某些发行版中，执行`useradd`命令默认需要设置密码，若不需要密码则需要添加`--disabled-password`选项禁用密码。

## 设置SSH证书登录

在创建用户后，我们可以使用`ssh-keygen`命令生成密钥对，用于通过SSH使用证书而无需密码登录到Linux账户。例如下面使用`ssh-keygen`命令生成一个新的RSA密钥对，该密钥对保存在`/home/xxx/.ssh/`目录下，分别为私钥文件`id_rsa`与公钥文件`id_rsa.pub`（创建时可自定义文件名及其所保存的目录）：

```bash
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/home/xxx/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again: 
Your identification has been saved in /home/xxx/.ssh/id_rsa.
Your public key has been saved in /home/xxx/.ssh/id_rsa.pub.
The key fingerprint is:
...
The key's randomart image is:
...
```

在创建密钥对后，我们要在需要使用要设置SSH登录的用户，创建`~/.ssh/authorized_keys`文件（若`~/.ssh`文件夹不存在需要手动创建并设置其访问权限），设置该文件的访问权限为当前用户可读/写，并将公钥文件`id_rsa.pub`的内容添加到该文件中：

```bash
# 若~/.ssh目录不存在
$ mkdir ~/.ssh
# 设置.ssh目录权限为只有当前用户可读/写/执行
$ chmod 700 ~/.ssh
$ cd ~/.ssh
$ touch authorized_keys
# 选择喜欢的编辑器编辑authorized_keys文件，将公钥文件id_rsa.pub的内容写入其中
# $ emacs authorized_keys
# 设置其访问权限为当前用户可读/写
$ chmod 600 authorized_keys
```

需要注意的是，此处`~/.ssh`目录与`~/.ssh/authorized_keys`文件对应的权限必须设置正确，否则将出现无法登录的情况。

通过上述设置后，我们就可以使用`ssh`命令通过证书而无需密码登录到Linux账户了。

```bash
# key_file为密钥文件
$ ssh -i <path>/<key_file> <user>@<host>
```

若公钥文件丢失只保留有私钥，或是使用第三方提供的密钥对的情况下（例如AWS EC2只提供私钥文件下载），可以使用`ssh-keygen -f <path>/<private_key> -y`命令获取其对应的公钥内容。

## `ssh-keygen`命令部分参数

`ssh-keygen`命令支持通过`-t`选项生成下列四种类型的密钥，若未指定`-t`选项，则默认生成`rsa`类型的密钥。

- `dsa`
- `ecdsa`
- `ed25519`
- `rsa`

另外，`ssh-keygen`命令支持使用`-b`参数设置密钥的长度，对于不同类型的证书类型有不同的长度限制（部分默认值在不同版本下可能不同）：

- `dsa`: 需要设置位1024位。
- `ecdsa`: 支持256位、384位、以及521位三个长度选项。
- `ed25519`: 固定长度，该参数将被忽略。
- `rsa`: 未指定的情况下默认长度未2048位，最小长度位1024位。
