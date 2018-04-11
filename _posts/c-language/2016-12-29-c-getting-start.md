---
layout: post
title: C语言从零开始之一：Hello World
date: 2016-12-29
categories: [C]
tags: [C]
excerpt: 简单介绍经典的C语言入门第一个程序Hello World。
---

## 0X00 前言

最近准备填之前挖的那个写完TCPL(The C Programming Language, C程序设计语言)中所有练习题的坑，就顺便趁这个机会开始写这个系列的文章。写这个文章的时候计划是面向初学者，所以在很多概念上会进行一些举例解释。文章的内容和代码主要整理自TCPL，再加上我个人的一些理解和修改，所以此系列的结构大致按照TCPL的内容顺序，书中每一个章节对应一篇或多篇文章。对于C语言学习者，可以配合TCPL一起使用。除了TCPL的内容外，计划在后面整理一些关于新标准C99和C11的相关信息。

学习一门语言的最好途径就是通过编写程序练习，所以在学习的过程中肯定要安装好相应的软件。无论是初学者还是拥有多年经验的程序员，IDE(Integrated Development Environment, 集成开发环境)都是一个最佳的选择，它能极大地提高工作和学习的效率。适合编写C语言的IDE包括Microsoft家的神器Visual Studio、JetBrains家的CLion、OSX独有的XCode以及开源的Eclipse、Code:Blocks等。IDE有很多，而且很多都是开源或者有免费的社区版，可以选择一个自己喜欢的。除去IDE以外，文本编辑器也是一种选择，如VIM、Emacs、Sublime、Notepad++等。IDE一般都集成了编译器，或者可以调用其它已经安装的编译器，可以直接点击编译运行按钮运行程序。编译器就是一个能将编写完成的代码翻译成机器语言然后生成可执行文件（如Windows中常用的.exe文件）的程序，而编译就是翻译代码的过程。当然对于Linux用户以及打算深入学习的朋友，建议学习掌握通过命令行的方式编译运行程序。

## 0X01 第一个程序

开始的第一个程序是一个最简单的程序，也就是最经典的Hello World程序，它的功能为打印出Hello World。程序的内容非常简单，也是C语言编写程序的基本结构框架。下面就通过此程序开始介绍C语言。

```c
#include <stdio.h>

main() {
  printf("hello world\n");
}
```

## 0X02 程序解释

上面的程序就是Hello World程序的主要内容，接下来将解释每一条语句的用途。`#include <stdio.h>`是一个预处理指令，作用为让编译器在此程序中包含指定的头文件，在这个程序中为编译器将在程序中包含stdio.h文件，它的作用是在程序中包括标准输入/输出库信息。换一种说法解释，就是在程序中可能需要用到一些函数（关于函数的概念会在下面提到），但是这个函数并不是由我们编写代码实现的，而是别人写好给我们使用的。所以为了使用这些函数，就需要通过头文件包含进来。在这个例子中我们使用到了标准输入/输出库，标准输入/输出库是C标准库的一部分，它命名的规则为含义的缩写，即Standard Input and Output。对于C语言标准库，在这里可以暂时理解它是编译器实现者实现并提供给我们使用的一系列函数集合。关于头文件、标准库以及预处理指令的更多信息将在后续文章中再深入说明。

`main()`是一个名为main的函数，它是C语言中默认的入口函数，即在默认情况下运行程序时系统会先调用程序中的main函数。在不修改入口函数名称的情况下，一个完整的程序中main函数是必须的。main后面的()表示函数的参数列表，但在此例中没有用到参数，所以使用了空的参数列表()。函数使用一对{}将它的语句包括在其中，函数中的语句决定了函数的作用，它可能只有一行语句，也可能有成百上千行。在例子中，main函数只包含了一条语句`printf("hello world\n");`，将在下一段介绍它的作用。关于函数以及参数的具体内容将在文中后续部分继续介绍。

正如同上一段所说，main是一个函数，而printf也是一个函数。但是在这里不同于main，只是在使用printf，所以在写法上与实现main函数时有所区别。在实现main函数时使用了{}来包括它的语句，而调用printf而并非实现它，所以没有实现语句也就不需要使用{}，而是使用了;代表这一行语句结束。在除了宏、使用了{}的语句等情况外，分号;都是必须的。printf函数的含义是格式化输出(Formatted Output)，它来自于使用`#include <stdio.h>`包含进来的标准输入/输出库。在()中的就是要传递给printf函数的参数，在例子在中传递的是一个字符串`"hello world\n"`。在字符串中包含着一个\n，它是一个转义字符，称为换行符，作用如同名称为换行。在不包含\n的情况下，printf不会进行换行，所以一般在使用过程中我们会手动添加\n进行换行。在程序运行过程中，当printf函数运行后，就将会在屏幕上打印出hello world。

在C语言中，除去必要的空格外，空行和空格往往不是必须的，它的作用是为了提高代码的可读性。很多人可能会觉得这是多敲空格和换行是件麻烦的事，在初学阶段往往也忽视了这点。缺少空格的情况下可能会使阅读代码者混淆代码的含义，造成后续编写上的困难。一个产品被开发出来以后还需要进行维护与升级，而且开发一个产品往往不是只由一个人完成，所以有一个良好的编程习惯也是非常重要的。

## 0X03 程序的编译与运行（Linux为例）

在编写了程序后，就需要通过编译器对它进行编译，才能得到可执行文件。在IDE中往往只要点击编译运行按钮即可，所以在IDE中的过程便不再过多说明。在Linux中，编译C语言程序往往使用了gcc作为编译器，而且作为最常用的编译器之一，大多数的Linux发行版都直接带有gcc，不需要手动安装。以Hello World程序为例，将程序保存为hello.c后，可在shell中使用gcc进行编译，命令如下。

```bash
$ gcc hello.c -o hello
```

在通过编译后会得到一个名为hello的可执行文件，再使用`./hello`便可执行。从程序源码到可执行文件的过程其实相对复杂，而本文的主题为介绍C语言，所以不再过多解释说明。

## 0X04 Windows下编程

与Linux相同，Windows也同样可以使用C语言进行编程。如gcc有Windows实现版本mingw，安装后便可使用与上文相同的步骤进行编译与运行。但与Linux不同的一点是，Windows可执行文件通常以.exe作为后缀，可能需要使用`./hello.exe`进行执行。除去使用上述方法外，在Windows下进行C语言编程最常用的方法便是使用Visual Studio了。现在Visual Studio已经有免费的Community版，只需要进入VS官网下载安装即可。

## 0X04 结束语

在本篇中只是初步的介绍了C语言中最简单的一个程序，也是一个C语言程序大致的框架结构。在后续文章中，将会继续详细地介绍C语言。如有发现错误与不足之处欢迎留言或者发邮件与我联系。

## 0X05 参考资料

Brian W. Kernighan, Dennis M. Ritchie. *The C Programming Language (2nd Edition)*.