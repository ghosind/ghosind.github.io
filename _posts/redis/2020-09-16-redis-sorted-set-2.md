---
layout: post
title: Redis命令介绍之有序集合的操作命令（第二部分）
date: 2020-09-16
categories: [Redis]
tags: [Redis, sorted set]
excerpt: 介绍并以示例的形式展示Redis中有序集合（Sorted Set）操作的命令，包括阻塞版的命令BZPOPMAX、获取指定排序下在有序集合中位置的ZRANK、字典序相关的ZRANGEBYLEX以及交并集等有序集合的操作命令。
---

在上一篇文章[Redis命令介绍之有序集合的操作命令（第一部分）](https://www.ghosind.com/2020/08/28/redis-sorted-set-1)中，我们为大家介绍了Redis中关于有序集合的`ZADD`、`ZSCORE`、`ZRANGEBYSCORE`等操作命令。在本文中我们将继续了解Redis中有关有序集合的命令。

## BZPOPMAX

和列表中的`BLPOP`等阻塞式的命令一样，有序集合也提供了`BZPOPMAX`与`BZPOPMIN`两个阻塞版的命令。

`BZPOPMAX`命令用于弹出指定有序集合中`score`最大的元素，它将返回第一个非空有序集合中`score`最大的元素，而非所有有序集合中最大的元素。当给定的有序集合都为空时，将阻塞连接直到超时或有元素可被弹出。

```
BZPOPMAX key [key ...] timeout
```

`BZPOPMAX`接受一个以秒为单位的整数值`timeout`，用于表示当给定的集合都为空时阻塞连接等待的时长。当`timeout`的值为0时，表示将一直等待直到有元素可被弹出为止。`timeout`值只接受0或正整数值，当`timeout`值为负数时将返回错误。

### 返回值

`BZPOPMAX`命令将返回一个包含三个元素的数组，分别为弹出元素的有序集合键名、被弹出的元素以及被弹出的元素的`score`值。

当给定的有序集合为空，且在给定`timeout`时间的内也没有元素可被弹出的情况下，将返回`nil`。

### 示例

弹出第一个非空有序集合中的最大元素：

```sh
# nums1不存在
redis> ZADD nums2 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZADD nums3 4 "four"
(integer) 4
redis> BZPOPMAX nums1 nums2 nums3 0
1) "nums2"
2) "three"
3) "3"
```

给定的有序集合为空的情况：

```sh
redis1> BZPOPMAX numbers 10
# 10秒后
(nil)
(10.05s)
redis1> BZPOPMAX numbers 0
# redis2> ZADD numbers 1 "one"
1) "numbers"
2) "one"
3) "1"
(1.36s)
```

## BZPOPMIN

`BZPOPMIN`与`BZPOPMAX`命令类似，二者区别为`BZPOPMIN`返回第一个非空有序集合中`score`值最小的元素。关于`BZPOPMIN`命令更多的介绍，请参考上文中的`BZPOPMAX`命令。

```
BZPOPMIN key [key ...] timeout
```

### 示例

```sh
redis> ZADD nums1 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZADD nums2 4 "four"
(integer) 1
redis> BZPOPMIN nums1 nums2 0
1) "nums1"
2) "one"
3) "1"
```

## ZREMRANGEBYSCORE

`ZREMRANGEBYSCORE`命令用于移除有序集合中`score`值在参数`min`与`max`所指定范围内的元素，并返回实际移除的元素个数。

```
ZREMRANGEBYSCORE key min max
```

在一般情况下，`ZREMRANGEBYSCORE`的参数`min`与`max`所指定的范围包含值为二者的元素。为了实现不包含端点值的情况，可使用`(`标识，例如`ZREMRANGEBYSCORE key (1 5`表示移除`1 < score <= 5`的元素。关于参数`min`与`max`值的说明，可参考[ZRANGEBYSCORE](https://www.ghosind.com/2020/08/28/redis-sorted-set-1#zrangebyscore)章节。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZREMRANGEBYSCORE numbers (2 4
(integer) 2
redis> ZRANGEBYSCORE numbers -inf +inf
1) "one"
2) "two"
3) "five"
```

## ZRANK

`ZRANK`命令用于获取元素在有序集合中按`score`值从小到排序后的位置，并返回以0为基准的索引值。即当返回`0`时，表示对应元素的`score`值为有序集合中的最小值。当集合中不存在指定元素或集合不存在时将返回`nil`。

```
ZRANK key member
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZRANK numbers "one"
(integer) 0
redis> ZRANK numbers "three"
(integer) 2
redis> ZRANK numbers "four"
(nil)
```

## ZREVRANK

`ZREVRANK`与`ZRANK`命令类似，用于获取元素在有序集合中的位置，二者区别为`ZREVRANK`依照`score`值从大到小的顺序排列。

```
ZREVRANK key member
```

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three"
(integer) 3
redis> ZRANK numbers "one"
(integer) 2
redis> ZRANK numbers "three"
(integer) 0
redis> ZRANK numbers "four"
(nil)
```

