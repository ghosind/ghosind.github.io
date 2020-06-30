---
layout: post
title: Redis命令介绍之字符串值的操作
date: 2020-06-24
categories: [Redis]
tags: [Redis, string]
excerpt: 介绍并以示例的形式展示Redis中SETRANGE、APPEND等操作字符串以及键判断的EXISTS等命令。
---

[前文](https://www.ghosind.com/2020/06/22/redis-string)中我们介绍了Redis中对于字符串类型的键值对进行诸如设置、获取、删除等操作的命令。在本文中，我们将继续介绍Redis中字符串类型的相关命令，主要为对该类型键值对值的操作。

## STRLEN

`STRLEN`命令被用于获取指定字符串类型键值对值的长度。当键值对不存在时将返回`0`，若键值对值类型不为字符串时，将返回错误。

```
STRLEN key
```

### 示例

```sh
redis> STRLEN greeting
(integer) 0
redis> SET greeting "hello redis"
OK
redis> STRLEN greeting
(integer) 11
# 当键值对不为字符串时
redis> LPUSH students "John Doe" "Jane Doe"
(integer) 2
redis> STRLEN students
(error) WRONGTYPE Operation against a key holding the wrong kind of value
```

## GETRANGE

`GETRANGE`命令的作用为获取字符串值中由`start`及`end`参数指定范围的子串（包含`start`及`end`位置的字符）。当偏移值为负数时，指相对于字符串结尾的偏移量。例如当值为`redis`时，偏移量`-1`指的是最后一个字符`s`，偏移量`-2`指的是倒数第二个字符`i`。

当偏移量超出字符串的长度时，将会忽略超出的部分。例如值为`redis`时，获取偏移量从`0`到`10`的子串，仍将只返回`redis`。

```
GETRANGE key start end
```

`GETRANGE`命令在Redis 2.4.0中被添加，用于替代2.0之前版本中的`SUBSTR`命令。

### 示例

```sh
redis> SET greeting "hello"
OK
redis> GETRANGE greeting 0 4
"hello"
redis> GETRANGE greeting 0 -1
"hello redis"
redis> GETRANGE greeting -5 -1
"redis"
# 当偏移量超出字符串长度时
redis> GETRANGE greeting 0 20
"hello redis"
# 当偏移量错误时
redis> GETRANGE greeting 8 3
""
```

## SETRANGE

`SETRANGE`命令用于覆盖字符串中从偏移量开始的子串，并返回修改后的字符串长度。若偏移量大于原字符串的长度，将使用`0`值（数值0，非字符0）填充。

```
SETRANGE key offset value
```

由于Redis中字符串的最大长度为512 MB（2^29），所以偏移量的最大值为536870911（2^29 - 1）。

### 示例

```sh
redis> SET greeting "hexxo guys"
OK
redis> SETRANGE greeting 6 "redis"
(integer) 11
redis> GET greeting
"hexxo redis"
# 只修改部分字符
redis> SETRANGE greeting 2 "ll"
(integer) 11
redis> GET greeting
"hello world"
# 偏移量大于原字符串长度
redis> SETRANGE name 5 "John Doe"
(integer) 13
redis> GET name
"\x00\x00\x00\x00\x00John Doe"
```

## APPEND

`APPEND`命令的作用为当指定键存在且为字符串类型时，将指定的值拼接到现有值的最后。若指定键不存在时，其作用类似于使用`SET`命令，即创建一个空串并拼接参数指定的字符串。

```
APPEND key value
```

### 示例

```sh
redis> EXISTS greeting
(integer) 0
redis> APPEND greeting "hello"
(integer) 5
redis> APPEND greeting " world"
(integer) 11
redis> GET greeting
"hello world"
```

## EXISTS

在`APPEND`命令的示例中我们提到了一个`EXISTS`命令，该命令用于获取指定键中存在的数量。若指定的键存在，则该命令执行后将返回`1`，否则返回`0`。从Redis 3.0.3开始`EXISTS`命令支持获取多个键存在的数量。

`EXISTS`命令和前文中的`DEL`等命令一样，不仅限于字符串类型的键值对。

```
EXISTS key [key ...]
```

若参数中有重复的键，也将会被多次计数。例如下面示例中，使用`EXISTS key1 key1 key2`命令，参数中指定的两个`key1`也将被重复计数，其返回结果为3。

### 示例

```sh
redis> MSET key1 "value1" key2 "value2"
OK
redis> EXISTS key1
(integer) 1
redis> EXISTS key3
(integer) 0
redis> EXISTS key1 key2 key3
(integer) 2
# 重复的键名也会多次计数
redis> EXISTS key1 key1 key2
(integer) 3
```

## INCR / INCRBY

当字符串的值可表示为一个数值时，可使用`INCR`、`INCRBY`、`DECR`、`DECRBY`以及`INCRBYFLOAT`命令进行递增或递减的操作。

Redis中并不存在专门的整数类型，它们将以字符串的形式被储存，所以我们上面提到的几个命令也都是字符串的操作命令。在执行这些命令前，Redis会将对应的字符串解析为对应的64位有符号整数。若键值不为字符串或字符串无法被解析为指定范围的整数，将会返回错误。同样，执行操作得到的结果也必须为在64为有符号整数所内表示的范围内。

`INCR`命令的作用为将字符串对应的整数值递增1，并返回递增后的整型值。在执行该命令前，若键不存在，则将自动创建并设置其值为0。

```
INCR key
```

`INCRBY`命令与`INCR`类似，二者区别为`INCRBY`命令可指定递增的值，且该值可为在可表示范围内的任意整数值。

```
INCRBY key increment
```

### 示例

```sh
redis> INCR count
(integer) 1
redis> GET count
"1"
redis> INCRBY count 2
(integer) 3
redis> INCRBY count -1
(integer) 2
```

当字符串的值不为整数值或超出范围时，将返回错误：

```sh
# 非整数值
redis> SET greeting "hello"
OK
redis> INCR greeting
(error) ERR value is not an integer or out of range
# 超出范围
redis> SET count 9223372036854775806
OK
redis> INCR count
(integer) 9223372036854775807
redis> INCR count
(error) ERR value is not an integer or out of range
```

## DECR / DECRBY

`DECR`、`DECRBY`命令的作用以及使用方法与上一节中的`INCR`、`INCRBY`相似，区别为这两个命令做的是递减的操作。同样，`DECR`、`DECRBY`命令也受64位有符号整数范围的限制。

```
DECR key
DECRBY key decrement
```

`INCRBY`的递增值以及`DECRBY`的递减值都可为负数，所以二者的也可被相互替代。例如`INCRBY key 1`等价于`DECRBY key -1`。

### 示例

```sh
redis> DECR count
(integer) -1
redis> GET count
"-1"
redis> DECRBY count 2
(integer) -3
redis> DECRBY count -1
(integer) -2
```

## INCRBYFLOAT

`INCRBYFLOAT`与上述四个命令有较为明显的区别，它会将字符串解析为双精度浮点数（double类型），且递增的值接受浮点数。同样，若键不存在则会将其值设置为0，若键值对不为字符串类型或无法解析为双精度浮点数则会返回错误。

`INCRBYFLOAT`命令执行后会将计算得到的结果保存至键值对中并返回对应的值，返回的值为字符串值而非上述命令一样的整型值。

```
INCRBYFLOAT key increment
```

使用`INCRBYFLOAT`命令时，原字符串的值及递增的值都可包含指数，但在计算后将被保存为小数的形式。在计算后，小数点后多余的0将被删除。浮点数的计算会存在精度的问题，计算的结果最多只保留小数点后的17位。

### 示例

```sh
redis> SET balance 1000
OK
redis> INCRBYFLOAT balance 50.5
"1050.5"
redis> INCRBYFLOAT balance -100.5
"950"
```

当值为指数时，使用`INCRBYFLOAT`命令后将被转换为小数的形式：

```sh
redis> SET pi 314e-2
OK
redis> INCRBYFLOAT pi 0.0
"3.14"
redis> GET pi
"3.14"
```

## 结束语

上文中为大家介绍了Redis中对字符串类型的值进行操作的一些命令，接下来的文章中将会继续为大家介绍位操作的命令以及Redis中其它类型的命令。

## 参考文献

- [Command reference - Redis](https://redis.io/commands)
