---
layout: post
title: Redis命令介绍之哈希的操作命令
date: 2020-07-13
last_modified_at: 2021-02-24
categories: [Redis]
tags: [Redis, hash]
excerpt: 介绍并以示例的形式展示Redis中哈希表操作的命令，包括HSET、HGET、HLEN、HDEL等。
---

> - 2021-02-24更新：增加Redis 6.2新增的`HRANDFIELD`命令。

在之前的文章中，我们介绍了Redis中有关于字符串（string）以及列表（list）类型的命令，今天我们来介绍Redis中另外一种类型——哈希表（hash）。哈希表还被称之为散列、字典等，我们在本文中便称它为哈希表。它是一个字符串类型`field`（下文中称之为域）与其关联的值（同样为字符串类型）的映射表。

哈希表的命令与字符串及键操作命令相似，其底层结构的实现也与Redis键空间相类似，所以文中在碰到与之前相类似的命令时将只做比较简单的介绍。

- [`HSET`](#hset)
- [`HGET`](#hget)
- [`HLEN`](#hlen)
- [`HDEL`](#hdel)
- [`HEXISTS`](#hexists)
- [`HSETNX`](#hsetnx)
- [`HMSET`](#hmset)
- [`HMGET`](#hmget)
- [`HGETALL`](#hgetall)
- [`HKEYS`](#hkeys)
- [`HVALS`](#hvals)
- [`HSCAN`](#hscan)
- [`HINCRBY`](#hincrby)
- [`HINCRBYFLOAT`](#hincrbyfloat)
- [`HSTRLEN`](#hstrlen)
- [`HRANDFIELD`](#hrandfield)

## HSET

`HSET`命令用于设置哈希表中指定域的值，并返回新添加的域的数量。若哈希表中对应的域已存在则将覆盖其值。在Redis 4.0.0及以上版本中，`HSET`命令允许同时设置一个或多个域的值，若版本低于4.0.0可使用下文将会介绍到的`HMSET`命令。

```
HSET key field value [field value ...]
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HGET students s02
"Li Si"
redis> HSET students s02 "Wang Wu" s003 "Zhao Liu"
(integer) 1
redis> HGET students s02
"Wang Wu"
```

## HGET

`HGET`命令用于获取哈希表中指定域对应的值，当哈希表不存在或哈希表中不存在指定名称的域时将返回`nil`。

```
HGET key field
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HGET students s02
"Li Si"
redis> HGET students s03
(nil)
```

## HLEN

`HLEN`命令用户获取哈希表中存在的域的数量，当哈希表不存在时将返回`0`。

```
HLEN key
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HLEN students
(integer) 2
redis> HSET students s03 "Wang Wu"
(integer) 2
redis> HLEN students
(integer) 3
```

## HDEL

`HDEL`命令用于移除哈希表中指定的域（Redis 2.4以上的版本支持同时移除一个或多个），并返回实际移除的域的个数。当指定的域不存在时将忽略该域不执行移除的操作；若哈希表不存在，将认为其为一个空哈希表并返回`0`。

```
HDEL key field [field ...]
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si" s3 "Wang Wu"
(integer) 3
redis> HLEN students
(integer) 3
redis> HDEL students s02 s03
(integer) 2
redis> HLEN students
(integer) 1
redus> HDEL student s02 s03
(integer) 0
```

## HEXISTS

`HEXISTS`命令用于获取哈希表中指定名称的域是否存在。

```
HEXISTS key field
```

当哈希表中存在指定域时返回`1`；当哈希表中不包含指定域或哈希表不存在时，返回`0`。

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HEXISTS student s01
(integer) 1
redis> HEXISTS student s03
(integer) 0
```

## HSETNX

`HSETNX`命令用于在哈希表中指定域不存在时设置其值，若域已存在将不执行操作。

```
HSETNX key field value
```

当域为一个新域且成功执行设置其值的操作后，将返回`1`。若在哈希表中域已存在，则不进行操作并返回`0`。

### 示例

```sh
redis> HSETNX students s01 "Zhang San"
(integer) 1
redis> HSETNX students s01 "Li Si"
(integer) 0
redis> HGET students s01
"Zhang San"
```

## HMSET

`HMSET`命令用于设置哈希表中一个或多个域的值。执行操作时若域已存在，将覆盖原先的值；若域不存在，将创建并设置其值。

```
HMSET key field value [field value ...]
```

`HMSET`命令在后续的版本中可能会被移除，请使用`HSET`命令代替。

### 示例

```sh
redis> HMSET students s01 "Zhang San" s02 "Li Si"
OK
redus> HGET students s01
"Zhang San"
redis> HGET students s02
"Li Si"
```

## HMGET

`HMGET`命令用于获取哈希表中一个或多个域的值，并已列表的形式按给定的域名顺序将其返回。

```
HMGET key field [field ...]
```

当指定域名不存在时，返回的列表中对应的值将为`nil`。若哈希表不存在，执行命令时将会视为一个空哈希表，并返回`nil`值的列表。

### 示例

```sh
redis> HSET students s01 "Zhang San" s03 "Li Si"
(integer) 2
redis> HMGET students s01 s02 s03
1) "Zhang San"
2) (nil)
3) "Li Si"
```

## HGETALL

`HGETALL`命令用于获取哈希表中所有域的域名及其对应的值，并以列表的形式将结果返回。返回的列表将以域名、值交替的形式呈现，其长度固定为哈希表大小的两倍。当哈希不存在时，将视为空哈希表并返回一个空白的队列。

```
HGETALL key
```

### 示例

```sh
# 不存在的哈希表
redis> HGETALL students
(empty array)
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HGETALL students
1) "s01"
2) "Zhang San"
3) "s02"
4) "Li Si"
```

## HKEYS

`HKEYS`命运用于获取指定哈希表中的所有键值对的键名，并以列表的形式返回。当哈希表为空时返回空列表。

```
HKEYS key
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HKEYS students
1) "s01"
2) "s02"
# 不存在的哈希表
redis> HKEYS cards
(empty array)
```

## HVALS

`HVALS`命运用于获取指定哈希表中的所有键值对的键值，并以列表的形式返回。当哈希表为空时返回空列表。

```
HVALS key
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HVALS students
1) "Zhang San"
2) "Li Si"
# 不存在的哈希表
redis> HVALS cards
(empty array)
```

## HSCAN

`HSCAN`命令与前文中介绍过的[`SCAN`](https://www.ghosind.com/2020/06/30/redis-keys#scan)命令类似，它用于增量式的迭代获取哈希表中的所有域，并返回其域名称及其值。相对于上文中介绍的`HGETALL`、`HKEYS`以及`HVALS`命令，在哈希表中域数量较多的情况下不会造成阻塞，进而相对更加安全。

```
HSCAN key cursor [MATCH pattern] [COUNT count]
```

与`SCAN`命令相同，`HSCAN`命令是一个基于游标`cursor`的迭代器，每次执行后将会返回一个新的游标，以作为下一轮迭代的游标参数。一次的迭代以游标`0`为开始，并在返回游标`0`时结束，称之为一次完整的迭代。同样，`HSCAN`命令也接受`MATCH`和`COUNT`两个参数，用于提供模式匹配的功能及限制获取的数量。

关于更多`HSCAN`命令的用法，可参考[`SCAN`](https://www.ghosind.com/2020/06/30/redis-keys#scan)命令。

### 示例

```sh
redis> HSCAN students 0
1) "0"
2) (empty array)
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HSCAN students 0
1) "0"
2) 1) "s01"
   2) "Zhang San"
   3) "s02"
   4) "Li Si"
