---
layout: post
title: Redis命令介绍之有序集合的操作命令（第一部分）
date: 2020-08-28
categories: [Redis]
tags: [Redis, sorted set]
excerpt: 介绍并以示例的形式展示Redis中有序集合（Sorted Set）操作的命令，包括ZADD、ZREM等增加、删除元素，ZCARD、ZCOUNT等元素数量统计以及ZSCORE获取元素score值等操作命令。
---

在前面的章节中，我们介绍了Redis中字符串、哈希（Hash）、列表（List）以及集合（Set）四种数据类型，本文将继续介绍Redis中的有序集合。在Redis中，有序集合（Sorted Set）是一种与集合类似的结构。与集合不同的是，有序集合中每个元素都会关联一个浮点数值，称之为`score`。在有序集合中，始终通过元素的`score`值进行排序。

由于有序集合的操作命令较多，将分为两篇文章，其中本文将会先介绍有序集合的`ZADD`、`ZCARD`、`ZREM`等命令。

## ZADD

`ZADD`命令用于将指定元素及其`score`值添加至有序集合中，并返回新增的元素个数（除使用`INCR`参数的情况外），在Redis 2.4及以上版本中可一次添加一个或多个元素。当添加的元素已存在时，将会更新其`score`值，并根据该值重新插入到对应的位置保持正确的顺序。

```
ZADD key [NX|XX] [CH] [INCR] score member [score member ...]
```

有序集合中元素的`score`值为一个64位浮点数值，并使用IEEE 754浮点数标准所表示。它可被表示为-(2^54) ~ (2^54)之间的整数，且可使用`+inf`及`-inf`分别表示为正负无穷大值。当有序集合中有多个元素的`score`值相同时，将安装字典序（lexicographically）进行排序，字典序即对应的单词在字典中的先后顺序。

### 参数

Redis 3.0.2及以上版本支持以下参数：

- `NX`：不更新已经存在的元素，只增加新元素。
- `XX`：只更新已经存在的元素，不增加新元素。
- `CH`：返回值由新增的元素个数变为修改的元素个数，修改的元素包括新增的元素和已存在元素中`score`值有更新的元素。
- `INCR`：使用该参数时执行的操作类似于[`ZINCRBY`](#zincrby)操作，对指定元素的`score`值执行递增操作，并返回更新后的`score`值。当操作执行失败时（如使用了`NX`或`XX`参数的情况下），将返回`nil`。

其中，`NX`与`XX`参数不能同时使用。另外，使用`INCR`参数时与其它情况较为不同，只允许设置一个元素，并返回更新后的`score`值。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two"
(integer) 2
redis> ZRANGE numbers 0 -1
1) "one"
2) "two"
# 添加的元素中包含已存在的元素，将会更新该元素
redis> ZADD numbers 4 "one" 3 "three"
(integer) 1
redis> ZRANGE numbers 0 -1 WITHSCORES
1) "two"
2) "2"
3) "three"
4) "3"
5) "one"
6) "4"
```

使用`NX`参数：

```sh
redis> ZADD numbers 1 "one" 2 "two"
(integer) 2
redis> ZADD numbers 0 -1
1) "one"
2) "two"
redis> ZADD numbers NX 4 "one" 3 "three"
(integer) 1
redis> ZRANGE numbers 0 -1 WITHSCORES
1) "one"
2) "1"
3) "two"
4) "2"
5) "three"
6) "3"
```

使用`XX`参数：

```sh
redis> ZADD numbers 1 "one" 2 "two"
(integer) 2
redis> ZADD numbers 0 -1
1) "one"
2) "two"
redis> ZADD numbers NX 4 "one" 3 "three"
(integer) 1
redis> ZRANGE numbers 0 -1 WITHSCORES
1) "two"
2) "2"
3) "one"
4) "4"
```

使用`CH`参数：

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZADD numbers CH 1 "one"
(integer) 0
redis> ZADD numbers CH 2 "one"
(integer) 1
```

使用`INCR`参数：

```sh
redis> ZADD numbers INCR 1 "one"
"1"
redis> ZADD numbers NX INCR 1 "one"
(nil)
redis> ZADD numbers INCR 1 "one"
"2"
```

## ZRANGE

`ZRANGE`命令用于获取有序集合中有`start`及`stop`参数所指定范围内的元素，并以其`score`值按从小到大的顺序返回。当存在多个元素`score`值相同时，将按字典序排列。

```
ZRANGE key start stop [WITHSCORES]
```

`start`及`stop`参数为以0为开始的索引数值，即`0`代表第一个元素，`1`代表第二个元素。当值为负数时，表示相对于有序集合末尾的的偏移值，即`-1`代表有序集合中最后一个元素，`-2`代表倒数第二个元素。`start`与`stop`所对应位置的元素都将被包含在返回的数据中，例如使用`ZRANGE key 0 1`将返回第一个和第二个元素。

