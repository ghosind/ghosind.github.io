---
layout: post
title: Redis命令介绍之键值对操作
date: 2020-06-30
categories: [Redis]
tags: [Redis, keys]
excerpt: 介绍并以示例的形式展示Redis中对键进行操作相关命令，如TYPE、RENAME、EXPIREAT、PERSIST、KEYS、SCAN、UNLINK等。
---

前文已经提及过Redis中对于键值对操作的一些命令，如[`DEL`](https://www.ghosind.com/2020/06/22/redis-string#del)、[`EXPIRE / PEXPIRE`](https://www.ghosind.com/2020/06/22/redis-string#expire--pexpire)、[`TTL / PTTL`](https://www.ghosind.com/2020/06/22/redis-string#ttl--pttl)以及[`EXISTS`](https://www.ghosind.com/2020/06/24/string-manipulate#exists)。今天我们继续介绍Redis中对键值对操作的相关命令。

## TYPE

`TYPE`命令用于获取指定键值对的类型，返回的值有`string`、`list`、`set`、`zset`、`hash`以及`stream`。当键值对不存在时返回`none`。

```
TYPE key
```

### 示例

```sh
redis> SET key1 "value"
OK
redis> LPUSH key2 "value"
(integer) 1
redis> SADD key3 "value"
(integer) 1
redis> TYPE key1
string
redis> TYPE key2
list
redis> TYPE key3
set
redis> TYPE key4
none
```

## RENAME / RENAMENX

`RENAME`命令用于将指定键名重命名，并在键值对不存在时返回一个错误。若新的键名已存在，将会覆盖旧值（无论旧值是否和新值是同一类型）。当Redis版本小于等于3.2.0时，若新键名与旧键名相同将返回错误。

```
RENAME key newkey
```

若原键`key`有关联过期时间，则无论新键是否关联有过期时间，都将被覆盖。

当新键名已经存在时，执行`RENAME`命令时会先隐式地调用`DEL`操作删除对应的键值对，再执行重命名的操作。

`RENAMENX`命令与`RENAME`相似，二者的区别为`RENAMENX`仅在新键名不存在的情况下才完成重命名的操作。若新键名`newkey`已存在将会返回`0`，否则在正确完成重命名操作后返回`0`。同样，当原键名不存在时将返回错误。

```
RENAMENX key newkey
```

### 示例

```sh
redis> SET greeting "hello"
OK
redis> RENAME greeting my-greeting
OK
redis> EXISTS greeting
(integer) 0
redis> EXISTS my-greeting
(integer) 1
redis> RENAME greeting new-greeting
(error) ERR no such key
```

当键名`key1`和`key2`都存在且类型不同时，使用`RENAME`也将覆盖`key2`的值：

```sh
redis> SET key1 "value1"
OK
redis> LPUSH key2 "value2"
(integer) 1
redis> RENAME key1 key2
OK
redis> TYPE key2
string
```

使用`RENAME`重命名关联过期时间的键：

```sh
# 新键继承原键的过期时间
redis> SET key1 EX 100
OK
redis> RENAME key1 key2
OK
redis> TTL key2
(integer) 98
# 新键原先的过期时间被覆盖
redis> SET key3 EX 300
OK
redis> RENAME key2 key3
OK
redis> TTL key3
(integer) 92
```

使用`RENAMENX`命令：

```sh
redis> SET key1 "value"
OK
redis> RENAMENX key1 key2
(integer) 1
# 新键名key3已存在的情况下
redis> SET key3 "value"
OK
redis> RENAMENX key2 key3
(integer) 0
```

## PERSIST

`PERSIST`命令用于移除指定键的过期时间。

```
PERSIST key
```

### 示例

```sh
redis> SET greeting "hello"
OK
redis> EXPIRE greeting 100
(integer) 1
redis> TTL greeting
(integer) 98
redis> PERSIST greeting
(integer) 1
redis> TTL greeting
(integer) -1
# 未关联过期时间的键
redis> PERSIST greeting
(integer) 0
```

## EXPIREAT / PEXPIREAT

`EXPIREAT`命令与之前介绍过的[`EXPIRE`及`PEXPIRE`](https://www.ghosind.com/2020/06/22/redis-string#expire--pexpire)命令类似，用于设置已存在的键值对的过期时间。与前两个命令不同的是，`EXPIREAT`和`PEXPIREAT`接受的参数是以秒为单位的Unix时间戳。当过期时间被成功设置，该命令将返回`1`，反之返回`0`。

```
EXPIREAT key timestamp
```

与`EXPIRE`相同，若指定的过期时间戳早于当前时间，该键将被删除。

`PEXPIREAT`与`EXPIREAT`相同，它通过传递的以毫秒为单位的Unix时间戳设置过期的时间。

```
EXPIREAT key milliseconds-timestamp
```

### 示例

```sh
# 假设当前时间为1577836800 (2020-01-01T00:00:00)
redis> SET greeting "hello"
OK
# 2020-01-01T00:01:40
redis> EXPIREAT greeting 1577836900
(integer) 1
redis> TTL greeting
(integer) 99
# 早于当前时间的时间戳1577836700 (2019-12-31T23:58:20)
redis> EXPIREAT greeting 1577836700
(integer) 1
redis> EXISTS greeting
(integer) 0
```

通过`PEXPIREAT`设置毫秒为单位的过期时间：

```sh
# 毫秒为单位的时间戳1577836900000 (2020-01-01T00:01:40)
redis> PEXPIREAT greeting 1577836900000
(integer) 1
redis> PTTL greeting
(integer) 98805
redis> TTL greeting
(integer) 98
```

## KEYS

`KEYS`用于获取所有符合给定模式（pattern）要求的键。

```
KEYS pattern
```

由于`KEYS`会扫描当前数据库中所有的键值对，在生产环境中应当尽量避免使用该命令。如果需要相应的功能，可以使用下面将介绍的`SCAN`命令替代，或者另外使用`set`保存可能需要访问的键名。

`KEYS`命令支持glob-style的模式，包括有：

- `?`代表匹配任意单个字符，例如`h?llo`匹配`hello`、`hallo`等；
- `*`代表匹配0个或多个任意字符，例如`h*llo`匹配`hello`、`hllllllo`等；
- `[characters]`匹配一个方括号内的字符，例如`h[ae]llo`匹配`hello`以及`hallo`；
- `[^character]`匹配一个非括号内`^`符号后的字符，例如`h[^e]llo`匹配`hallo`、`hbllo`等，但不匹配`hello`；
- `[character-character]`匹配一个方括号内两个字符范围内的所有字符，例如`h[a-e]llo`匹配`hallo`、`hbllo`、`hcllo`、`hdllo`以及`hello`。

若模式内需要保护以上提到的`?`、`*`、`[`、`]`、`^`、`-`字符，可以使用`\`进行转义。

### 示例

```sh
redis> MSET firstname John lastname Doe age 25
OK
redis> KEYS *name*
1) "firstname"
2) "lastname"
redis> KEYS a??
1) "age"
redis> KEYS *
1) "firstname"
2) "lastname"
3) "age"
```

## SCAN

`SCAN`命令用于增量式迭代元素集合，与其相似的还有`SSCAN`、`HSCAN`以及`ZSCAN`。`SCAN`用于迭代当前数据库中的所有键，其它几个分别是对集合、哈希、有序集合类型进行迭代，我们将在后续的文章中对其它几个命令进行介绍。

增量迭代的命令每次执行只会返回少数结果，不同于`KEYS`命令返回所有的结果（可能导致服务阻塞）。但是使用增量式迭代的过程中可能会发现键被修改的情况，它只能对返回的结果提供有限的保证。

```
SCAN cursor [MATCH pattern] [COUNT count] [TYPE type]
```

`SCAN`命令是一个基于游标`cursor`的迭代器，每次执行后将会返回一个新的游标，以作为下一轮迭代的游标参数。一次的迭代以游标`0`为开始，并在返回游标0时结束，称之为一次完整的迭代。若在迭代的途中使用了错误的游标，命令执行的结果将不能保证正确，但不会对服务器本身造成影响。

`SCAN`命令将会返回一个包含两个值的数组，数组的第一个值为下一轮迭代的新游标，第二个元素为一个数组，其中包含本轮迭代遍历到的元素。

对于`SCAN`命令，以及上面提到的`SCAN`族中的其它命令，只能在完整迭代下提供保证对于完整遍历开始至结束期间都存在的所有元素，必然在某次迭代中被返回；而对于在完整迭代中不存在的元素（如迭代开始前被删除或迭代结束后被添加的元素），必然不会被返回。

在一次完整的迭代中，一个元素可能会被多次返回，需要客户端自己处理重复的情况。在迭代中若存在元素并非一直存在（中途添加或删除），则不能确定是否会被返回，这是一个未定义的行为。增量迭代的算法只能保证数据集在有界的情况下停止，若在迭代的途中不断添加新的数据，迭代可能将用于不会结束。

`SCAN`命令不能保证每次迭代返回的元素数量，返回0个元素也是被允许的，只要是返回的游标不为0迭代都仍未结束。对于一个较大的数据集，每次迭代可能会返回数十个元素；而对于一个较小的数据集，一次迭代可能会返回全部的元素。另外，可以通过`COUNT`参数设置每次迭代返回元素的最大值。

Redis可同时正确处理来自多个客户端的迭代请求，迭代中的游标记录包含了迭代的所有状态，服务器无须另外记录迭代的状态。同时，客户端也可在任意时刻停止迭代，且不会对服务器造成影响。

### 可选参数

- `MATCH` 提供与`KEYS`相同的模式匹配行为，执行后将只返回符合模式的键。
- `COUNT` 用于设置迭代返回元素数量的最大值，默认值为10。通常每次迭代获取的元素数量达到指定值时将结束，但`COUNT`参数仅是一个作为提示（hint）的值。
  - 当遍历一个足够大的数据集时且未使用`MATCH`选项时，返回的结果可能略大于指定的值。
  - 当遍历一个整数集合或编码为压缩列表（`ziplist`），将会在第一次迭代就返回所有元素。
- `TYPE` Redis 6.0中新加的参数，使迭代时只遍历指定类型的键。其参数允许的值为`string`、`list`、`set`、`zset`、`hash`以及`stream`，即`TYPE`命令可能返回的所有类型。`TYPE`参数只可被用于`SCAN`命令。

### 示例

```sh
# 设置了15个键，键名为key1至key15
# 以0作为游标
# 命令返回游标7以及包含本次被迭代的元素
redis> SCAN 0
1) "7"
2)  1) "key13"
    2) "key5"
    3) "key11"
    4) "key6"
    5) "key9"
    6) "key12"
    7) "key3"
    8) "key4"
    9) "key10"
   10) "key2"
   11) "key1"
   12) "key7"
