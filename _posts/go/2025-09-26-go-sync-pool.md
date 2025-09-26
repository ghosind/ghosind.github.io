---
layout: post
title: Go源码分析之sync.Pool
date: 2025-09-26
categories: [Go]
tags: [Go, sync, Pool, 对象池]
excerpt: Golang标准库`sync.Pool`对象池源码分析。
---

Go标准库中提供了一个轻量级的对象池实现`sync.Pool`，它用来减少临时对象的重复分配与回收，从而降低GC压力。`sync.Pool`的设计基于Go的GMP模型，适合于存放短生命周期、可复用的对象。本文将对`sync.Pool`的使用方法及其源码实现进行分析。

## `sync.Pool`使用示例

`sync.Pool`在创建时可以指定一个`New`函数，用于在池中没有可用对象时创建新对象，并提供了`Get`与`Put`方法用于从对象池中获取和放回对象。下面的示例展示了如何使用`sync.Pool`来复用`bytes.Buffer`对象：

```go
var bufPool = sync.Pool{
  New: func() any {
    return new(bytes.Buffer)
  }
}

func poolExample() {
  b := bufPool.Get().(*bytes.Buffer)
  b.Reset()
  b.WriteString("Hello")
  b.WriteString(", ")
  b.WriteString("World!")
  fmt.Println(b.String())
  bufPool.Put(b)
}
// Output: Hello, World!
```

## `sync.Pool`源码分析

`sync.Pool`的设计围绕着Go的GMP模型，其核心结构体定义如下：

```go
type Pool struct {
  local unsafe.Pointer // 每个P中的本地对象池
  localSize uintptr // local数组大小

  victim unsafe.Pointer // 上次GC时的local对象池
  victimSize uintptr // victim数组大小

  New func() any // 用于创建新对象的函数
}
```

`sync.Pool`中的`local`字段是一个指向`poolLocal`类型数组的指针，它表示每个P中的本地对象池。该数组的大小由`localSize`字段指定。`sync.Pool`的`victim`字段与`local`类似，它表示在上次GC时的本地对象池，用于在GC后保留一些对象以供复用。

`sync.Pool`的核心思想是在先在当前P中获取对象，若没有则尝试从其它P中窃取。可以从`poolLocal`结构体中看到每个P的对象池设计：

```go
type poolLocal struct {
  private any // 当前P的私有对象，只能被当前P访问
  share poolChain // 当前P的共享对象链表，可被其它P窃取
}
```

在`poolLocal`中，`private`字段用于存放当前P的私有对象，只能被当前P访问。对于当前P来说，同时只会有一个G执行，因此不需要加锁。`share`字段是一个链表，用于存放当前P的共享对象，可被其它P窃取。

### `Get()`的实现流程

`sync.Pool`的`Get`方法用于从池中获取一个对象，其核心逻辑为依次从当前P、其它P、上次GC后幸存者对象池中获取对象，若均无可用对象则调用`New`函数创建新对象。具体步骤如下：

1. 尝试从当前P的`private`中获取，若存在则清空`private`并返回该对象。`private`是只有当前P能访问的，因此不需要加锁；
2. 尝试从当前P的`share`链表的头部获取；
3. 尝试从其它P的`share`链表中窃取；
4. 从上次GC后的`victim`中获取；
5. 调用`New`创建新对象。

### `Put()`的实现流程

`sync.Pool`的`Put`方法用于将对象放回池中，它的实现较为简单，且不涉及跨P对象池的操作。其核心逻辑为优先放入当前P的`private`，若已存在则放入`share`链表。具体步骤如下：

1. 如果当前P的`private`为空，则放入`private`；
2. 放入当前P的`share`链表中。

## `sync.Pool`与垃圾回收

在`sync.Pool`的设计中，每次GC时都会清空当前的`victim`池并将当前的`local`池转移至`victim`，该设计主要是为了防止`sync.Pool`中的对象长期存在而被视为缓存，进而造成内存泄漏。基于该设计，在使用`sync.Pool`时应注意避免将其当作缓存使用。

因此，使用`sync.Pool`并不能保证对象长期存在且被复用。若GC频繁发生，也可能会导致对象频繁被清空和重新创建，从而无法达到预期的性能提升效果。

另外，也需要避免在`sync.Pool`中存放大对象，在GC清空时大对象会导致内存峰值的上升。

## 总结

`sync.Pool`是Go标准库中提供的轻量级对象池，它基于GMP模型的设计有效减少了临时对象的分配与回收，并降低了GC压力。合理使用`sync.Pool`可以提升程序性能，但也需要注意其设计限制，避免将其当作缓存使用。通过本文的源码分析，希望能帮助读者更好地理解`sync.Pool`的工作原理及其适用场景。
