---
layout: post
title: Redis基本类型之字符串的位操作以及STRALGO命令
date: 2020-06-28
categories: [Redis]
tags: [Redis, string]
excerpt: 介绍并以示例的形式展示Redis中SETBIT、BITCOUNT、BITPOS等位操作命令，并简单介绍6.0版本中新增的STRALGO命令。
---

在前文中我们已经介绍了Redis中有关字符串的大部分命令。在本文中，我们将介绍一下Redis中位操作相关的命令，并简单介绍6.0版本中新增的STRALGO命令。若需要了解其他的字符串命令，可参考之前的文章：

- [字符串键操作命令](https://www.ghosind.com/2020/06/22/redis-string)
- [字符串值操作命令](https://www.ghosind.com/2020/06/24/string-manipulate)

## SETBIT

`SETBIT`命令用于设置指定偏移位的二进制值，设置的值必须为`0`或`1`。

```
SETBIT key offset value
```

使用`SETBIT`命令时，偏移量的值必须大于等于0，且小于4294967296（2^32）。若偏移量大于原字符串的长度，则该字符串将增长至能存放偏移量的长度，增长的部分将使用`0`填充。

### 示例

```sh
redis> SETBIT mykey 7 1
(integer) 0
redis> GET mykey
"\x01"
redis> SETBIT mykey 7 0
(integer) 1
redis> GET mykey
"\x00"
```

当偏移量大于字符串长度时，字符串将增长：

```sh
redis> SET greeting "hello world"
OK
redis> SETBIT greeting 94 1
(integer) 0
redis> GET greeting
"hello world\x02"
```

## GETBIT

`GETBIT`命令用于返回指定指定偏移量的二进制值。

```
GETBIT key offset
```

使用`GETBIT`命令时若指定的偏移量大于字符串的长度，将认定超出的部分为连续的0。当键值对不存在时，将认定其为一个空白的字符串，即偏移量大于字符串的长度。与`SETBIT`命令不同的是，偏移量超出字符串时不会使字符串增长。

### 示例

```sh
redis> SETBIT mykey 7 1
(integer) 0
redis> GETBIT mykey 7
(integer) 1
redis> SET greeting "hello world"
OK
# 字符h的二进制为01101000H
redis> GETBIT greeting 0
(integer) 0
redis> GETBIT greeting 1
(integer) 1
# greeting的长度为88位，获取超出字符串的长度的位
redis> GETBIT greeting 88
(integer) 0
```

## BITCOUNT

`BITCOUNT`命令用于获取指定范围内字符串中二进制值为`1`的位数。默认情况下计数范围为整个字符串，另外也可手动指定计数开始和结束的位置。不同于上文中介绍的`SETBIT`以及`GETBIT`命令，`BITCOUNT`参数中的偏移量单位为字节而非位。

```
BITCOUNT key [start end]
```

与前文中介绍过的[`GETRANGE`](https://www.ghosind.com/2020/06/24/string-manipulate#getrange)命令相似，也可以使用负数表示相对于字符串末尾的位置。

### 示例

```sh
redis> SET greeting "hello world"
OK
# 字符h的二进制为01101000
redis> BITCOUNT greeting 0 0
(integer) 3
# 字符e的二进制为01100101
redis> BITCOUNT greeting 1 1
(integer) 4
# 字符l的二进制为01101100
# 字符d的二进制为01100100
redis> BITCOUNT greeting -2 -1
(integer) 7
redis> BITCOUNT greeting
(integer) 45
# 偏移量end小于start的情况，相当于空字符串
redis> BITCOUNT greeting 3 1
(integer) 0
```

## BITPOS

`BITPOS`命令用于获取在指定范围中首个二进制值为`0`或`1`的位置。当键值对不存在时，将认为是一个空字符串进行搜索。与`BITCOUNT`命令相同，`BITPOS`命令也可以以字节为单位指定偏移量，使用负数值表示相对于字符串末尾的位置。

```
BITPOS key bit [start] [end]
```

使用`BITPOS`命令时，将认定超出字符串长度的部分为连续的`0`。

### 返回值

`BITPOS`命令将返回首个符合条件的二进制值的位置。如当字符串值为`"\xfd"`时（即二进制值`11111101`），使用命令`BITPOS key 1`将得到结果为0，使用命令`BITPOS key 0`将得到结果为6。

当查找的值为二进制值`1`，且字符串为空或不包含`1`时，将返回`-1`。

当查找的值为二进制值`0`，字符串不为空且只包含有`1`时，将返回字符串后的第一个位的位置。如当字符串值为`"\xff"`时（即二进制值`11111111`），使用`BITPOS key 0`命令得到的结果为8。

当同时设置偏移量`start`以及`end`时，将只会在指定范围内查找。如当字符串值为`"\xff"`时（即二进制值`11111111`），使用`BITPOS key 0 0 0`命令得到的结果为-1。

### 示例

```sh
# 11111111 11111101
redis> SET mykey "\xff\xfd"
OK
redis> BITPOS mykey 1
(integer) 0
redis> BITPOS mykey 0
(integer) 14
# 在第一个字节中寻找
redis> BITPOS mykey 0 0 0
(integer) -1
```

## BITOP

`BITOP`命令用于对多个值（除`NOT`操作外）执行位运算操作，并将结果保存至指定的键值对中。`BITOP`命令将返回结果字符串的长度，其值等于输入中最长字符串的长度。

```
BITOP operation destkey key [key ...]
```

`BITOP`命令支持与（`AND`)、或（`OR`）、亦或（`XOR`）以及非（`NOT`）四个位运算操作，其使用方式为：

- `AND` 与操作，使用方式为`BITOP AND destkey srckey1 srckey2 ...`
- `OR` 或操作，使用方式为`BITOP OR destkey srckey1 srckey2 ...`
- `XOR` 亦或操作，使用方式为`BITOP XOR destkey srckey1 srckey2 ...`
- `NOT` 非操作，使用方式为`BITOP NOT destkey srckey`

当输入的字符串长度不同时，将使用`0`填充至与最长长度相同。若输入的键不存在则认定为一个空白字符串，并以0填充至与最长长度相同。

### 示例

在下面的示例中，我们将使用到下面几个值作为演示的源值：

```sh
# 10101010
redis> SET key1 "\xaa"
OK
# 01010101
redis> SET key2 "\x55"
OK
# 11110000
redis> SET key3 "\xf0"
OK
# 01010101 01010101
redis> SET key4 "\x5555"
OK
```

与（AND）操作：

```sh
# 10101010 & 01010101 = 00000000
redis> BITOP AND result key1 key2
(integer) 1
redis> GET result
"\x00"
```

或（OR）操作：

```sh
# 10101010 | 01010101 = 11111111
redis> BITOP OR result key1 key2
(integer) 1
redis> GET result
"\xff"
```

亦或（XOR）操作：

```sh
# 10101010 ^ 11110000 = 01011010
redis> BITOP XOR result key1 key3
(integer) 1
# 字符Z二进制值为 01011010
redis> GET result
"Z"
```

或（OR）操作：

```sh
# !10101010 = 01010101
redis> BITOP NOT result key1
(integer) 1
# 字符U二进制值为 01010101
redis> GET result
"U"
```

不同长度的字符串进行位运算：

```sh
# key1的值将以0填充为 10101010 00000000
# 10101010 00000000 | 01010101 01010101 = 11111111 00000000
redis> BITOP OR result key1 key4
(integer) 2
redis> GET result
"\xffU"
```

## BITFIELD

使用`BITFIELD`将字符串看成二进制位数组，并对其中存储不同长度的整数进行操作。例如设置偏移量为1234的5位有符号整数的值，或是获取偏移量位4567的31位无符号整数的值。同时，`BITFIELD`命令也提供了`INCRBY`子命令对只进行加/减操作，并提供了设置以处理溢出的情况。

```
BITFIELD key [GET type offset] [SET type offset value] [INCRBY type offset increment] [OVERFLOW WRAP|SAT|FAIL]
```

`BITFIELD`命令可通过传递多个命令对多个位域进行操作，并以数组的形式返回各命令执行的结果。例如下面的示例中，对`mykey`键中偏移量为100的5位有符号整数进行自增量为1的自增操作，并获取偏移量为0的4位无符号整数的值：

```sh
redis> BITFIELD mykey INCRBY i5 100 1 GET u4 0
1) (integer) 1
2) (integer) 0
```

`BITFIELD`命令提供了下列支持的子命令：

- `GET <type> <offset>` 返回指定位域的值，若超出字符串的长度，超出部分将为0。
- `SET <type> <offset> <value>` 设置指定位域的值，并返回旧值。若超出字符串的长度，超出部分将以0填充。
- `INCRBY <type> <offset> <increment>` 对指定位域的值进行自增操作（通过使用负的自增值进行减法的操作），并返回最新的值。若超出字符串的长度，超出部分将以0填充。

另外，`BITFIELD`命令还支持`OVERFLOW`子命令，用于设置发生溢出时执行的操作。

```
OVERFLOW [WRAP|SAT|FAIL]
```

`OVERFLOW`命令具有下列三个行为的设置，在未显式声明的情况下，默认的溢出行为为`WRAP`。

- `WRAP` 环绕（wrap around）模式，也就是C语言中的标准行为。即当上溢出时将从该类型最小的值开始计算，下溢出时从该类型最大的值开始计算。例如对值为-128的8位有符号整数做减一的操作，将得到127。
- `SAT` 发生溢出时将保持数值为该类型的边界值。如对值为120的8位有符号整数做加10的操作将得到127，在后续继续做加法操作值仍将保持在127。
- `FAIL` 若将发生溢出，则将不执行`INCRBY`操作，并返回`nil`。

对于`BITFIELD`命令中的`<type>`参数，需要传递位域的类型及大小。位域支持有符号整数和无符号整数两种类型，分别使用符号`i`以及`u`表示。在类型符号后，需要声明位域的大小，例如`i32`代表32位有符号整数，`u15`代表15位无符号整数。由于Redis的协议原因，位域支持的最大大小分别为64位有符号整数及63位无符号整数。

`BITFIELD`命令提供了两种方式设置偏移量：

1. 即直接使用不带前缀的数值，它表示以0开始从字符串起始位置计算偏移量，例如`200`表示字符串中的第201位。
2. 以`#`作为前缀的数值，它将与类型的长度相乘计算出实际的偏移量。例如对于命令`BITFIELD mystring SET i8 #0 100 SET i8 #1 200`，两个子命令的实际偏移量分别为0和8。

### 示例

```sh
# 01111111
redis> BITFIELD mykey SET i8 0 127
1) (integer) 0
# 5位有符号整形中，二进制值11111表示-1
# 5位无符号整形中，二进制值11111表示31
redis> BITFIELD mykey GET i5 3 GET u5 3
1) (integer) -1
2) (integer) 31
redis> BITFIELD mykey INCRBY u8 0 10 INCRBY i8 0 -15
1) (integer) 137
2) (integer) 122
```

通过`OVERFLOW`控制溢出的情况：

```sh
redis> BITFIELD overflow-test SET i8 0 120
(integer) 0
# 使用FAIL使发生溢出时不执行操作
redis> BITFIELD overflow-test OVERFLOW FAIL INCRBY i8 0 10
1) (nil)
# 使用SAT使发生溢出时保持在边界值
redis> BITFIELD overflow-test OVERFLOW SAT INCRBY i8 0 10
1) (integer) 127
# 使用WRAP使发生溢出时值按环绕模式改变
redis> BITFIELD overflow-test OVERFLOW WRAP INCRBY i8 0 1
1) (integer) -128
```

## 结束语

`STRALGO`命令是6.0版本新增加的命令，用于执行一些复杂的字符串操作算法。`STRALGO`可能可以被用于DNA以及RNA序列的分析中。在本文中我们仅对`STRALGO`命令进行简单的介绍。

```
STRALGO algorithm argument [argument ...]
```

在当前最新版本中（6.0.5），仅支持了LCS算法（longest common substring，最长公共子串），其使用方式为：

```
STRALGO LCS [KEYS ...] [STRINGS ...] [LEN] [IDX] [MINMATCHLEN <len>] [WITHMATCHLEN]
```

以下为`STRALGO`命令使用的示例：

```sh
redis> STRALGO LCS STRINGS salvatore sanfilippo
"salo"
```

关于`STRALGO`命令更多的使用方法，可以参考Redis文档中的[`STRALGO`页面](https://redis.io/commands/stralgo)。

至此，我们已经介绍了Redis中字符串相关所有命令，在接下去的文章中，我们将继续介绍Redis中的其他类型命令。若需要对了解关于字符串命令的更多内容，可以参考Redis文档中的[字符串相关命令文档](https://redis.io/commands#string)。

## 参考文献

- [Command reference - Redis](https://redis.io/commands)
- [Diving Into Redis 6.0](https://redislabs.com/blog/diving-into-redis-6/)