当获取的返回超出有序集合的大小时不会产生错误。当`start`大于有序集合的大小或`start`的值大于`stop`的值时，将会返回一个空列表。当`stop`的值大于有序集合的大小时，将只会获取到最后一个元素为止。

当使用参数`WITHSCORES`时，返回的结果将包括各元素的`score`值，并以`value1, score1, ..., valueN, scoreN`的顺序返回。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZRANGE numbers 0 -1
1) "one"
2) "two"
3) "three"
redis> ZRANGE numbers -2 -1
1) "two"
2) "three"
redis> ZRANGE numbers 2 5
1) "three"
```

使用`WITHSCORES`参数：

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZRANGE numbers 0 -1
1) "one"
2) "1"
3) "two"
4) "2"
5) "three"
6) "6"
```

## ZREVRANGE

`ZREVRANGE`命令与`ZRANGE`命令相似，也用于列出有序集合中指定位置的元素，但其排列顺序为按`score`值从高到低。当多个元素`score`值相同时，将按字典序逆向排序。

```
ZREVRANGE key start stop [WITHSCORES]
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZRREVANGE numbers 0 -1
1) "three"
2) "two"
3) "one"
redis> ZRREVANGE numbers -2 -1
1) "two"
2) "one"
redis> ZRREVANGE numbers 2 3
1) "one"
```

## ZREM

`ZREM`命令用于移除有序集合中的指定元素，并实际时间移除的元素个数。其中，不存在的元素将被忽略。当`key`对应的键存在但类型不为有序集合时，将返回错误。

```
ZREM key member [member ...]
```

在Redis 2.4及以上的版本中，`ZREM`支持一次移除多个元素。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZREM numbers "one" "four" "five"
(integer) 1
redis> ZRANGE numbers 0 -1
1) "two"
2) "three"
```

## ZCARD

`ZCARD`命令用于获取有序集合的基数（cardinality，即集合中元素的个数），若集合不存在则返回`0`。

```
ZCARD key
```

### 示例

```sh
# 集合numbers不存在
redis> ZCARD numbers
(integer) 0
redis> ZADD numbers 1 "one"
(integer) 1
redis> ZADD numbers 2 "two"
(integer) 1
redis> ZCARD numbers
(integer) 2
```

## ZSCAN

`ZSCAN`命令与前文中介绍过的[`SCAN`](https://www.ghosind.com/2020/06/30/redis-keys#scan)命令类似，它用于增量式的迭代获取集合中的所有元素。同样，`ZSCAN`命令是一个基于游标`cursor`的迭代器，每次执行后将会返回一个新的游标，以作为下一轮迭代的游标参数。关于更多`ZSCAN`命令的用法，可参考[`SCAN`](https://www.ghosind.com/2020/06/30/redis-keys#scan)命令。

```
ZSCAN key cursor [MATCH pattern] [COUNT count]
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> SCAN numbers 0
1) "0"
2) 1) "two"
   2) "1"
   3) "two"
   4) "2"
   5) "three"
   6) "3"
