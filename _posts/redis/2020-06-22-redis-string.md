---
layout: post
title: Redis基本类型之字符串的基本操作
date: 2020-06-22
categories: [Redis]
tags: [Redis, string]
excerpt: 介绍并以示例的形式展示Redis中字符串相关的SET、GET、DEL、EXPIRE、TTL、MSET、MGET等命令。
---

Redis是一个当前非常流行的开源内存数据库，它支持包括字符串（String）、链表（List）、哈希集合（Hash）、集合（Set）、有序集合（Sorted Set）五种数据类型。在接下来一系列文章中，将在Redis支持的数据类型的基础上，介绍相关的操作命令。作为开篇，本文将先介绍字符串类型的操作命令。

本文中除特别注明的命令外，都只可被用于操作字符串类型的键值对。

## SET

`SET`命令为指定名称的键设置字符串类型的值，若键已存在则覆盖旧值（未指定特定参数的情况下）。

```
SET key value [EX seconds|PX milliseconds] [NX|XX] [KEEPTTL]
```

### 可选参数

`SET`命令有`EX`、`PX`、`NX`、`XX`以及`KEEPTTL`五个可选参数，其中`KEEPTTL`为6.0版本添加的可选参数，其它为2.6.12版本添加的可选参数。

- `EX seconds` 以秒为单位设置过期时间
- `PX milliseconds` 以毫秒为单位设置过期时间
- `NX` 键不存在的时候设置键值
- `XX` 键存在的时候设置键值
- `KEEPTTL` 保留设置前指定键的生存时间

`SET`命令使用`EX`、`PX`、`NX`参数，其效果等同于`SETEX`、`PSETEX`、`SETNX`命令。根据官方文档的描述，未来版本中`SETEX`、`PSETEX`、`SETNX`命令可能会被淘汰。

### 返回值

设置成功则返回`OK`；返回`nil`为未执行`SET`命令，如不满足`NX`、`XX`条件等。

### 示例

设置`greeting`键的值，并随后设置新值：

```sh
# 设置键名greeting的值为hello world
redis> SET greeting "hello world"
OK
# 获取greeting键的值
redis> GET greeting
"hello world"
# 为greeting键设置新值
redis> SET greeting "hello redis"
OK
redis> GET greeting
"hello redis"
```

使用`EX`参数设置过期时间，并使用`NX`参数在键不存在的时候设置键值：

```sh
# 为greeting键设置10秒的过期时间
redis> SET greeting "hello world" EX 10
OK
# 获取剩余生存时间
redis> TTL greeting
(integer) 9
# 键不存在时设置
redis> SET greeting "hello redis" NX
(nil)
# 等待greeting过期后，使用TTL命令获取到的生存时间为-2
redis> TTL greeting
(integer) -2
# 使用NX参数设置成功
redis> SET greeting "hello redis" NX
OK
```

使用`KEEPTTL`参数将会保留原键值对的生存时间：

```sh
redis> SET greeting "hello world" EX 100
OK
redis> TTL greeting
(integer) 99
redis> SET greeting "hello redis" KEEPTTL
OK
redis> TTL greeting
(integer) 97
```

## GET

`GET`命令为获取指定名称键的键值。

```
GET key
```

### 返回值

- 当键存在且值为字符串时返回对应的值；
- 当键不存在时返回`nil`；
- 当键值不为字符串时返回错误。

### 示例

```sh
redis> SET greeting "hello world"
OK
redis> GET greeting
"hello world"
redis> GET age
(nil)
```

当使用`GET`命令获取的键不为字符串时将返回错误：

```sh
# LPUSH为列表类型命令
redis> LPUSH students "John Doe"
(integer) 1
redis> GET students
(error) WRONGTYPE Operation against a key holding the wrong kind of value
```

## GETSET

`GETSET`命令用于设置键值对的值并返回旧值，若键值对不存在则返回`nil`。若键存在但不为字符串类型，则返回错误。

```
GETSET key value
```

### 示例

```sh
redis> SET greeting "hello world"
OK
redis> GETSET greeting "hello redis"
"hello world"
redis> GET greeting
"hello redis"
```

## DEL

`DEL`命令被用于删除指定的一个或多个键值对，当其中某个键值对不存在时将被忽略。`DEL`命令可被用于所有数据类型，不仅限于字符串。

```
DEL key [key ...]
```

`DEL`将返回被删除的键值对个数。

### 示例

```sh
redis> SET key1 "value1"
OK
redis> SET key2 "value2"
OK
redis> DEL key1 key2 key3
(integer) 2
```

## EXPIRE / PEXPIRE

`EXPIRE`命令被用于设置某个键的过期时间，其值以秒作为单位。当设置过期时间后使用`SET`（不使用`KEEPTTL`参数）、`GETSET`等命令，所设置的过期时间将被覆盖。`EXPIRE`可被用于所有数据类型，不仅限于字符串。

```
EXPIRE key seconds
```

`PEXPIRE`命令以毫秒作为单位设置某个键的过期时间。