```

## HINCRBY

`HINCRBY`命令与前文中介绍的与[`INCRBY`](https://www.ghosind.com/2020/06/24/string-manipulate#incr--incrby)命令类似，它用于对哈希表中指定域的值进行递增的操作，并返回执行递增操作后该域的值。若指定的域不存在，将在执行操作前将其值设置为0；若指定的哈希表不存在，则将创建对应的哈希表并执行操作。当指定的域的值无法表示为数值时，将返回错误。

与`INCRBY`命令相同，`HINCRBY`所支持的值为64位的有符号整数。若`incremnet`的值为负数值，其操作等同于做递减操作。

```
HINCRBY key field increment
```

### 示例

```sh
# 对不存在的键值对执行HINCRBY命令将创建对应的哈希表
redis> HINCRBY user rank 1
(integer) 1
redis> HINCRBY user rank 3
(integer) 4
redis> HSCAN user 0
1) "0"
2) 1) "rank"
   2) "4"
# 对非数值进行操作
redis> HSET user name "John Doe"
(integer) 1
redis> HINCRBY user name 1
(error) ERR hash value is not an integer
```

## HINCRBYFLOAT

`HINCRBYFLOAT`命令用于将哈希表中对应域的值解释为浮点数类型，执行递增指定浮点数值的操作，并返回执行递增后的值。`HINCRBYFLOAT`命令使用与`INCRBYFLOAT`命令相似，可参考[`INCRBYFLOAT`](https://www.ghosind.com/2020/06/24/string-manipulate#incrbyfloat)命令了解更多。

```
HINCRBYFLOAT key field increment
```

### 示例

```sh
redis> HINCRBYFLOAT user balance 100.5
"100.5"
redis> HINCRBYFLOAT user balance 15.5
"116"
redis> HINCRBYFLOAT user balance -16
"100"
```

## HSTRLEN

`HSTRLEN`命令用于获取哈希表中指定域的值的长度，若哈希表或域不存在则返回`0`。

```
HSTRLEN key field
```

### 示例

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si"
(integer) 2
redis> HSTRLEN students s01
(integer) 9
redis> HSTRLEN students s02
(integer) 5
# 不存在的域
redis> HSTRLEN students s03
(integer) 0
```

