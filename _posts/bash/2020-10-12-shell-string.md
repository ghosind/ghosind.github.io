---
layout: post
title: Shell Script字符串处理
date: 2020-10-12
categories: ShellScript
tags: [ShellScript, String, 字符串处理]
excerpt: Shell Script中字符串的字符串处理，如获取字符串长度、获取子串、移除子串以及替换操作。
---

在本文中，将简单地介绍Shell Script中一些使用替换（substitution）操作进行的字符串的操作，例如获取字符串的长度、获取字符串子串、移除字符串中指定部分以及替换字符串中指定部分等操作。

## 获取字符串长度

使用`${#string}`可以得到对应字符串的长度，其等同于C语言中的`strlen()`函数。

```sh
$ greeting="hello world"
$ echo ${#greeting}
11
```

## 获取字符串子串

使用`${string:position}`或`${string:position:length}`可以用于获取字符串的子串，其中`position`为以0为基准的字符串字符位置。

使用`${string:position}`将获取从`position`指定位置开始的子串，例如示例中的`${greeting:6}`将获取从第七个字符开始的子串`'world'`。

使用`${string:position:length}`将获取从`position`指定位置开始的长度为`length`的子串，例如示例中的`${greeting:0:5}`将获取从第一个字符开始的长度为5的子串`'hello'`。

```sh
$ greeting="hello world"
$ echo ${greeting:6}
world
$ echo ${greeting:0:5}
hello
```

另外，可使用`0-position`表示从右边起的第`position`个字符，例如：

```sh
$ greeting="hello world"
$ echo ${greeting:0-5}
world
$ echo ${greeting:0-5:3}
wor
```

## 移除字符串的子串

下面将介绍移除字符串中指定部分子串的四种方式，其中`substring`部分为一个正则表达式，关于正则表达式的用法可以参考[Regexp](https://tldp.org/LDP/abs/html/regexp.html#REGEXREF)。

- 使用`${string#substring}`移除正向匹配的最短子串。
- 使用`${string##substring}`移除正向匹配的最长子串。
- 使用`${string%substring}`移除反向匹配的最短子串。
- 使用`${string%%substring}`移除反向匹配的最长子串。

```sh
# 以下示例来自Advanced Bash-Scripting Guide的Manipulating Strings部分
$ str="abcABC123ABCabc"
$ echo ${str#a*C}
123ABCabc
$ echo ${str##a*C}
abc
$ echo ${str%b*c}
abcABC123ABCa
$ echo ${str%%b*c}
a
```

以下通过获取URL中指定部分的方式演示移除字符串子串的操作：

```sh
$ url="https://www.example.com/blogs/1.html"
# 获取URL
$ echo ${url#*:*//}
www.example.com/blogs/1.html
# 获取后缀
$ echo ${url##*.}
html
# 获取协议
$ echo ${url%%://*}
https
```

## 字符串替换

下面介绍了四种字符串替换的方式，其中`substring`为查找的子串，`replacement`为替换的字符串：

- 使用`${string/substring/replacement}`替换匹配的第一个子串。
- 使用`${string//substring/replacement}`替换所有匹配的子串。
- 使用`${string/#substring/replacement}`替换正向匹配的第一个子串。
- 使用`${string/%substring/replacement}`替换反向匹配的第一个子串。

以下是来自*Advanced Bash-Scripting Guide*的示例：

```sh
$ str="abcABC123ABCabc"
$ echo ${str/abc/xyz}
xyzABC123ABCabc
$ echo ${str/abc/xyz}
xyzABC123ABCxyz
$ echo ${str/#abc/xyz}
xyzABC123ABCabc
$ echo ${str/%abc/xyz}
abcABC123ABCxyz
```

## 参考资料

- [String Manipulation](https://tldp.org/LDP/abs/html/string-manipulation.html)
- [Regexp](https://tldp.org/LDP/abs/html/regexp.html#REGEXREF)
- [shell脚本字符串截取的8种方法 - Areon](https://www.cnblogs.com/hurryup/articles/10241601.html)