```
PEXPIRE key milliseconds
```

### 返回值

- 当过期时间被设置，则返回`1`
- 当键不存在，则返回`0`

### 示例

```sh
redis> SET greeting "hello"
OK
redis> EXPIRE greeting 10
(integer) 1
redis> TTL greeting
(integer) 9
# 覆盖过期时间
redis> SET greeting "hello redis"
OK
redis> TTL greeting
(integer) -1
# 为不存在的键设置过期时间
redis> EXPIRE none 10
(integer) 0
```

## TTL / PTTL

`TTL`命令用于获取指定键的剩余生存时间（time to live, TTL），其值以秒作为生存时间的单位。`TTL`命令可被用于所有数据类型，不仅限于字符串。

```
TTL key
```

`PTTL`命令同样用于获取指定键的剩余生存时间，与`TTL`区别为其以毫秒作为单位。

```
PTTL key
```

### 返回值

- 当键设置过期时间时，返回剩余的生存时间
- 当键存在但未设置过期时间时，返回`-1`
- 当键不存在时，返回`-2`

### 示例

```sh
redis> SET greeting "hello world"
OK
redis> TTL greeting
(integer) -1
# 设置10秒的过期时间
redis> EXPIRE greeting 10
(integer) 1
redis> TTL greeting
(integer) 9
# 等待greeting键过期
redis> TTL greeting
(integer) -2
```

## SETEX / PSETEX

`SETEX`命令为指定名称的键设置值，并以秒为单位设置其生存时间。

```
SETEX key seconds value
```

`SETEX`命令效果等同于使用`SET key value`及`EXPIRE key seconds`命令，以及`SET key value EX seconds`命令。`SETEX`命令具备原子性，它等同于在`MULTI`/`EXEC`块中使用`SET`以及`EXPIRE`命令。

```sh
redis> SET mykey 10 "test"
# 等同于
redis> SET mykey "test"
redis> EXPIRE mykey 10
# 等同于
redis> SET mykey "test" EX 10
```

`PSETEX`命令与`SETEX`命令相似，二者区别为`PSETEX`设置的生存时间以毫秒作为单位。

```
PSETEX key milliseconds value
```

### 示例

`SETEX`命令的使用：

```sh
# 过期时间不正确
redis> SETEX greeting -1 "hello"
(error) ERR invalid expire time in setex
redis> SETEX greeting 99999999999999 "hello"
(error) ERR value is not an integer or out of range
# 设置争取的过期时间
redis> SETEX greeting 10 "hello"
OK
```

`PSETEX`命令的使用：

```sh
# 生存时间为10000毫秒（10秒）
redis> PSETEX greeting 10000 "hello"
OK
redis> PTTL greeting
(integer) 9885
redis> TTL greeting
(integer) 9
```

## SETNX

当指定名称的键不存在时设置字符串值，否则不执行操作。其效果等同于在键不存在时直接使用`SET`命令，或是在任意情况下使用`NX`参数。

```
SETNX key value
```

### 返回值

当成功设置键值时返回`1`，否则返回`0`（即键已存在的情况下）。

### 示例

```sh
redis> SETNX mykey "hello"
(integer) 1
redis> SETNX mykey "redis"
(integer) 0
redis> GET mykey
"hello"
```

## MSET

`MSET`命令用于设置一个或多个键值对，该命令永远返回`OK`。`MSET`与`SET`命令相同，都会替代存在的键的值。

```
MSET key value [key value ...]
```

`MSET`命令具有原子性，所有的键都会一起被设置。其不存在一部分键值被更新，另一部分仍为旧值的情况。

### 示例

```sh
redis> MSET key1 "value1" key2 "value2"
OK
redis> GET key1
"value1"
redis> GET key2
"value2"
```

## MGET

`MGET`用于获取所有指定的键值。当某个键不存在时，将返回一个特殊的值`nil`。

```
MGET key [key ...]
```

### 示例

```sh
redis> MSET key1 "value1" key3 "value3"
OK
redis> GET key1 key2 key3
1) "value1"
2) (nil)
3) "value3"
```

## MSETNX

`MSETNX`命令用于设置一个或多个键值对，仅当所有键都不存在时才会执行。同样，`MSETNX`也具备原子性，所有的键会被一起被设置。

```
MSETNX key value [key value ...]
```

### 返回值

- 当所有的键被设置，则返回`1`
- 当所有的键都没有被设置，即至少一个键已存在的情况，则返回`0`

### 示例

```sh
redis> MSETNX mykey1 "value1" mykey2 "value2"
(integer) 1
redis> MSETNX mykey2 "new value" myKey3 "value3"
(integer) 0
redis> MGET key1 key2 key3
1) "value1"
2) "value2"
3) (nil)
```

## 结束语

本文简单的介绍了Redis中对于字符串类型键的一些基本操作命令，接下来的文章中将继续介绍Redis中对字符串值操作的一些命令以及其它类型的操作命令。

## 参考文献

- [Command reference - Redis](https://redis.io/commands)