## HRANDFIELD

`HRANDFIELD`命令是Redis 6.2中新增的命令，用于随机获取指定哈希表中的域。

```
HRANDFIELD key [count [WITHVALUES]]
```

当未指定参数时，`HRANDFIELD`命令将返回哈希表中随机一个域。另外，`HRANDFIELD`命令支持两种形式的参数，分别用于指定获取的域数量或指定数量并返回其对应的值：

- `<count>`：指定获取的域数量，当该值大于哈希表中域总数时，将只返回存在的所有域。若该值为负数时，将返回该值对应的绝对值数量的域（即使大于总数），且可能存在重复。
- `<count> WITHVALUES`：指定获取的域数量，并返回其对应的值。

### 返回结果

若未指定返回数量时，将随机取出并以字符串的形式返回哈希表中的一个域，或在哈希表不存在时返回`nil`。

若指定返回数量，将以数组的形式返回取出的域。在使用`WITHVALUES`参数时，将以域、值交替的形式在返回的数组中表示。

### 示例

在不设置参数的情况下，将随机返回一个哈希表中存在的域：

```sh
redis> HSET students s01 "Zhang San" s02 "Li Si" s03 "Wang Wu"
(integer) 3
redis> HRANDFIELD students
"s02"
redis> HRANDFIELD students
"s01"
```

返回指定数量的域：

```sh
redis> HRANDFIELD students 0
(empty array)
redis> HRANDFIELD students 2
1) "s01"
2) "s03"
# 超出哈希表的总数量时只返回哈希表中全部的域
redis> HRANDFIELD students 6
1) "s01"
2) "s02"
3) "s03"
# 负数值将可能存在重复
redis> HRANDFIELD student -2
1) "s02"
2) "s02"
redis> HRANDFIELD student -6
1) "s03"
2) "s02"
3) "s03"
4) "s02"
5) "s02"
6) "s01"
```

使用`WITHVALUES`参数返回对应的值

```sh
redis> HRANDFIELD students 2 WITHVALUES
1) "s02"
2) "Li Si"
3) "s03"
4) "Wang Wu"
```

## 结束语

至此，我们已经介绍了Redis中包括字符串、哈希表、列表以及部分键操作命令在内的命令，在后续的文章中我们将继续介绍Redis中有关集合、有序集合类型等命令。

## 参考资料

- [Command reference - Redis](https://redis.io/commands)