```

## ZSCORE

`ZSCORE`命令用于获取有序集合中指定元素的`score`值，并以字符串的形式返回。若集合中不存在该元素或集合不存在，则返回`nil`。

```
ZSCORE key member
```

### 示例

```sh
# 集合numbers不存在
redis> ZSCORE numbers "one"
(nil)
redis> ZADD numbers 1 "one"
(integer) 1
redis> ZSCORE numbers "one"
"1"
# 不存在的元素
redis> ZSCORE numbers "two"
(nil)
```

## ZINCRBY

`ZINCRBY`命令用于将有序集合中元素`score`的值增加`increment`参数所指定的值，并返回新值。若元素不存在，则认为其原值为`0.0`。

```
ZINCRBY key increment member
```

`increment`参数接受整型或浮点型的值，若该值为负数则将为该元素的`score`值减去`increment`的绝对值。

### 示例

```sh
redis> ZADD numbers 1 "one"
(integer) 1
redis> ZINCRBY numbers 2 "one"
(integer) 3
redis> ZSCORE numbers "one"
"3"
```

集合中不存在指定的元素的情况：

```sh
redis> ZSCORE numbers "one"
(nil)
redis> ZINCRBY numbers 1 "one"
(integer) 1
redis> ZSCORE numbers "one"
"1"
```

## ZRANGEBYSCORE

`ZRANGEBYSCORE`命令用于获取有序集合中`score`值在`min`与`max`范围之间的元素，并以`score`值从低到高的顺序返回。当有多个元素的`score`值相同时将以字典序进行排序。

```
ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
```

`min`与`max`参数分别表示获取的元素中`score`的最小值与最大值。其中，`min`和`max`参数除了可以使用数值表示外，还可以有以下几种情况：

- 分别使用`-inf`以及`+inf`表示正负无穷；
- 使用`(`表示不包括参数所指定的值，例如：
    - `ZRANGEBYSCORE key (0 5`表示`0 < score <= 5`
    - `ZRANGEBYSCORE key 0 (5`表示`0 <= score < 5`
    - `ZRANGEBYSCORE key (0 (5`表示`0 < score < 5`

当使用参数`LIMIT`时，表示获取从`offset`开始的数量为`count`的元素。`LIMIT`参数的使用类似与SQL中的`SELECT LIMIT offset, limit`语句，例如`ZRANGEBYSCORE key 0 5 LIMIT 1 2`表示获取有序集合中`score`值在`0`到`5`范围内以从低到高的顺序排序后第2个元素起的两个元素。当`count`的值为负数时，将返回剩下的所有元素。

与`ZRANGE`相同，使用`WITHSCORES`参数使返回的结果包含元素对应的`score`值。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZRANGEBYSCORE numbers -inf +inf
1) "one"
2) "two"
3) "three"
4) "four"
5) "five"
redis> ZRANGEBYSCORE numbers 2 4
1) "two"
2) "three"
3) "four"
redis> ZRANGEBYSCORE numbers (2 4
1) "three"
2) "four"
redis> ZRANGEBYSCORE numbers 2 (4
1) "two"
2) "three"
redis> ZRANGEBYSCORE numbers (2 (4
1) "three"
```

使用`LIMIT`参数：

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZRANGEBYSCORE numbers -inf +inf LIMIT 0 2
1) "one"
2) "two"
redis> ZRANGEBYSCORE numbers -inf +inf LIMIT 2 2
1) "three"
2) "four"
```

## ZREVRANGEBYSCORE

`ZREVRANGEBYSCORE`命令与`ZRANGEBYSCORE`命令相类似，二者区别为`ZREVRANGEBYSCORE`命令以`score`值从高到低的顺序返回。

```
ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 4
redis> ZREVRANGESCORE numbers +inf -inf
1) "three"
2) "two"
3) "one"
```

## ZCOUNT

`ZCOUNT`命令用于获取`score`值在指定的范围内的元素个数。

```
ZCOUNT key min max
```

与[`ZRANGEBYSCORE`](#zrangebyscore)相同，`ZCOUNT`的参数`min`和`max`可使用`-inf`和`+inf`表示正/负无穷，并使用`(`表示不包括参数所指定的值。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
# -inf <= score <= +inf
redis> ZCOUNT numbers -inf +inf
(integer) 3
# 1 <= score <= 3
redis> ZCOUNT numbers 1 3
(integer) 3
# 1 < score <= 3
redis> ZCOUNT numbers (1 3
(integer) 2
# 1 < score < 3
redis> ZCOUNT numbers (1 (3
(integer) 1
```

## ZPOPMAX

`ZPOPMAX`命令用于移除并返回有序集合中分值（即`score`值）最高的参数`count`所指定个数的元素。若`count`参数未指定，其值默认为`1`。当`count`的值大于集合中元素的数量，将移除并返回全部的元素而非返回错误。

```
ZPOPMAX key [count]
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZPOPMAX numbers
1) "three"
2) "3"
redis> ZRANGE numbers 0 -1
1) "one"
2) "two"
```

移除多个元素：

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZPOPMAX numbers 3
1) "five"
2) "5"
3) "four"
4) "4"
5) "three"
6) "3"
```

`count`大于集合中元素的个数的情况：

```sh
redis> ZADD numbers 1 "one" 2 "two"
(integer) 2
redis> ZCARD numbers
(integer) 2
redis> ZPOPMAX numbers 3
1) "two"
2) "2"
3) "one"
4) "1"
redis> ZPOPMAX numbers
(empty list or set)
```

## ZPOPMIN

`ZPOPMIN`命令与`ZPOPMAX`命令相似，二者区别为`ZPOPMIN`用于移除有序集合中分值（即`score`的值）最小的元素。

```
ZPOPMIN key [count]
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZPOPMIN numbers
1) "one"
2) "1"
redis> ZRANGE numbers 0 -1
1) "two"
2) "three"
```

## 结束语

在本文中，我们介绍了有序集合的`ZADD`、`ZREM`、`ZCARD`等命令，在有序集合的第二部分中，我们将继续介绍其`ZRANK`、`ZLEXCOUNT`、`BZPOPMAX`、`ZINTERSTORE`等命令。

## 参考资料

- [Command reference - Redis](https://redis.io/commands)
