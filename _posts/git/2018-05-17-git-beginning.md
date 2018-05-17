---
layout: post
title: Git初使用
date: 2018-05-17
categories: [git]
tags: [git]
excerpt: 简单介绍git及其基本使用方法。
---

## 什么是git

Git是最初由Linus Torvalds开发的开源版本控制系统，同时也是当前最为流行、最为先进的版本控制系统之一。所谓版本控制即记录一个或多个文件的内容变化，以便于对特定时期的内容进行查阅或者更改。常用的版本控制系统出git外，还有SVN、CVS等。

## 第一次使用

### 安装GIT

#### Linux

Linux各发行版都基本可以使用包管理工具安装git，例如在Debian/Ubuntu中使用apt-get或Fedora中使用yum安装git。

```bash
$ sudo apt-get install git
$ sudo yum install git
```

更多在Linux中安装git的方法可见[Git for Linux](https://git-scm.com/download/linux)。

除直接使用二进制程序安装外，还可以下载git的源码编译。Git的源码可于[GitHub](https://github.com/git/git)上获得。

#### Mac OS X

在Mac OS X下安装git最简便的方法是直接安装XCode Command Line Tools，其安装方法是在首次使用的情况下在终端（Terminal）使用git命令，便会跳出提示安装的界面。通过XCode Command Line Tools安装最为便利，但其通常不是最新版本。若需要安装最新版本的git，可在[Git for Mac](https://git-scm.com/download/mac)获取。

#### Windows

在Windows环境下，可直接前往[Git for Windows](https://git-scm.com/download/win)下载，它通常包含Git Bash和Git GUI两个工具。除使用Git for Windows外，还可使用GitHub Desktop或SourceTree等图形化工具。

### 配置

Git在使用前，需要设置用户名及邮箱，且之后每一次的提交都会用到这些信息。Git包括了一个config命令来设置各项配置，设置的配置信息根据不同的选项存储于不同的位置。通过git的config命令设置用户名和邮箱的方式如下。

```bash
$ git config user.name "Zhang San"
$ git config user.email "zhangsan@example.com"
```

采用上述命令将为当前项目设置用户名和邮箱信息，除此以外Git的config命令通常还使用两个选项，分别是`--system`与`--global`，它们分别是为当前系统所有用户设置配置信息及为当前用户设置配置信息。下面说明了不同的选项的配置文件存储的位置

1. /etc/gitconfig: 带有`--global`选项时，为系统中所有的用户设置配置。
2. ~/.gitconfig: 带有`--system`选项时，为当前用户设置配置，文件存在与用户主目录下。
3. .git/config: 不带任何选项时为当前项目设置配置，存在与项目目录下。

### 本地新建

在安装git之后，就可以在本地新建一个git仓库了。本地新建的git仓库可以建立在空的目录中，也可以建立在一个正在进行的项目中。使用git的init命令便可以在本地建立一个git仓库。

```bash
$ git init
```

在使用init完成初始化之后，会在目录下生成一个隐藏的.git文件夹，该文件夹存放了git仓库的一些必要信息。在使用简单的一个init命令之后就得到了一个git仓库可以继续进行之后的操作了。

### 远程仓库

在本地新建一个仓库往往可能只是一些个人项目，而更多的情况下会接触到团队合作项目或是GitHub上的开源项目等，这时候就需要使用git的clone命令克隆现有的仓库到本地。clone命令的用法为`git clone [url]`。例如现需要保存我的博客源码到本地，就可以使用下列命令将其克隆。

```bash
git clone https://github.com/ghosind/ghosind.github.io.git
```

Git支持多种的协议，除上述的http/https外，还支持`git://`协议以及SSH。在实际使用的过程中可以通过具体的情况选择使用的协议。

## 第一次提交

在建立仓库后，就可以进行任何需要的操作了。例如在编写了一个hello.c文件，保存在git仓库的目录下，并且准备提交到仓库中，就需要进行一些操作。

首先，为了知道目录下具体有哪些文件发生了修改（假设目录中不仅只存在hello.c文件），需要使用git的status命令检查当前的状态。下面分别是没有任何修改和有修改时status命令的输出。

```bash
# 无修改
$ git status
On branch master
Your branch is up to date with 'origin/master'.
nothing to commit, working tree clean

# 添加了hello.c文件
$ git status
On branch master
Your branch is up to date with 'origin/master'.
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        hello.c
nothing added to commit but untracked files present (use "git add" to track)
```

在了解当前状态后，便可以使用add命令跟踪（track）一个文件。跟踪的文件指的是被纳入版本控制的文件，一个新生成的文件在被跟踪后才能使用git进行版本控制。例如跟踪上面添加的hello.c文件。在文件被跟踪后，使用status命令查看当前状态。

```bash
$ git status
On branch master
Your branch is up to date with 'origin/master'.
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)
        new file:   hello.c
```

在完成了本次的修改后，就可以提交修改至仓库中。使用commit命令可以创建一次提交（commit），直接使用`git commit`命令将会打开文本编辑器，其中会有本次提交包括的修改（可以删除，但保留可以更清晰地了解修改），而你需要做的事是在第一行空白的地方输入本次提交的说明。

```text

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch master
# Your branch is up to date with 'origin/master'.
#
# Changes to be committed:
#       new file:   hello.c
#
```

但使用commit命令每次都会打开文本编辑器，此步骤略显麻烦，于是便可使用-m选项，将提交的信息和命令放在同一行中。至此，便完成了一次的提交。若是使用远程的仓库，除上述步骤外，还需要将提交推送到远程仓库，便需要使用push命令。push命令的格式为`git push [remote-name] [branch-name]`，通常remote-name为origin（当然也可以设置为其它名字），小型项目可能直接会在master分支上开发。下面是一个完整的提交过程示例。

```bash
$ git add hello.c
$ git commit -m "hello world"
$ git push origin master
```

### 不小心暂存了不需要的修改

使用git的过程中，难免手误add不需要的修改到暂存区。使用status命令可以发现，输出的信息提示可以使用reset命令取消暂存指定文件。例如在项目中加入了一个临时文件1.c，而且还不小心将其加入了暂存区，于是就可以使用下面的命令将其从从暂存区移出。

```bash
$ git reset HEAD 1.c
```

### 其它常用操作

除添加/修改新文件外，往往还可能需要一些其它的操作，这是就需要除add外的其它命令。例如使用rm命令删除文件（准确的说应该是不再跟踪该文件），或是使用mv命令移动/重命名文件。

另外，使用log命令可以查看提交的历史记录，它的输出包括了提交的SHA值、作者的名字、邮箱、时间以及说明。

## 结束语

在本文中只是初步提到如何使用git，主要还是在于本地仓库的基本使用，还没提到远程仓库的工作方式，除此外有很多更为强大的功能也尚未提及，例如git强大的分支模型。有兴趣对git进行深入学习可以前往git官网下载[Pro Git](https://git-scm.com/book/en/v2)或者参考其它的资料。

## 参考资料

- Scott Chacon, Ben Straub. *Pro Git*.