## ZREMRANGEBYRANK

`ZREMRANGEBYRANK`命令用于移除有序集合中按`score`值从小到大排序后参数`start`与`stop`所指定索引范围内的元素，并返回实际移除的元素个数。

```
ZREMRANGEBYRANK key start stop
```

当参数值为负数，代表按`score`值按从大到小排序后的索引值。例如`-1`代表`score`值最高的元素，`-2`代表`score`值第二高的元素。

### 示例

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZREMRANGEBYRANK numbers 1 2
(integer) 2
redis> ZRANGEBYSCORE numbers -inf +inf
1) "one"
2) "four"
3) "five"
```

使用负数值的情况：

```sh
redis> ZADD numbers 1 "one" 2 "two" 3 "three" 4 "four" 5 "five"
(integer) 5
redis> ZREMRANGEBYRANK numbers -2 -1
(integer) 2
redis> ZRANGEBYSCORE numbers -inf +inf
1) "one"
2) "two"
3) "three"
# 混合使用正负值
redis> ZREMRANGEBYRANK numbers 1 -1
(integer) 2
redis> ZRANGEBYSCORE numbers -inf +inf
1) "one"
```

## ZRANGEBYLEX

`ZRANGEBYLEX`用于在有序集合中所有元素`score`值相同的情况下返回指定范围的以字典序从小到大排序的元素。若集合中元素存在着不同的`score`值，则返回的结果是不确定的。

```
ZRANGEBYLEX key min max [LIMIT offset count]
```

字典序的排序使用`memcmp()`函数实现，对集合中的元素进行逐个对比。字典序中，相同位置下较小的字符表示该成员小于另一成员，该位置字符相同的情况下将继续对比后续字符。例如，字符串`"a"`小于`"aa"`小于`"b"`。

使用`-`与`+`分别表示正负无穷大的字符串，命令`ZRANGEBYLEX key - +`表示以字典序列出所有的元素。

另外，可以使用`(`以及`[`表示是否包括指定的字符串。其中，`(`表示为开区间，即端点不包括指定的字符串；`[`表示为闭区间，即端点包括指定的字符串。在示例中我们将为大家展示几个使用`(`与`[`的情况。

同样，`ZRANGEBYLEX`也可以使用`LIMIT`选项指定返回结果的偏移以及数量。

### 示例

```sh
redis> ZADD zset 0 "A" 0 "a" 0 "aa" 0 "b"
(integer) 4
redis> ZRANGEBYLEX zset - +
1) "A"
2) "a"
3) "aa"
4) "b"
```

使用`(`、`[`表示开闭区间的情况：

```sh
redis> ZADD zset 0 "A" 0 "a" 0 "aa" 0 "b"
(integer) 4
# 不包括端点A但包括端点b的情况
redis> ZRANGEBYLEX zset (A b
1) "a"
2) "aa"
3) "b"
# 包括端点A但不包括端点b的情况
redis> ZRANGEBYLEX zset [A (b
1) "A"
2) "a"
3) "aa"
```

## ZREVRANGEBYLEX

`ZREVRANGEBYLEX`命令与`ZRANGEBYLEX`命令相似，它同样在`score`值相同的情况下以字典序返回指定返回的结果，但结果为从大到小排序。

```
ZREVRANGEBYLEX key max min [LIMIT offset count]
```

### 示例

```sh
redis> ZADD zset 0 A 0 a 0 aa 0 b
(integer) 4
redis> ZREVRANGEBYLEX zset + -
1) "b"
2) "aa"
3) "a"
4) "A"
```

## ZREMRANGEBYLEX

`ZREMRANGEBYLEX`命令用于移除有序集合中以字典序排序指定范围内的元素，并返回实际移除的元素数量。关于范围的表示，可参考[`ZRANGEBYLEX`](#zrangebylex)命令中的说明。

```
ZREMRANGEBYLEX key min max
```

### 示例

```sh
redis> ZADD zset 0 "A" 0 "a" 0 "aa" 0 "b" 0 "bb"
(integer) 5
redis> ZREMRANGEBYLEX zset [a (b
(integer) 2
redis> ZRANGEBYLEX zset - +
1) "A"
2) "b"
3) "bb"
```

## ZLEXCOUNT

`ZLEXCOUNT`命令用于获取有序集合中以字典序排序指定范围内元素的数量。关于范围的表示，可参考[`ZRANGEBYLEX`](#zrangebylex)命令中的说明。

```
ZLEXCOUNT key min max
```

### 示例

```sh
redis> ZADD zset 0 "A" 0 "a" 0 "aa" 0 "b" 0 "bb"
(integer) 5
redis> ZLEXCOUNT zset (A [bb
(integer) 4
redis> ZRANGEBYLEX zset (A [bb
1) "a"
2) "aa"
3) "b"
4) "bb"
```

## ZUNIONSTORE

`ZUNIONSTORE`命令用于计算由`numkeys`参数所指定数量的数个有序集合的并集，保存至`destination`参数所指定的有序集合中（若有序集合已存在将覆盖原有内容），并返回最终保存至`destination`指定集合中元素的个数。在默认情况下，最终结果集合中的元素的`score`值为其它几个集合中对应元素`score`值之和。

```
ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
```

`ZUNIONSTORE`接受使用`WEIGHTS`选项指定各个有序集合中元素`score`值在计算中的权重，其后续权重值的数量与集合的数量相同，且按顺序一一对应。各个集合中元素的`score`值将乘以对应集合的权重值，再传递至聚合函数中。在默认情况下，每个集合默认的权重都为1。

例如指令`ZUNIONSTORE dest 3 zset1 zset2 zset3 WEIGHTS 3 2 1`中，有序集合`zset1`对应的权重值为3，在后续并集的计算中，其元素的`score`值都将乘以3后再传递给聚合函数处理。而`zset2`对应的权重值为2，`zset3`对应的权重值为1。

使用`AGGREGATE`选项，可指定并集的聚合操作。Redis提供了三种聚合操作`SUM`、`MIN`以及`MAX`可供选择，在默认情况下，将使用`SUM`聚合操作。

三种聚合操作代表：

- `SUM`：各集合中对应元素的`score`值之和。
- `MIN`：各集合对应元素的`score`值中的最小值。
- `MAX`：各集合对应元素的`score`值中的最大值。

### 示例

```sh
redis> ZADD nums1 1 "one" 2 "two"
(integer) 2
redis> ZADD nums2 2 "two" 3 "three"
(integer) 2
redis> ZUNIONSTORE nums3 2 nums1 nums2
(integer) 3
redis> ZRANGEBYSCORE nums3 -inf +inf WITHSCORES
1) "one"
2) "1"
3) "three"
4) "3"
5) "two"
6) "4"
```

使用`WEIGHT`选项设置权重：

```sh
redis> ZUNIONSTORE nums3 2 nums1 nums2 WEIGHTS 1 3
(integer) 3
redis> ZRANGEBYSCORE nums3 -inf +inf WITHSCORES
1) "one"
2) "1"  # 1 * 1
3) "two"
4) "8"  # 2 * 1 + 2 * 3
5) "three"
6) "9"  # 3 * 3
```

使用`MAX`聚合操作：

```sh
redis> ZADD zset1 1 "a" 2 "b"
(integer) 2
redis> ZADD zset2 2 "a" 3 "b"
(integer) 2
redis> ZUNIONSTORE num3 2 nums1 nums2 AGGREGATE MAX
(integer) 2
redis> ZRANGEBYSCORE nums3 -inf +inf WITHSCORES
1) "a"
2) "2"
3) "b"
4) "3"
```

## ZINTERSTORE

`ZINTERSTORE`命令用于计算由`numkeys`参数所指定数量的数个有序集合的交集，保存至`destination`参数所指定的有序集合中（若有序集合已存在将覆盖原有内容），并返回最终保存至`destination`指定集合中元素的个数。在默认情况下，最终结果集合中的元素的`score`值为其它几个集合中对应元素`score`值之和。

```
ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
```

对于`ZINTERSTORE`命令的更多说明，请参考[`ZUNIONSTORE`](#zunionstore)命令。

### 示例

```sh
redis> ZADD nums1 1 "one" 2 "two"
(integer) 2
redis> ZADD nums2 2 "two" 3 "three"
(integer) 2
redis> ZINTERSTORE nums3 2 nums1 nums2
(integer) 1
redis> ZRANGEBYSCORE nums3 -inf +inf WITHSCORES
1) "two"
2) "4"
```

## 结束语

至此，我们已经了解了Redis中字符串、列表、哈希、集合、有序集合五种数据类型的有关命令。在后续文章中，将会继续为大家带来Redis 5中新增的STREAM类型命令以及其它的Redis相关命令与知识点。

## 参考资料

- [Command reference - Redis](https://redis.io/commands)
