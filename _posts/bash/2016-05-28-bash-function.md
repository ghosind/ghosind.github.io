---
layout: post
title: Shell Script函数
date: 2016-5-28
categories: ShellScript
tags: [Linux, Bash, ShellScript, Function]
excerpt: Shell Script中函数的定义及使用。
---

## 函数

在大多数编程语言中，都会存在函数的概念，如C语言中的`printf()`。在编程过程中，将一段会重复使用且为完成特定功能的语句写在函数中，可以减少代码的长度提高可读性。在ShellScript中，除了使用函数外有另一种选择，即将一个较长的脚本分为多个小脚本文件，但这种方法的效率会比使用函数低，在实际编写中可根据需要选择使用函数或者分文件。

在ShellScript中函数的定义与使用的方法也非常简单。定义一个函数只需要写出函数名，再跟上一对圆括号和花括号，并将具体的语句写在花括号中；使用函数时只需写出函数名即可调用该函数。

```sh
# 函数的定义
function_name() {
  statements
}

# 使用函数
function_name
```

下面使用一个简单的例子演示函数的使用。

```sh
#!/bin/sh

foo() {
  echo "Function foo is executing"
}

echo "script starting"
foo
echo "script ended"
```

程序先是定义（不执行）了函数foo，然后开始执行下面的代码。执行完`echo "script starting`后执行`foo`将调用函数foo，于是程序将执行函数foo中的语句。执行该程序，将得到以下结果。

```text
script starting
Function foo is executing
script ended
```

### 函数参数与返回值

在函数的使用中经常需要传递参数和返回值。在定义函数时，无需像其它语言一样预先定义函数的个数及名称，而是在函数中直接使用参数变量即可，参数变量参见[Shell Script介绍及变量使用](http://www.ghosind.com/2016/04/04/shell-script-variable)。在调用函数时，若需要传递参数，只需在函数名后加上参数，如`function_name arg1 arg2 ...`。函数的值返回方法与其它大部分语言类似，即`return return_value`。下面将使用一个小程序演示函数参数及返回值的使用。

```sh
#!/bin/sh

yes_or_no() {
  echo "Is your name $* ?"
  while true
  do
    echo -n "Enter yes or no: "
    read x
    case "$x" in
      [yY] | [yY][eE][sS] )
        return 0
        ;;
      [nN] | [nN][oO] )
        return 1
        ;;
      * )
        echo "answer yes or no"
        ;;
    esac
  done
}

if yes_or_no "xxx"
then
  echo "Hi xxx, nice name"
else
  echo "Never mind"
fi

exit 0
```

下面将执行两次程序，分别输入yes与no，结果如下。

```text
# first time
Is your name xxx ?
Enter yes or no: yes
Hi xxx, nice name

# second time
Is your name xxx ?
Enter yes or no: no
Never mind
```
