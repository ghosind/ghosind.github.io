---
layout: post
title: Shell Script介绍及变量使用
date: 2016-4-4
categories: ShellScript
tags: [Linux, Bash, ShellScript, Variable, 变量]
excerpt: Shell Script的介绍、变量以及变量的使用。
---

## 本文及Shell Script介绍

文中有关Shell Script的介绍及代码大多出自参考资料中的*Beginning Linux Programming*。有关与Shell Script的介绍请参见[Shell Script - Wikipedia](https://en.wikipedia.org/wiki/Shell_script)。

## Hello World

按惯例第一个程序就是Hello World。

```sh
#!/bin/sh
# This is Hello World Program.

echo "Hello World"
```

在Shell Script中，程序的注释以#开始，如第2行所示。程序第一行的`#!/bin/sh`是一个特殊的注释，它告知系统通过!后的程序执行本程序。第4行的`echo`命令的功能是显示一行文字，在这里即输出"Hello World"。`echo`命令的更多用法可使用`man echo`查看。

## 变量

### 变量概念与使用

Shell Script中的变量不需要事先声明。变量的命名需要遵守的规则有首字符必须为字母、变量名中不可以有空格、可以使用下划线`_`、不能使用标点符号以及不能使用关键字。因Linux是区分大小写的系统，所以变量名也是区分大小写的，如var与Var不是同一个变量。在Shell中，可以使用$来访问变量的内容，而要为变量赋值时仅需使用变量名即可。在默认情况下，变量以字符串的形式存储，即使赋予数值时也是如此。

可以使用=为变量赋值，如`var=Hello`，若字符串包含空格需要使用引号如`var="Hello World"`。除此外也可以使用`read`命令让用户输入数据赋值，如`read var`。

在没有使用引号的情况下以及在双引号中，直接使用`$`加变量名将会使用变量的值；而在单引号中，将不会使用变量的值。所以在没有使用引号和在双引号的情况下，若要使用`$`且不让其获得变量的值，就需要使用`\`取消它的含义。下面将简单的演示变量的使用。

```sh
#!/bin/sh

myvar="Hi there"

echo $myvar
echo "$myvar"
echo '$myvar'
echo \$myvar

echo Enter some text  # 此处不涉及变量的赋值，所以不需要使用引号
read myvar

echo '$myvar' now equals $myvar
exit 0
```

程序的运行结果为:

```text
$ ./variable.sh
Hi there
Hi there
$myvar
$myvar
Enter some text
Hello World
$myvar now equals Hello World
```

### 环境变量

环境变量通常使用大写字母作为名字，下面的表格中列举了几个环境变量及其作用。可以使用`export`命令将变量设置为环境变量。

|变量名|说明|
|:---:|---------------|
|$HOME|当前用户的家目录|
|$PS1|命令提示符|
|$PS2|二级命令提示符|
|$IFS|输入域分隔符|
|$0|脚本的名字|
|$#|参数的个数|
|\$$|脚本的进程号|

### 参数变量

在使用脚本程序时如果带有参数，参数变量便会被创建。`$#`变量的值为参数的个数，若没有任何参数，它的值将为0。使用`$`加数字使用参数变量，数字的值对应着第几个参数变量，如`$1`即第一个参数变量。`$*`与`$@`将列出所有的参数，其区别为`$*`中参数的分隔受IFS的影响，而`$@`不受IFS影响，即使IFS为空其输出值也会被分隔。

下面是一个使用了参数和环境变量的小程序。

```sh
#!/bin/sh

salutation="hello"
echo $salutation
echo "The program $0 is now running"
echo "The second parameter was $2"
echo "The first parameter was $1"
echo "The parameter list was $*"
echo "The user's home directory is $HOME"
exit 0
```

通过`./try_var.sh foo bar baz`运行程序，`foo bar baz`为程序的参数，程序运行结果如下。

```text
$ ./try_var.sh foo bar baz
hello
The program ./try_var.sh is now running
The second parameter was bar
The first parameter was foo
The parameter list was foo bar baz
The user's home directory is /home/wind
```

### 全局变量与局部变量

在函数的使用中，可能会遇到变量名和函数外的某个全局变量的变量名相同的情况，这时候为了避免冲突便可以使用`local`建立一个局部变量。在函数中定义了局部变量后，即使与全局变量的变量名相同，在函数中使用该变量是使用局部变量。局部变量的生存周期仅限于该函数。下面是一个全部变量与局部变量的示例。

```sh
#!/bin/sh

sample_text="global variable"

foo() {
  local sample_text="local varable"
  echo "Function foo is executing"
  echo $sample_text
}

echo "script starting"
echo $sample_text

foo

echo "script ended"
echo $sample_text

exit 0
```

运行该程序后得到的结果为。

```text
script starting
global variable
Function foo is executing
local varable
script ended
global variable
```

### unset

`unset`命令的作用是删除变量或函数，但它不能删除shell本身定义的一些变量如IFS。`unset`命令与将变量赋予空值的效果类似，但赋予空值后变量仍然存在，而unset的效果是将其从环境中删除。下面是一个使用了`unset`命令的示例。

```sh
#!/bin/sh

foo="Hello World"
echo $foo
unset foo
echo $foo

exit 0
```

运行该程序，它的结果如下。

```text
Hello World

```

## 参考资料

Neil Matthew and Richard Stones, *Beginning Linux Programming 4th Edition*.