# 以游标7作为第二次迭代的新游标
# 命令返回0，表示迭代结束
redis> SCAN 7
1) "0"
2) 1) "key15"
   2) "key14"
   3) "key8"
```

当当前数据库为空时使用`SCAN`命令：

```sh
redis> SCAN 0
1) "0"
2) (empty array)
```

使用`MATCH`参数：

```sh
redis> MSET firstname John lastname Doe age 25
OK
redis> SCAN 0 MATCH *name*
1) "0"
2)  1) "firstname"
    2) "lastname"
```

## RANDOMKEY

`RANDOMKEY`命令用于随机取出一个存在的键。若当前数据库中不存在任何键，则返回`nil`。

```
RANDOMKEY
```

### 示例

```sh
redis> RANDOMKEY
(nil)
redis> MSET key1 "value1" key2 "value2" key3 "value3" key4 "value4" key5 "value5"
OK
redis> RANDOMKEY
"key5"
redis> RANDOMKEY
"key1"
```

## UNLINK

`UNLINK`命令与`DEL`命令相似，它被用于删除指定键名中存在的键，并忽略不存在的键。此命令与`DEL`命令的区别是，它在另一个线程中执行删除的操作。其执行删除操作时会先将需要删除的键从键空间中移除，再异步地释放资源。`UNLINK`命令是非阻塞的删除操作，而`DEL`命令是阻塞的删除操作，在一些较复杂的情况下可采用`UNLINK`命令避免Redis阻塞（在6.0版本前Redis是单线程处理的）。

```
UNLINK key [key ...]
```

`UNLINK`命令与`DEL`命令相同，都将返回删除键的个数。

### 示例

```sh
redis> SET key1 "value1"
OK
redis> SET key2 "value2"
OK
redis> UNLINK key1 key2 key3
(integer) 2
```

## 结束语

本文中介绍了Redis中对键进行操作的相关命令，对于Redis文档中Keys类别下的诸如`DUMP`、`MOVE`、`OBJECT`等命令，将会在后续介绍Redis的迁移、服务、调试等相关命令时会提及，本文中便暂时不深入介绍。

## 参考文献

- [Command reference - Redis](https://redis.io/commands)
