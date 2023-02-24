---
layout: post
title: AT&T与Intel汇编语法区别
date: 2023-02-24
categories: [Assembly]
tags: [Intel, AT&T, Assembly, 汇编]
excerpt: 在Intel、AT&T汇编中使用指令、寄存器、变量以及内存寻址方式的简单对比。
---

## 寄存器、变量（常量）与立即数

在Intel汇编中，无论是寄存器、变量（常量）还是立即数，都是直接使用的，例如下列例子中分别加载一个变量（常量）与立即数到寄存器中：

```nasm
mov eax, var ; var为已经定义好的变量（常量）
mov eax, 1234h
```

在AT&T汇编中，使用寄存器需要在其名称前增加`%`，例如使用`eax`寄存器，在AT&T汇编中为`%eax`。对于变量（常量）与立即数，在AT&T中使用需要加上`$`。

```nasm
movl $var, %eax
movl $0x1234h, %eax
```

## 指令操作数顺序

在Intel汇编中，指令的格式为目标操作数在左，源操作数在右。而在AT&T汇编中，指令的格式为源操作数在左，目标操作数在右。

例如下面的例子中，将`eax`的值加载到`ebx`中，使用两个格式的汇编分别为：

```nasm
movl %eax, %ebx ; AT&T
mov ebx, eax    ; Intel
```

## 指令字长

在AT&T汇编中，需要在指令后使用后缀`b`、`w`、`l`、`q`表示操作数的字长，它们分别表示byte（8位）、word（16位）、longword（32位）与quadword（64位）。

下面的例子中，分别在不同位数的情况下，分别将`al`、`ax`、`eax`与`rax`寄存器中的值加载到`bl`、`bx`、`ebx`与`rbx`寄存器中。

```nasm
; 8位
movb %al, %bl   ; AT&T
mov bl, al      ; Intel
; 16位
movw %ax, %bx   ; AT&T
mov bx, ax      ; Intel
; 32位
movl %eax, %ebx ; AT&T
mov ebx, eax    ; Intel
; 64位
movq %rax, %rbx ; AT&T
mov rbx, rax    ; Intel
```

## 寻址方式

对于内存寻址，在Intel汇编中表达的格式为：

```
segment:[base + index * scale + offset]
```

而在AT&T中，其表达的格式为：

```
segment:offset(base, index, scale)
```

在表达内存寻址时，至少需要常量（`offset`）及基址（`base`）中的一项。下面我们通过几个例子了解一下不同情况下内存寻址的表示方式。

```nasm
movl (%ebx), %eax ; AT&T
mov eax, [ebx]    ; Intel
```

对于使用变量（常量）作为寻址的偏移量，在AT&T汇编中使用时不需要加上`$`前缀。例如将`var`指向内存位置中的值加载至`eax`中，可分别通过下列语句实现：

```nasm
movl var, %eax  ; AT&T
mov eax, [var]  ; Intel
```

下面的例子中，同时使用了基址寄存器与常量进行寻址的操作，其中常量可以为一个立即数，也可以是一个定义的变量。

```nasm
movl 4(%ebx), %eax  ; AT&T
mov eax, [ebx + 4]  ; Intel

movl offset(%ebx), %eax  ; AT&T
mov eax, [ebx + offset]  ; Intel
```

在C语言中，我们可以简单的通过下标获取数组中的元素。例如对于`int32`类型的数组`arr`中的第`i`个元素，我们可以使用`arr[i]`表达式获取。对于获取数组中元素，使用Intel与AT&T汇编分别为下列的两种表达方式：

```nasm
; arr[i], 假定变量i的值在eax中
mov ebx, [eax*4 + _arr]   ; Intel
movl _arr(,%eax,4), %ebx  ; AT&T
```

下面表格总结了几种不同情况下Intel与AT&T汇编的表达方式。

| Intel | AT&T |
|:-----:|:----:|
| `[1234]` | `1234` |
| `[es:1234]` | `%es:1234` |
| `[eax]` | `(%eax)` |
| `[eax + ebx]` | `(%eax, %ebx)` |
| `[eax + ebx * 2]` | `(%eax, %ebx, 2)` |
| `[ebx * 2]` | `(, %ebx, 2)` |
| `[eax - 10]` | `-10(%eax)` |
| `[ds:ebp - 10]` | `%ds:-10(%ebp)` |

## 参考资料

- [Brennan's Guide to Inline Assembly](http://www.delorie.com/djgpp/doc/brennan/brennan_att_inline_djgpp.html)
- [AT&T Assembly Syntax - UC Davis](https://csiflabs.cs.ucdavis.edu/~ssdavis/50/att-syntax.htm)
