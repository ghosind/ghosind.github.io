---
layout: post
title: Redis键空间通知（Keyspace Notification）
date: 2021-02-28
categories: [Redis]
tags: [Redis, notification, 事件通知]
excerpt: 以示例的方式简单地介绍Redis中的键空间消息提醒（keyspace notification）功能。
---

从Redis 2.8.0开始，Redis加入了发布/订阅模式以及键空间消息提醒（keyspace notification）功能。键空间消息提醒提供了允许客户端通过订阅指定信道获取Redis数据变化的能力。

需要注意的是，键空间消息提醒并非可靠的，它不会对订阅端是否接收到消息进行确认。例如某个订阅的客户端暂时断开连接，在其直到恢复连接期间发生的事件将无法再次获得。

## 配置

在默认情况下，Redis并未开启键空间消息提醒功能。为了打开该功能，需要通过`notify-keyspace-events`配置进行设置，例如：

```sh
redis> CONFIG GET notify-keyspace-events
1) "notify-keyspace-events"
2) ""
redis> CONFIG SET notify-keyspace-events KEA
OK
redis> CONFIG GET notify-keyspace-events
1) "notify-keyspace-events"
2) "AKE"
```

在上述示例中将`notify-keyspace-events`配置为`KEA`，代表除未命中外的所有事件。其中，`K`与`E`代表事件的两种类型——`Keyspace`与`Keyevent`。`Keyspace`代表与事件名称相关的消息，例如订阅对指定键进行的操作事件；`Keyevent`代表与键名称相关的消息，例如订阅发生键过期事件的相关键名称。

关于更多的`notify-keyspace-events`配置，可参考下面的描述：

- `K`：Keyspace事件，将会以`__keyspace@<db>__`作为事件的前缀
- `E`：Keyevent事件，将会以`__keyevent@<db>__`作为事件的前缀
- `g`：非特定类型的通用命令，例如`DEL`、`EXPIRE`、`RENAME`等
- `$`：字符串命令，例如`SET`、`INCR`等
- `l`：列表命令，例如`LPUSH`、`LPOP`等
- `s`：集合命令，例如`SADD`、`SREM`等
- `h`：哈希表命令，例如`HSET`、`HINCRBY`等
- `z`：有序集合命令，例如`ZSET`、`ZREM`等
- `t`：流命令，例如`XADD`、`XDEL`等
- `x`：过期事件（在每个发生键过期的时候产生）
- `e`：淘汰事件（在每个发生键被淘汰的时候产生）
- `m`：未命中事件（在访问某个不存在的键时产生）
- `A`：配置`g$lshztxe`的别名，但不包括未命中事件`m`

## 订阅指定事件

在完成配置后，可通过`SUBSCRIBE`命令订阅指定信道实现对一个或多个指定事件的订阅。例如通过订阅`__keyevent@0__:expired`实现订阅数据库0中的键过期事件例如[示例1:订阅键过期事件](#订阅键过期事件)。

订阅的信道的格式为`__<type>@<db>__:<event>`，其包括了事件类型（`keyspace`或`keyevent`）、数据库（例如数据库`0`）以及事件（例如`expired`）三部分组成。对应事件的名称，可参考下文[命令事件](#命令事件)章节。

另外，也可以通过`PSUBSCRIBE`命令订阅一个或多个复合正则表达式匹配的信道。例如通过订阅`__key*@*__:*`订阅Redis中所有数据库中的所有事件。

## 命令事件

Redis为许多命令提供了不同的事件，在本文中将选择其中部分命令及其对应的事件进行介绍：

- `DEL`：在某个键被删除时产生`del`事件
- `EXPIRE`、`PEXPIRE`、`EXPIREAT`以及`PEXPIREAT`：当设置正数过期时间或未来时间的时间戳，则产生`expire`事件，否则产生`del`事件（将立即被删除）
- `SET`以及同类的`SETEX`、`SETNX`、`GETSET`：产生`set`事件，若使用`SETEX`则也会产生`expire`事件
- `MSET`：将会为每个键都产生一个`set`事件
- `LPUSH`、`LPUSHX`与`RPUSH`、`RPUSHX`：根据插入的方向分别产生`lpush`或`rpush`事件
- `RPOP`、`LPOP`：分别产生`rpop`与`lpop`事件，若移出的是列表中的最后一个元素，将会同时产生`del`事件
- `LSET`：产生`lset`事件
- `LREM`：产生`lrem`事件，同样若移除的元素为列表中的最后一个元素时将同时产生`del`事件
- `HSET`、`HSETNX`以及`HMSET`：产生一个`hset`事件
- `HDEL`：产生一个`hdel`事件，且在移除后哈希表为空的情况下产生`del`事件
- `SADD`：产生一个`sadd`事件
- `SREM`：产生一个`srem`事件，且在移除后集合为空的情况下产生`del`事件
- `SMOVE`：原键中产生`srem`事件且在目标键中产生`sadd`事件
- `SINTERSTORE`、`SUNIONSTORE`、`SDIFFSTORE`：分别产生`sinterstore`、`sunionstore`以及`sdiffstore`事件，且在结果为空集且目标键存在的情况下，将会产生`del`事件
- `ZADD`：无论添加几个元素都只产生一个`zadd`事件
- `ZREM`：无论移除几个元素都只产生一个`zrem`事件，当移除后有序集合为空时产生`del`事件
- `XADD`：产生`xadd`事件，若使用`MAXLEN`子命令可能会同时产生`xtrim`事件
- `XDEL`：产生`xdel`事件
- `PERSIST`：如果对应的键所关联的过期事件成功被移除，则产生`persist`事件
- 在键发生过期时产生`expired`事件
- 在达到`maxmemory`设定的内存值后发生键淘汰时产生`evicted`事件
- ……

关于更多的命令相关事件，请参考[keyspace notification相关文档](https://redis.io/topics/notifications)

## 示例

### 订阅键过期事件

```sh
redis1> SUBSCRIBE __keyevent@0__:expired
1) "subscribe"
2) "__keyevent@0__:expired"
3) (integer) 1
# redis2> SETEX greeting 1 "hello world"
# 等待1秒后：
1) "message"
2) "__keyevent@0__:expired"
3) "greeting"
```

### 订阅所有事件

```sh
redis1> PSUBSCRIBE __key*@*__:*
1) "psubscribe"
2) "__key*@*__:*"
3) (integer) 1
# redis2> SET greeting "hello world"
1) "pmessage"
2) "__key*@*__:*"
3) "__keyspace@0__:greeting"
4) "set"
1) "pmessage"
2) "__key*@*__:*"
3) "__keyevent@0__:set"
4) "greeting"
```

## 参考资料

- [Redis keyspace notifications](https://redis.io/topics/notifications)
